export enum STORAGE_PROVIDER {
  S3 = 's3',
}

export interface StorageProvider {
  uploadFile(file: Buffer, key: string, contentType: string): Promise<string>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

export interface StorageConfig {
  provider: STORAGE_PROVIDER;
  config: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };
}
