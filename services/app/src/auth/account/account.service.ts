import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { UserEntity, AccountEntity } from '../../database/entities';
import { AUTH_DB } from '../../database/typeorm-connections';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity, AUTH_DB)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(UserEntity, AUTH_DB)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAccount(userId: string) {
    const account = await this.accountRepo.findOne({ where: { userId } });
    if (!account) {
      throw new RpcException('Account not found');
    }
    return account;
  }

  async updateAccount(userId: string, update: UpdateAccountDto) {
    const existingUser = await this.userRepo.findOne({ where: { id: userId } });

    if (!existingUser) {
      throw new RpcException({
        statusCode: 404,
        message: `User with id '${userId}' not found. Cannot update non-existent user.`,
      });
    }

    await this.userRepo.update(
      { id: userId },
      {
        ...(update.name !== undefined && { name: update.name }),
        ...(update.avatarUrl !== undefined && {
          profilePictureUrl: update.avatarUrl,
        }),
        ...(update.bio !== undefined && { bio: update.bio }),
        ...(update.dateOfBirth !== undefined && {
          dateOfBirth: update.dateOfBirth,
        }),
        ...(update.address !== undefined && { address: update.address }),
      },
    );

    const updatedUser = await this.userRepo.findOne({ where: { id: userId } });

    return {
      message: 'User account updated successfully',
      data: {
        _id: updatedUser!.id,
        userId: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        avatarUrl: updatedUser!.profilePictureUrl,
        bio: updatedUser!.bio || '',
        dateOfBirth: updatedUser!.dateOfBirth || null,
        address: updatedUser!.address || '',
      },
    };
  }
}
