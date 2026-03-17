import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage.interface';

export interface S3StorageOptions {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3StorageOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region || 'us-east-1',
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

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
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
