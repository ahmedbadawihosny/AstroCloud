import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/auth/auth.module';
import { AccountModule } from '../../src/account/account.module';
import { AuthService } from '../../src/auth/auth.service';
import { AccountService } from '../../src/account/account.service';
import { NatsClient } from '@file-sharing-app/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { VerifyEmailDto } from '../../src/auth/dto/verify-email.dto';
import { UpdateAccountDto } from '../../src/account/dto/update-account.dto';

jest.setTimeout(120000);

const describeIfMongo =
  process.env.E2E_MONGODB_URI || process.env.MONGODB_URI
    ? describe
    : describe.skip;

describeIfMongo('Auth Service Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let accountService: AccountService;
  let moduleRef: TestingModule;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    const envUri = process.env.E2E_MONGODB_URI || process.env.MONGODB_URI;
    const mongoUri =
      envUri ||
      (await (async () => {
        mongo = await MongoMemoryServer.create();
        return mongo.getUri();
      })());

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        MongooseModule.forRoot(mongoUri),
        AuthModule,
        AccountModule,
      ],
    })
      .overrideProvider(NatsClient)
      .useValue({
        publish: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    accountService = moduleFixture.get<AccountService>(AccountService);
    moduleRef = moduleFixture;

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (moduleRef) {
      await moduleRef.close();
    }
    if (mongo) {
      await mongo.stop();
    }
  });

  describe('Complete User Flow', () => {
    const testUser = {
      name: 'Integration Test User',
      email: 'integration-test@example.com',
      password: 'testpassword123',
    };

    let userId: string;
    let accessToken: string;
    let refreshToken: string;

    it('should register a new user', async () => {
      const registerDto: RegisterDto = testUser;

      const result = await authService.register(registerDto);

      expect(result.message).toBe('User registered successfully, verification code sent');
    });

    it('should fail login before email verification', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
        userAgent: 'test-agent',
      };

      await expect(authService.login(loginDto)).rejects.toThrow('You should verify your email first');
    });

    it('should find user account after registration', async () => {
      // Find user by email to get userId
      const users = await (authService as any).userModel.find({ email: testUser.email.toLowerCase() });
      expect(users).toHaveLength(1);
      userId = users[0]._id.toString();
    });

    it('should verify email successfully', async () => {
      // Get verification code from database
      const verificationRecord = await (authService as any).emailVerificationModel.findOne({
        email: testUser.email.toLowerCase()
      });

      expect(verificationRecord).toBeTruthy();
      expect(verificationRecord.verificationCode).toBeTruthy();

      const verifyEmailDto: VerifyEmailDto = {
        email: testUser.email,
        code: verificationRecord.verificationCode,
      };

      const result = await authService.verifyEmail(verifyEmailDto);

      expect(result.message).toBe('Email verified successfully');
    });

    it('should login successfully after email verification', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
        userAgent: 'test-agent',
      };

      const result = await authService.login(loginDto);

      expect(result.message).toBe('User logged in successfully');
      expect(result.data.user.email).toBe(testUser.email);
      expect(result.data.accessToken).toBeTruthy();
      expect(result.data.refreshToken).toBeTruthy();

      accessToken = result.data.accessToken;
      refreshToken = result.data.refreshToken;
    });

    it('should get current user with access token', async () => {
      const result = await authService.getCurrentUser(accessToken);

      expect(result.message).toBe('Current user fetched successfully');
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.name).toBe(testUser.name);
    });

    it('should find user account via account service', async () => {
      const result = await accountService.findOne(userId);

      expect(result.message).toBe('User account found successfully');
      expect(result.data.email).toBe(testUser.email);
      expect(result.data.name).toBe(testUser.name);
    });

    it('should update user account', async () => {
      const updateDto: UpdateAccountDto = {
        name: 'Updated Test User',
        bio: 'Updated bio for integration test',
        address: 'Updated address',
      };

      const result = await accountService.update(userId, updateDto);

      expect(result.message).toBe('User account updated successfully');
      expect(result.data.name).toBe(updateDto.name);
      expect(result.data.bio).toBe(updateDto.bio);
      expect(result.data.address).toBe(updateDto.address);
    });

    it('should refresh access token', async () => {
      const result = await authService.refreshToken(refreshToken);

      expect(result.message).toBe('Refreshed token successfully');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();

      accessToken = result.accessToken;
      refreshToken = result.refreshToken;
    });

    it('should request password reset', async () => {
      const resetPasswordDto = {
        email: testUser.email,
      };

      const result = await authService.requestResetPassword(resetPasswordDto);

      expect(result.message).toBe('A reset code has been sent successfully');
    });

    it('should logout successfully', async () => {
      const result = await authService.logout(refreshToken);

      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate email registration', async () => {
      const registerDto: RegisterDto = {
        name: 'Duplicate User',
        email: 'integration-test@example.com', // Same email as above
        password: 'password123',
      };

      await expect(authService.register(registerDto)).rejects.toThrow('Email already exists');
    });

    it('should handle login with invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'integration-test@example.com',
        password: 'wrongpassword',
        userAgent: 'test-agent',
      };

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should handle getting non-existent user', async () => {
      await expect(accountService.findOne('507f1f77bcf86cd799439999')).rejects.toThrow('User with id');
    });

    it('should handle invalid email verification', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'nonexistent@example.com',
        code: '123456',
      };

      await expect(authService.verifyEmail(verifyEmailDto)).rejects.toThrow('User not found');
    });
  });
});
