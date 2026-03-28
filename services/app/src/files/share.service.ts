import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { createHash, randomBytes } from 'crypto';
import { FileEntity, ShareLinkEntity } from '../database/entities';
import { FILES_DB } from '../database/typeorm-connections';

export interface ShareLinkResult {
  shareId: string;
  token: string;
  fileId: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ResolvedShare {
  shareLinkId: string;
  fileId: string;
  userId: string;
}

function hashShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(FileEntity, FILES_DB)
    private readonly fileRepo: Repository<FileEntity>,
    @InjectRepository(ShareLinkEntity, FILES_DB)
    private readonly shareRepo: Repository<ShareLinkEntity>,
  ) {}

  async createShare(
    fileId: string,
    userId: string,
    expiresInSeconds: number,
  ): Promise<ShareLinkResult> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, userId, deletedAt: IsNull() },
    });
    if (!file) {
      throw new RpcException({
        statusCode: 404,
        message: 'File not found',
        error: 'Not Found',
      });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = hashShareToken(token);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const row = this.shareRepo.create({
      fileId,
      userId,
      tokenHash,
      expiresAt,
      downloadCount: 0,
    });
    await this.shareRepo.save(row);

    return {
      shareId: row.id,
      token,
      fileId,
      userId,
      expiresAt,
      createdAt: row.createdAt,
    };
  }

  async resolveByPlainToken(plainToken: string): Promise<ResolvedShare | null> {
    const tokenHash = hashShareToken(plainToken);
    const share = await this.shareRepo.findOne({ where: { tokenHash } });
    if (!share) return null;
    if (share.expiresAt < new Date()) return null;

    const file = await this.fileRepo.findOne({
      where: { id: share.fileId, deletedAt: IsNull() },
    });
    if (!file) return null;

    return {
      shareLinkId: share.id,
      fileId: share.fileId,
      userId: share.userId,
    };
  }

  async incrementDownloadCount(shareLinkId: string): Promise<void> {
    await this.shareRepo.increment({ id: shareLinkId }, 'downloadCount', 1);
  }
}
