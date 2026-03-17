import { Module } from '@nestjs/common';
import { STORAGE_PROVIDER, type StorageProvider } from './storage.interface';
import configuration from '../common/config/configuration';
import { S3StorageProvider } from './s3.storage';

class InMemoryStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, { body: Buffer; contentType: string }>();

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { body: Buffer.from(body), contentType });
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string }> {
    const entry = this.objects.get(key);
    if (!entry) {
      throw new Error(`Object not found: ${key}`);
    }
    return {
      body: Buffer.from(entry.body),
      contentType: entry.contentType,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    return `memory://download/${encodeURIComponent(key)}?expiresIn=${expiresInSeconds}`;
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: () => {
        const cfg = configuration();

        if (cfg.NODE_ENV === 'test') {
          return new InMemoryStorageProvider();
        }

        const { AWS_S3 } = cfg;
        if (!AWS_S3.BUCKET) {
          throw new Error('FILE_S3_BUCKET is required for S3 storage');
        }
        if (!AWS_S3.ACCESS_KEY_ID || !AWS_S3.SECRET_ACCESS_KEY) {
          throw new Error('AWS S3 credentials are required for S3 storage');
        }

        return new S3StorageProvider({
          region: AWS_S3.REGION,
          bucket: AWS_S3.BUCKET,
          accessKeyId: AWS_S3.ACCESS_KEY_ID,
          secretAccessKey: AWS_S3.SECRET_ACCESS_KEY,
        });
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}

