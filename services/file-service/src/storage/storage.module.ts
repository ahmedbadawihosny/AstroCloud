import { Module } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { STORAGE_PROVIDER, StorageProvider, GetObjectResult } from './storage.interface';

class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.FILE_S3_ENDPOINT || undefined;
    const region = process.env.FILE_S3_REGION || 'us-east-1';
    const accessKeyId = process.env.FILE_S3_ACCESS_KEY || '';
    const secretAccessKey = process.env.FILE_S3_SECRET_KEY || '';
    const forcePathStyle =
      (process.env.FILE_S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true';

    this.bucket = process.env.FILE_S3_BUCKET || '';
    if (!this.bucket) {
      throw new Error('FILE_S3_BUCKET is required for S3 storage');
    }

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  async get(key: string): Promise<GetObjectResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const res = await this.client.send(command);

    const chunks: Buffer[] = [];
    const bodyStream = res.Body as any;

    if (Buffer.isBuffer(bodyStream)) {
      chunks.push(bodyStream);
    } else if (bodyStream && typeof bodyStream.on === 'function') {
      await new Promise<void>((resolve, reject) => {
        bodyStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        bodyStream.on('end', () => resolve());
        bodyStream.on('error', (err: Error) => reject(err));
      });
    }

    return {
      body: Buffer.concat(chunks),
      contentType: res.ContentType || 'application/octet-stream',
    };
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }
}

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: S3StorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
