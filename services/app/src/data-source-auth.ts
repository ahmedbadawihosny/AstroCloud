import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import {
  UserEntity,
  AccountEntity,
  RefreshTokenEntity,
  EmailVerificationEntity,
  PasswordResetEntity,
} from './database/entities';
import { InitialSchemaAuth1730160000001 } from './migrations/1730160000001-InitialSchemaAuth';

config({ path: resolve(__dirname, '../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL_AUTH,
  entities: [
    UserEntity,
    AccountEntity,
    RefreshTokenEntity,
    EmailVerificationEntity,
    PasswordResetEntity,
  ],
  migrations: [InitialSchemaAuth1730160000001],
  synchronize: false,
});
