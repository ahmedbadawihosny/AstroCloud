import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { File, FileDocument } from './file.schema';
import { v4 as uuidv4 } from 'uuid';

export interface ShareLink {
  shareId: string;
  fileId: string;
  userId: string;
  expiresAt?: Date;
  createdAt: Date;
  downloadCount: number;
  maxDownloads?: number;
}

@Injectable()
export class ShareService {
  private shareLinks: Map<string, ShareLink> = new Map();

  constructor(
    @InjectModel(File.name)
    private readonly fileModel: Model<FileDocument>,
  ) {}

  async createShare(fileId: string, userId: string, expiresInSeconds?: number): Promise<ShareLink> {
    const file = await this.fileModel.findOne({ _id: fileId, userId }).exec();
    if (!file) {
      throw new RpcException('File not found');
    }

    const shareId = uuidv4();
    const shareLink: ShareLink = {
      shareId,
      fileId,
      userId,
      createdAt: new Date(),
      downloadCount: 0,
      maxDownloads: expiresInSeconds ? 100 : undefined, // Default max downloads
    };

    if (expiresInSeconds) {
      shareLink.expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    }

    this.shareLinks.set(shareId, shareLink);
    return shareLink;
  }

  async getShare(shareId: string): Promise<ShareLink | null> {
    const share = this.shareLinks.get(shareId);
    
    if (!share) {
      return null;
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      this.shareLinks.delete(shareId);
      return null;
    }

    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      this.shareLinks.delete(shareId);
      return null;
    }

    return share;
  }

  async incrementDownloadCount(shareId: string): Promise<void> {
    const share = this.shareLinks.get(shareId);
    if (share) {
      share.downloadCount++;
    }
  }

  async deleteShare(shareId: string, userId: string): Promise<void> {
    const share = this.shareLinks.get(shareId);
    if (share && share.userId === userId) {
      this.shareLinks.delete(shareId);
    }
  }
}
