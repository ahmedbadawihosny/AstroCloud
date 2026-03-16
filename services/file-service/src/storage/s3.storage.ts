import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider } from './storage.interface';

export interface S3StorageOptions {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3StorageOptions) {
    this.bucket = options.bucket;
    const hasCustomEndpoint = Boolean(options.endpoint?.trim());
    this.client = new S3Client({
      region: options.region || 'us-east-1',
      ...(hasCustomEndpoint && {
        endpoint: options.endpoint,
        forcePathStyle: options.forcePathStyle ?? true,
      }),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    return this.putObject(key, body, contentType);
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string }> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const body = response.Body ? Buffer.from(await response.Body.transformToByteArray()) : Buffer.alloc(0);
    const contentType = (response.ContentType as string) || 'application/octet-stream';
    return { body, contentType };
  }

  async getObjectStream(key: string): Promise<import('stream').Readable> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) throw new Error('Empty body');
    return response.Body as import('stream').Readable;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async delete(key: string): Promise<void> {
    return this.deleteObject(key);
  }
}
