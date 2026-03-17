import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { User } from '../schema/user.schema';
import { Account, AccountDocument } from '../schema/account.schema';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

  async findAccount(userId: string) {
    const account = await this.accountModel.findOne({ userId }).exec();
    if (!account) {
      throw new RpcException('Account not found');
    }
    return account;
  }

  async updateAccount(userId: string, update: UpdateAccountDto) {
    // Check if user exists
    const existingUser = await this.userModel.findById(userId);

    if (!existingUser) {
      throw new RpcException({
        statusCode: 404,
        message: `User with id '${userId}' not found. Cannot update non-existent user.`,
      });
    }

    // Update the user with account data
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            ...(update.name && { name: update.name }),
            ...(update.avatarUrl && { profilePictureUrl: update.avatarUrl }),
            ...(update.bio !== undefined && { bio: update.bio }),
            ...(update.dateOfBirth !== undefined && {
              dateOfBirth: update.dateOfBirth,
            }),
            ...(update.address !== undefined && { address: update.address }),
          },
        },
        { new: true, runValidators: true },
      )
      .lean();

    return {
      message: 'User account updated successfully',
      data: {
        _id: updatedUser!._id,
        userId: updatedUser!._id,
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
