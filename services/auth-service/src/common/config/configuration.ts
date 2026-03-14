export default function configuration() {
  return {
    JWT: {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret-key',
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key',
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    AWS_S3_REGION: process.env.AWS_S3_REGION || process.env.FILE_S3_REGION || '',
    AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID || process.env.FILE_S3_ACCESS_KEY || '',
    AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.FILE_S3_SECRET_KEY || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || process.env.FILE_S3_BUCKET || '',
  };
}
