-- Runs once on first container start (docker-compose mounts this under docker-entrypoint-initdb.d).
--
-- Matches root docker-compose postgres service:
--   POSTGRES_USER=fileshare  POSTGRES_PASSWORD=fileshare  POSTGRES_DB=auth_db
-- auth_db is created automatically; this script adds the second DB for TypeORM "files" connection.

CREATE DATABASE file_sharing_db;
GRANT ALL PRIVILEGES ON DATABASE file_sharing_db TO fileshare;

-- PostgreSQL 15+: CREATE on schema public is not granted to everyone; allow app migrations.
\c file_sharing_db
GRANT ALL ON SCHEMA public TO fileshare;
