# MongoDB

Two instances are defined in root docker-compose:

- **mongodb-auth** (port 27017) → auth_db
- **mongodb-file** (port 27018) → file_db

Use `MONGODB_URI` per service as in .env.example.
