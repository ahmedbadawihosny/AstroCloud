import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { FileEntity, ShareLinkEntity } from './database/entities';
import { InitialSchemaFiles1730160000002 } from './migrations/1730160000002-InitialSchemaFiles';

config({ path: resolve(__dirname, '../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL_FILE_SHARING,
  entities: [FileEntity, ShareLinkEntity],
  migrations: [InitialSchemaFiles1730160000002],
  synchronize: false,
});
