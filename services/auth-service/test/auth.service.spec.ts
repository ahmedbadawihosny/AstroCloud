import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from '../src/auth/auth.service';
import { WaitlistService } from '../src/waitlist/waitlist.service';
import { NotificationService } from '../src/notification/notification.service';
import { NatsClient } from '@file-sharing-app/common';
import { User } from '../src/auth/schema/user.schema';
import { Account } from '../src/auth/schema/account.schema';
import { RefreshToken } from '../src/auth/schema/refreshToken.schema';
import { EmailVerification } from '../src/auth/schema/emailVerification.schema';
import { PasswordReset } from '../src/auth/schema/passwordReset.schema';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { LoginDto } from '../src/auth/dto/login.dto';
import { VerifyEmailDto } from '../src/auth/dto/verify-email.dto';
import { ProviderEnum } from '../src/auth/enums/provider.enum';

const mockQuery = (value: any) => ({
  select: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('AuthService (unit)', () => {
  let service: AuthService;
  let userModel: any;
  let accountModel: any;
  let refreshTokenModel: any;
  let emailVerificationModel: any;
  let passwordResetModel: any;
  let jwtService: JwtService;
  let notificationService: NotificationService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'USER',
    isVerified: true,
    isActive: true,
    save: jest.fn(),
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      isVerified: true,
      isActive: true,
    }),
    comparePassword: jest.fn().mockResolvedValue(true),
  };

  const mockAccount = {
    _id: '507f1f77bcf86cd799439012',
    userId: '507f1f77bcf86cd799439011',
    provider: ProviderEnum.EMAIL,
    providerId: 'test@example.com',
  };

  beforeEach(async () => {
    const userModelCtor: any = jest.fn().mockImplementation((doc: any) => ({
      ...doc,
      _id: doc?._id ?? mockUser._id,
      save: jest.fn().mockResolvedValue({ ...doc, _id: doc?._id ?? mockUser._id }),
      toObject: mockUser.toObject,
      comparePassword: mockUser.comparePassword,
    }));
    userModelCtor.findOne = jest.fn();
    userModelCtor.findById = jest.fn();

    const accountModelCtor: any = jest.fn().mockImplementation((doc: any) => ({
      ...doc,
      save: jest.fn().mockResolvedValue(doc),
    }));
    accountModelCtor.findOne = jest.fn();

    const refreshTokenModelMock = {
      deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      create: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };

    const emailVerificationModelMock = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
    };

    const passwordResetModelMock = {
      findOne: jest.fn(),
      deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      create: jest.fn().mockResolvedValue({}),
    };

    const jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn().mockReturnValue({ userId: mockUser._id, role: 'USER' }),
    };

    const natsClientMock = { publish: jest.fn() };

    const notificationServiceMock = {
      sendEmailVerification: jest.fn(),
      sendPasswordResetCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModelCtor },
        { provide: getModelToken(Account.name), useValue: accountModelCtor },
        { provide: getModelToken(RefreshToken.name), useValue: refreshTokenModelMock },
        { provide: getModelToken(EmailVerification.name), useValue: emailVerificationModelMock },
        { provide: getModelToken(PasswordReset.name), useValue: passwordResetModelMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: NatsClient, useValue: natsClientMock },
        { provide: WaitlistService, useValue: {} },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get(AuthService);
    userModel = module.get(getModelToken(User.name));
    accountModel = module.get(getModelToken(Account.name));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    emailVerificationModel = module.get(getModelToken(EmailVerification.name));
    passwordResetModel = module.get(getModelToken(PasswordReset.name));
    jwtService = module.get(JwtService);
    notificationService = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      userModel.findOne.mockReturnValueOnce(mockQuery(null));

      const result = await service.register(registerDto);

      expect(userModel).toHaveBeenCalled();
      expect(accountModel).toHaveBeenCalled();
      expect(emailVerificationModel.create).toHaveBeenCalled();
      expect(notificationService.sendEmailVerification).toHaveBeenCalled();
      expect(result.message).toBe('User registered successfully, verification code sent');
    });

    it('should throw if email already exists', async () => {
      userModel.findOne.mockReturnValueOnce(mockQuery(mockUser));
      await expect(service.register(registerDto)).rejects.toThrow(RpcException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
      userAgent: 'test-agent',
    };

    it('should login user successfully', async () => {
      accountModel.findOne.mockReturnValueOnce(mockQuery(mockAccount));
      userModel.findById
        .mockReturnValueOnce(mockQuery(mockUser))
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({ ...mockUser, save: jest.fn().mockResolvedValue({}) }),
        });

      const result = await service.login(loginDto);
      expect(result.message).toBe('User logged in successfully');
      expect(result.data.accessToken).toBeTruthy();
      expect(result.data.refreshToken).toBeTruthy();
    });
  });

  describe('refreshToken', () => {
    it('should throw RpcException when token invalid', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(service.refreshToken('invalid')).rejects.toThrow(RpcException);
    });
  });
});
