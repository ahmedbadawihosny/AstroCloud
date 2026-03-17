# AWS S3 Storage

The file service now uses AWS S3 directly for object storage.

Configure these environment variables in `services/file-service/.env`:

- `FILE_S3_REGION`
- `FILE_S3_BUCKET`
- `FILE_S3_ACCESS_KEY`
- `FILE_S3_SECRET_KEY`

Uploads are sent straight to S3 and downloads are returned as pre-signed S3 URLs.
