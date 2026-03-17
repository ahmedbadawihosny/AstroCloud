export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export interface GetObjectResult {
  body: Buffer;
  contentType: string;
}

export interface StorageProvider {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<GetObjectResult>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
