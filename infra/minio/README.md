# MinIO (optional S3-compatible storage)

Production typically uses **AWS S3**. For local development you can run **MinIO** and point the app at it with the same **`FILE_S3_*`** variables (S3-compatible API).

Configure in **`services/app/.env`** (see **`services/app/.env.example`**):

| Use | Variables |
|-----|-----------|
| File objects | `FILE_S3_REGION`, `FILE_S3_BUCKET`, `FILE_S3_ACCESS_KEY`, `FILE_S3_SECRET_KEY` — set endpoint if your SDK needs it (e.g. `http://localhost:9000` for MinIO; AWS SDK v3 may use `AWS_ENDPOINT_URL` or custom client config). |
| Profile pictures | `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` |

### Example: run MinIO locally

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minio -e MINIO_ROOT_PASSWORD=minio123 \
  quay.io/minio/minio server /data --console-address ":9001"
```

Create a bucket in the console, then set **`FILE_S3_*`** (and endpoint as required by your stack) to match.
