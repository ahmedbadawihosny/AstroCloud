function toInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function configuration() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE: {
      MONGODB_URI_FILE_SHARING: process.env.MONGODB_URI_FILE_SHARING || 'mongodb://localhost:27017/file_sharing_db',
    },
    NATS: {
      URL: process.env.NATS_URL || 'nats://localhost:4222',
    },
    FILES: {
      MAX_UPLOAD_SIZE_BYTES: toInt(
        process.env.FILE_MAX_UPLOAD_SIZE_BYTES,
        100 * 1024 * 1024,
      ),
      DOWNLOAD_URL_EXPIRES_IN_SECONDS: toInt(
        process.env.FILE_DOWNLOAD_URL_EXPIRES_IN_SECONDS,
        15 * 60,
      ),
      SHARE_DOWNLOAD_URL_EXPIRES_IN_SECONDS: toInt(
        process.env.FILE_SHARE_DOWNLOAD_URL_EXPIRES_IN_SECONDS,
        15 * 60,
      ),
    },
    AWS_S3: {
      REGION: process.env.FILE_S3_REGION || 'us-east-1',
      BUCKET: process.env.FILE_S3_BUCKET || '',
      ACCESS_KEY_ID: process.env.FILE_S3_ACCESS_KEY || '',
      SECRET_ACCESS_KEY: process.env.FILE_S3_SECRET_KEY || '',
    },
  };
}

