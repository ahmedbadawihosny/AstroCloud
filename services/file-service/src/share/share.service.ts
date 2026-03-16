import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NatsClient, EVENTS } from '@file-sharing-app/common';
import { ShareLink, ShareLinkDocument } from './share-link.schema';
import { File, FileDocument } from '../files/file.schema';
import { STORAGE_PROVIDER, StorageProvider } from '../storage';

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

@Injectable()
export class ShareService {
  constructor(
    @InjectModel(ShareLink.name) private shareModel: Model<ShareLinkDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
    private readonly nats: NatsClient,
  ) {}

  async createShare(
    userId: string,
    fileId: string,
    expiresInSeconds: number,
  ): Promise<{ token: string; expiresAt: Date }> {
    const file = await this.fileModel.findById(fileId).exec();
    if (!file) throw new NotFoundException('File not found');
    if (file.deletedAt) throw new NotFoundException('File not found');
    if (file.userId.toString() !== userId) throw new ForbiddenException('Not the file owner');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const shareDoc = await this.shareModel.create({
      fileId: new Types.ObjectId(fileId),
      userId: new Types.ObjectId(userId),
      tokenHash: sha256(token),
      expiresAt,
    });

    try {
      await this.nats.publish(EVENTS.FILE_SHARED, {
        fileId,
        userId,
        shareId: shareDoc._id.toString(),
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      console.warn('[ShareService] file_shared publish failed:', err);
    }

    return { token, expiresAt };
  }

  async resolveToken(token: string): Promise<ShareLinkDocument> {
    const hash = sha256(token);
    const share = await this.shareModel
      .findOne({ tokenHash: hash, expiresAt: { $gt: new Date() } })
      .exec();
    if (!share) throw new NotFoundException('Link invalid or expired');
    return share as ShareLinkDocument;
  }

  async download(token: string): Promise<{
    contentType?: string;
    contentDisposition?: string;
    body?: string;
    encoding?: string;
  }> {
    const share = await this.resolveToken(token);
    const file = await this.fileModel.findById(share.fileId).exec();
    if (!file || file.deletedAt) throw new NotFoundException('File not found');

    const { body, contentType } = await this.storage.get(file.storageKey);
    return {
      contentType: contentType || 'application/octet-stream',
      contentDisposition: `attachment; filename="${file.originalName}"`,
      body: body.toString('base64'),
      encoding: 'base64',
    };
  }
}
