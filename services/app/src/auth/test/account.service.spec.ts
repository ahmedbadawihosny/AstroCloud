import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/mongoose';
import { AccountService } from '../../../../auth-service/src/account/account.service';
import { User } from '../../../../auth-service/src/auth/schema/user.schema';
import { UpdateAccountDto } from '../../../../auth-service/src/account/dto/update-account.dto';

describe('AccountService', () => {
  let service: AccountService;
  let userModel: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    dateOfBirth: new Date('1990-01-01'),
    address: '123 Test St',
  };

  beforeEach(async () => {
    const mockUserModel = {
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      lean: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    userModel = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user account successfully', async () => {
      userModel.findById.mockResolvedValue(mockUser);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result.message).toBe('User account found successfully');
      expect(result.data).toEqual({
        _id: mockUser._id,
        userId: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        avatarUrl: mockUser.profilePictureUrl,
        bio: mockUser.bio,
        dateOfBirth: mockUser.dateOfBirth,
        address: mockUser.address,
      });
    });

    it('should throw RpcException if user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAccountDto = {
      name: 'Updated Name',
      bio: 'Updated bio',
      address: 'Updated address',
    };

    it('should update user account successfully', async () => {
      userModel.findById.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateDto };
      userModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        {
          $set: {
            name: updateDto.name,
            bio: updateDto.bio,
            address: updateDto.address,
          },
        },
        { new: true, runValidators: true }
      );
      expect(result.message).toBe('User account updated successfully');
      expect(result.data.name).toBe(updateDto.name);
      expect(result.data.bio).toBe(updateDto.bio);
      expect(result.data.address).toBe(updateDto.address);
    });

    it('should update only provided fields', async () => {
      userModel.findById.mockResolvedValue(mockUser);
      const partialUpdate: UpdateAccountDto = { name: 'New Name' };
      const updatedUser = { ...mockUser, name: 'New Name' };
      userModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      });

      await service.update('507f1f77bcf86cd799439011', partialUpdate);

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        {
          $set: {
            name: 'New Name',
          },
        },
        { new: true, runValidators: true }
      );
    });

    it('should handle undefined values correctly', async () => {
      userModel.findById.mockResolvedValue(mockUser);
      const updateWithUndefined: UpdateAccountDto = {
        bio: '',
        address: '',
      };
      const updatedUser = { ...mockUser, bio: '', address: '' };
      userModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      });

      await service.update('507f1f77bcf86cd799439011', updateWithUndefined);

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        {
          $set: {
            bio: '',
            address: '',
          },
        },
        { new: true, runValidators: true }
      );
    });

    it('should throw RpcException if user not found during update', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(RpcException);
    });
  });
});
