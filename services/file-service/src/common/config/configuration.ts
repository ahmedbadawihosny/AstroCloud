export default function configuration() {
  return {
    DATABASE: {
      MONGODB_URI: process.env.MONGODB_URI,
    },
    AWS_S3: {
      REGION: process.env.FILE_S3_REGION,
      BUCKET: process.env.FILE_S3_BUCKET,
      ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
      SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
      ENDPOINT: process.env.AWS_S3_ENDPOINT,  
      FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    },
  };
}

