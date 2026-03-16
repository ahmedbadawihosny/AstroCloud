import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { NatsClient, EVENTS } from '@file-sharing-app/common';
import { File, FileDocument } from './file.schema';
import { STORAGE_PROVIDER, StorageProvider } from '../storage';
import { ShareService } from '../share/share.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
    private readonly nats: NatsClient,
    private readonly shareService: ShareService,
  ) {}

  async upload(payload: {
    userId: string;
    file: unknown;
    metadata?: Record<string, unknown>;
  }) {
    const userId = new Types.ObjectId(payload.userId);
    const file = payload.file as { buffer?: Buffer; originalname?: string; mimetype?: string };
    const buffer = Buffer.isBuffer(file?.buffer) ? file.buffer : Buffer.from([]);
    const originalName = (file?.originalname as string) || 'file';
    const mimeType = (file?.mimetype as string) || 'application/octet-stream';
    const storageKey = `${payload.userId}/${randomUUID()}-${originalName}`;

    await this.storage.putObject(storageKey, buffer, mimeType);

    const doc = await this.fileModel.create({
      userId,
      originalName,
      storageKey,
      size: buffer.length,
      mimeType,
      deletedAt: null,
    });

    try {
      await this.nats.publish(EVENTS.FILE_UPLOADED, {
        fileId: doc._id.toString(),
        userId: payload.userId,
        filename: doc.originalName,
        size: doc.size,
        mimeType: doc.mimeType,
        createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[FilesService] file_uploaded publish failed:', err);
    }

    return {
      message: 'File uploaded',
      data: {
        fileId: doc._id.toString(),
        originalName: doc.originalName,
        size: doc.size,
        mimeType: doc.mimeType,
        createdAt: (doc as any).createdAt,
      },
    };
  }

  async list(userId: string) {
    const list = await this.fileModel
      .find({ userId: new Types.ObjectId(userId), deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();
    return {
      message: 'Files listed',
      data: list.map((f) => ({
        fileId: (f as any)._id.toString(),
        originalName: f.originalName,
        size: f.size,
        mimeType: f.mimeType,
        createdAt: (f as { createdAt?: Date }).createdAt,
      })),
    };
  }

  async get(fileId: string, userId: string) {
    const doc = await this.fileModel.findOne({
      _id: new Types.ObjectId(fileId),
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    });
    if (!doc) throw new NotFoundException('File not found');
    const { body, contentType } = await this.storage.get(doc.storageKey);
    return {
      contentType,
      contentDisposition: `attachment; filename="${doc.originalName}"`,
      body: body.toString('base64'),
      encoding: 'base64',
    };
  }

  async delete(fileId: string, userId: string) {
    const doc = await this.fileModel.findOne({
      _id: new Types.ObjectId(fileId),
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    });
    if (!doc) throw new NotFoundException('File not found');
    await this.storage.deleteObject(doc.storageKey);
    const deletedAt = new Date();
    doc.deletedAt = deletedAt;
    await doc.save();
    try {
      await this.nats.publish(EVENTS.FILE_DELETED, {
        fileId: doc._id.toString(),
        userId,
        deletedAt: deletedAt.toISOString(),
      });
    } catch (err) {
      console.warn('[FilesService] file_deleted publish failed:', err);
    }
    return { message: 'File deleted' };
  }

  async share(fileId: string, userId: string, expiresInSeconds: number) {
    const { token, expiresAt } = await this.shareService.createShare(userId, fileId, expiresInSeconds);
    return {
      message: 'Share created',
      data: {
        fileId,
        token,
        expiresAt,
        shareUrl: `/share/${token}`,
      },
    };
  }
}
