import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { UserEntity, AccountEntity } from '../../database/entities';
import { AUTH_DB } from '../../database/typeorm-connections';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AccountEntity], AUTH_DB)],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
