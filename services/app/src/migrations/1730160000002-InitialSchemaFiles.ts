import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Files DB: no FK to auth DB — userId is a logical reference (same UUID as users.id).
 */
export class InitialSchemaFiles1730160000002 implements MigrationInterface {
  name = 'InitialSchemaFiles1730160000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "originalName" character varying NOT NULL,
        "storageKey" character varying NOT NULL,
        "size" integer NOT NULL,
        "mimeType" character varying NOT NULL,
        "checksumSha256" character varying,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_files_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_files_storageKey" ON "files" ("storageKey")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_userId_deletedAt" ON "files" ("userId", "deletedAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE "share_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "fileId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "downloadCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_share_links_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_share_links_file" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_share_links_tokenHash" ON "share_links" ("tokenHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "share_links"`);
    await queryRunner.query(`DROP TABLE "files"`);
  }
}
