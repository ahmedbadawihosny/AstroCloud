export default function configuration() {
  return ({
    DATABASE: {
      AUTH_URL:
        process.env.DATABASE_URL_AUTH ||
        'postgresql://localhost:5432/auth_db',
    },
    JWT: {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    AWS_S3_REGION: process.env.AWS_S3_REGION || 'us-east-1',
    AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID || '',
    AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
    FILES: {
      MAX_UPLOAD_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
      DOWNLOAD_URL_EXPIRES_IN_SECONDS: 3600, // 1 hour
    },
  });
}
