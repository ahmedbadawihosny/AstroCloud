/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { randomUUID, createHash } from 'crypto';
import configuration from './common/config/configuration';
import { FileEntity } from '../database/entities';
import { FILES_DB } from '../database/typeorm-connections';
import { StorageService } from './storage.service';
import { ShareService } from './share.service';
import { NatsClient, EVENTS } from '@file-sharing-app/common';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity, FILES_DB)
    private readonly fileRepo: Repository<FileEntity>,
    private readonly storageService: StorageService,
    private readonly nats: NatsClient,
    private readonly shareService: ShareService,
  ) {}

  private get maxUploadSizeBytes() {
    return configuration().FILES.MAX_UPLOAD_SIZE_BYTES;
  }

  private get downloadUrlTtlSeconds() {
    return configuration().FILES.DOWNLOAD_URL_EXPIRES_IN_SECONDS;
  }

  private async buildFilePayload(doc: FileEntity) {
    const downloadUrl = await this.storageService.provider.getFileUrl(
      doc.storageKey,
    );

    return {
      fileId: doc.id,
      originalName: doc.originalName,
      size: doc.size,
      mimeType: doc.mimeType,
      checksumSha256: doc.checksumSha256 ?? null,
      metadata: doc.metadata ?? {},
      createdAt: doc.createdAt,
      deletedAt: doc.deletedAt ?? null,
      downloadUrl,
      downloadUrlExpiresAt: new Date(
        Date.now() + this.downloadUrlTtlSeconds * 1000,
      ).toISOString(),
    };
  }

  async upload(payload: {
    userId: string;
    file: unknown;
    metadata?: Record<string, unknown>;
  }) {
    const file = payload.file as {
      buffer?: Buffer;
      originalname?: string;
      mimetype?: string;
    };
    if (file?.buffer === undefined || file?.buffer === null) {
      throw new RpcException({
        statusCode: 400,
        message: 'File payload is required',
        error: 'Bad Request',
      });
    }

    const buffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer as any);
    const originalName = (file?.originalname as string) || 'file';
    const mimeType = (file?.mimetype as string) || 'application/octet-stream';

    if (buffer.length > this.maxUploadSizeBytes) {
      throw new RpcException({
        statusCode: 413,
        message: 'File exceeds the maximum upload size of 100MB',
        error: 'Payload Too Large',
      });
    }

    const storageKey = `${payload.userId}/${randomUUID()}-${originalName}`;
    const checksumSha256 = createHash('sha256').update(buffer).digest('hex');

    await this.storageService.provider.uploadFile(buffer, storageKey, mimeType);

    const doc = this.fileRepo.create({
      userId: payload.userId,
      originalName,
      storageKey,
      size: buffer.length,
      mimeType,
      checksumSha256,
      metadata: payload.metadata ?? {},
      deletedAt: null,
    });
    await this.fileRepo.save(doc);

    try {
      await this.nats.publish(EVENTS.FILE_UPLOADED, {
        fileId: doc.id,
        userId: payload.userId,
        filename: doc.originalName,
        size: doc.size,
        mimeType: doc.mimeType,
        checksumSha256,
        createdAt: doc.createdAt.toISOString(),
      });
    } catch (err) {
      console.warn('[FilesService] file_uploaded publish failed:', err);
    }

    return {
      message: 'File uploaded',
      data: await this.buildFilePayload(doc),
    };
  }

  async list(userId: string) {
    const list = await this.fileRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Files listed',
      data: await Promise.all(
        list.map(async (f) => ({
          fileId: f.id,
          originalName: f.originalName,
          size: f.size,
          mimeType: f.mimeType,
          checksumSha256: f.checksumSha256 ?? null,
          metadata: f.metadata ?? {},
          createdAt: f.createdAt,
          downloadUrl: await this.storageService.provider.getFileUrl(
            f.storageKey,
          ),
          downloadUrlExpiresAt: new Date(
            Date.now() + this.downloadUrlTtlSeconds * 1000,
          ).toISOString(),
        })),
      ),
    };
  }

  async get(fileId: string, userId: string) {
    const doc = await this.fileRepo.findOne({
      where: { id: fileId, userId, deletedAt: IsNull() },
    });

    if (!doc) {
      throw new RpcException({
        statusCode: 404,
        message: 'File not found',
        error: 'Not Found',
      });
    }

    return {
      message: 'File retrieved',
      data: await this.buildFilePayload(doc),
    };
  }

  async delete(fileId: string, userId: string) {
    const doc = await this.fileRepo.findOne({
      where: { id: fileId, userId, deletedAt: IsNull() },
    });

    if (!doc) {
      throw new RpcException({
        statusCode: 404,
        message: 'File not found',
        error: 'Not Found',
      });
    }

    await this.storageService.provider.deleteFile(doc.storageKey);
    const deletedAt = new Date();
    doc.deletedAt = deletedAt;
    await this.fileRepo.save(doc);

    try {
      await this.nats.publish(EVENTS.FILE_DELETED, {
        fileId: doc.id,
        userId,
        deletedAt: deletedAt.toISOString(),
      });
    } catch (err) {
      console.warn('[FilesService] file_deleted publish failed:', err);
    }

    return {
      message: 'File deleted',
      data: {
        fileId: doc.id,
        deletedAt: deletedAt.toISOString(),
      },
    };
  }

  async share(fileId: string, userId: string, expiresInSeconds: number) {
    const safeExpiresInSeconds = Math.max(
      60,
      Math.min(Number(expiresInSeconds) || 0, 7 * 24 * 60 * 60),
    );
    const shareLink = await this.shareService.createShare(
      fileId,
      userId,
      safeExpiresInSeconds,
    );

    try {
      await this.nats.publish(EVENTS.FILE_SHARED, {
        fileId,
        userId,
        shareId: shareLink.shareId,
        expiresAt: shareLink.expiresAt.toISOString(),
      });
    } catch (err) {
      console.warn('[FilesService] file_shared publish failed:', err);
    }

    return {
      message: 'Share created',
      data: {
        fileId,
        token: shareLink.token,
        shareId: shareLink.shareId,
        expiresAt: shareLink.expiresAt,
        shareUrl: `/api/v1/share/${shareLink.token}`,
      },
    };
  }

  async getShareDownload(token: string) {
    const resolved = await this.shareService.resolveByPlainToken(token);
    if (!resolved) {
      throw new RpcException({
        statusCode: 404,
        message: 'Share not found or expired',
        error: 'Not Found',
      });
    }

    const file = await this.fileRepo.findOne({
      where: { id: resolved.fileId, deletedAt: IsNull() },
    });
    if (!file) {
      throw new RpcException({
        statusCode: 404,
        message: 'File not found',
        error: 'Not Found',
      });
    }

    const downloadUrl = await this.storageService.provider.getFileUrl(
      file.storageKey,
    );
    await this.shareService.incrementDownloadCount(resolved.shareLinkId);

    return {
      data: {
        downloadUrl,
        originalName: file.originalName,
      },
    };
  }
}
