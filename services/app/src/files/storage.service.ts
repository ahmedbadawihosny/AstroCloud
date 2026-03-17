import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_PROVIDER, StorageProvider } from './storage.interface';
import configuration from '../auth/common/config/configuration';

@Injectable()
export class S3StorageService implements StorageProvider {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: configuration().AWS_S3_REGION,
      credentials: {
        accessKeyId: configuration().AWS_S3_ACCESS_KEY_ID!,
        secretAccessKey: configuration().AWS_S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: configuration().AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return key;
  }

  async getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: configuration().AWS_S3_BUCKET!,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: configuration().AWS_S3_BUCKET!,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}

@Injectable()
export class StorageService {
  constructor(private readonly s3StorageService: S3StorageService) { }

  get provider(): StorageProvider {
    return this.s3StorageService;
  }
}

export { StorageProvider }; // Re-export for other modules
