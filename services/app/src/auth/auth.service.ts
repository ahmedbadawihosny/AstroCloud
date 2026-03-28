/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { WaitlistService } from './waitlist/waitlist.service';
import { NotificationService } from './notification/notification.service';
import configuration from './common/config/configuration';
import type { UploadedFile } from './common/interfaces/file.interface';
import {
  UserEntity,
  AccountEntity,
  RefreshTokenEntity,
  EmailVerificationEntity,
  PasswordResetEntity,
} from '../database/entities';
import { AUTH_DB } from '../database/typeorm-connections';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import { ProviderEnum } from './enums/provider.enum';
import { NatsClient } from '@file-sharing-app/common';
import { EVENTS } from '@file-sharing-app/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity, AUTH_DB)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AccountEntity, AUTH_DB)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(RefreshTokenEntity, AUTH_DB)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    @InjectRepository(EmailVerificationEntity, AUTH_DB)
    private readonly emailVerificationRepo: Repository<EmailVerificationEntity>,
    @InjectRepository(PasswordResetEntity, AUTH_DB)
    private readonly passwordResetRepo: Repository<PasswordResetEntity>,
    private readonly nats: NatsClient,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlistService: WaitlistService,
    private readonly notificationService: NotificationService,
  ) {}

  private async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  private signAccessToken(userId: string, role: string) {
    return this.jwtService.sign(
      { userId, role },
      {
        secret:
          configuration().JWT.JWT_ACCESS_SECRET || 'fallback-secret-key',
        expiresIn: (configuration().JWT.JWT_ACCESS_EXPIRES_IN || '1h') as any,
      },
    );
  }

  private signRefreshToken(userId: string, role: string) {
    return this.jwtService.sign(
      { userId, role, type: 'refresh' },
      {
        secret:
          configuration().JWT.JWT_REFRESH_SECRET ||
          'fallback-refresh-secret-key',
        expiresIn: (configuration().JWT.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      },
    );
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new RpcException({
        statusCode: 400,
        message: 'Email already exists',
        error: 'Bad Request',
      });
    }

    try {
      const passwordHash = await this.hashPassword(dto.password);
      const user = this.userRepo.create({
        name: dto.name,
        email: normalizedEmail,
        password: passwordHash,
        role: 'PENDING',
        isVerified: false,
        isActive: true,
        profilePictureUrl: null,
        knowAboutUs: null,
        couponCode: null,
        expireCouponCode: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isPremiumAccount: false,
        lastLogin: null,
        bio: null,
        dateOfBirth: null,
        address: null,
      });
      await this.userRepo.save(user);

      try {
        await this.nats.publish(EVENTS.USER_CREATED, {
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[AuthService] user_created publish failed:', err);
      }

      const account = this.accountRepo.create({
        userId: user.id,
        provider: ProviderEnum.EMAIL,
        providerId: normalizedEmail,
        refreshToken: null,
        tokenExpiry: null,
      });
      await this.accountRepo.save(account);

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const ev = this.emailVerificationRepo.create({
        email: normalizedEmail,
        verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
      });
      await this.emailVerificationRepo.save(ev);

      await this.notificationService.sendEmailVerification({
        email: normalizedEmail,
        name: dto.name,
        code: verificationCode,
      });

      return {
        message: 'User registered successfully, verification code sent',
      };
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new RpcException({
          statusCode: 400,
          message: 'Email already exists',
          error: 'Bad Request',
        });
      }

      throw new RpcException({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Error',
      });
    }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const record = await this.emailVerificationRepo.findOne({
      where: {
        email,
        verificationCode: dto.code,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired verification code',
        error: 'Bad Request',
      });
    }

    record.used = true;
    await this.emailVerificationRepo.save(record);

    user.isVerified = true;
    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  async uploadProfilePicture(
    dto: UploadProfilePictureDto & { file: UploadedFile },
  ) {
    const fileBuffer =
      typeof dto.file.buffer === 'string'
        ? Buffer.from(dto.file.buffer, 'base64')
        : dto.file.buffer;

    if (
      !configuration().AWS_S3_REGION ||
      !configuration().AWS_S3_ACCESS_KEY_ID ||
      !configuration().AWS_S3_SECRET_ACCESS_KEY ||
      !configuration().AWS_S3_BUCKET
    ) {
      throw new RpcException({
        statusCode: 500,
        message: 'AWS S3 is not properly configured',
        error: 'Internal Server Error',
      });
    }

    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const s3 = new S3Client({
      region: configuration().AWS_S3_REGION!,
      credentials: {
        accessKeyId: configuration().AWS_S3_ACCESS_KEY_ID!,
        secretAccessKey: configuration().AWS_S3_SECRET_ACCESS_KEY!,
      },
    });

    const ext = (
      dto.file.originalname?.split('.').pop() || 'jpg'
    ).toLowerCase();
    const key = `avatars/${dto.userId}/${uuidv4()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: configuration().AWS_S3_BUCKET!,
        Key: key,
        Body: fileBuffer,
        ContentType: dto.file.mimetype || 'application/octet-stream',
      }),
    );

    const url = `https://${configuration().AWS_S3_BUCKET}.s3.${configuration().AWS_S3_REGION}.amazonaws.com/${key}`;

    user.profilePictureUrl = url;
    await this.userRepo.save(user);

    return {
      message: 'Profile picture uploaded successfully',
      url,
    };
  }

  private omitUserPassword(user: UserEntity) {
    const { password: _p, ...rest } = user;
    return rest;
  }

  async login(dto: LoginDto) {
    const account = await this.accountRepo.findOne({
      where: { provider: ProviderEnum.EMAIL, providerId: dto.email },
    });
    if (!account) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    const userWithPassword = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id: account.userId })
      .getOne();

    if (!userWithPassword?.password) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    const isMatch = await bcrypt.compare(dto.password, userWithPassword.password);
    if (!isMatch) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid credentials',
        error: 'Bad Request',
      });
    }

    if (!userWithPassword.isVerified) {
      throw new RpcException({
        statusCode: 400,
        message: 'You should verify your email first',
        error: 'Bad Request',
      });
    }

    userWithPassword.lastLogin = new Date();
    await this.userRepo.save(userWithPassword);

    const accessToken = this.signAccessToken(
      userWithPassword.id,
      userWithPassword.role,
    );
    const refreshToken = this.signRefreshToken(
      userWithPassword.id,
      userWithPassword.role,
    );

    await this.refreshTokenRepo.delete({ userId: userWithPassword.id });
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: userWithPassword.id,
        tokenHash: refreshToken,
        jti: `${userWithPassword.id}-${Date.now()}`,
        deviceHash: dto.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    );

    return {
      message: 'User logged in successfully',
      data: {
        user: {
          _id: userWithPassword.id,
          id: userWithPassword.id,
          name: userWithPassword.name,
          email: userWithPassword.email,
          role: userWithPassword.role,
          isActive: userWithPassword.isActive,
          isVerified: userWithPassword.isVerified,
        },
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<{
        userId: string;
        role: string;
      }>(token, {
        secret:
          configuration().JWT.JWT_REFRESH_SECRET ||
          'fallback-refresh-secret-key',
      });

      const user = await this.userRepo.findOne({ where: { id: payload.userId } });
      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'User not found',
          error: 'Unauthorized',
        });
      }

      const accessToken = this.signAccessToken(user.id, user.role);
      const refreshToken = this.signRefreshToken(user.id, user.role);

      await this.refreshTokenRepo.delete({ userId: user.id });
      await this.refreshTokenRepo.save(
        this.refreshTokenRepo.create({
          userId: user.id,
          tokenHash: refreshToken,
          jti: `${user.id}-${Date.now()}`,
          deviceHash: 'unknown',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      );

      return {
        message: 'Refreshed token successfully',
        accessToken,
        refreshToken,
      };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      });
    }
  }

  async logout(token: string) {
    await this.refreshTokenRepo.delete({ tokenHash: token });
    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(accessToken: string) {
    try {
      const payload = this.jwtService.verify<{ userId: string; role: string }>(
        accessToken,
        {
          secret:
            configuration().JWT.JWT_ACCESS_SECRET || 'fallback-secret-key',
        },
      );
      const user = await this.userRepo.findOne({
        where: { id: payload.userId },
      });
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        });
      }
      return {
        message: 'Current user fetched successfully',
        user: this.omitUserPassword(user),
      };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid access token',
        error: 'Unauthorized',
      });
    }
  }

  async requestResetPassword(dto: RequestResetPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.passwordResetRepo.delete({ email: dto.email });
    await this.passwordResetRepo.save(
      this.passwordResetRepo.create({
        email: dto.email,
        resetCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      }),
    );

    await this.notificationService.sendPasswordResetCode({
      email: dto.email,
      code: resetCode,
    });

    return { message: 'A reset code has been sent successfully' };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const record = await this.passwordResetRepo.findOne({
      where: {
        email: dto.email,
        resetCode: dto.code,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired reset code',
        error: 'Bad Request',
      });
    }

    record.used = true;
    await this.passwordResetRepo.save(record);

    const resetToken = this.jwtService.sign(
      { email: dto.email, type: 'password-reset' },
      { expiresIn: '10m' },
    );

    return {
      message: 'Reset code verified successfully',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify<{ email: string; type: string }>(
        dto.resetToken,
      );
      if (payload.type !== 'password-reset') {
        throw new Error('Invalid reset token type');
      }

      const user = await this.userRepo.findOne({
        where: { email: payload.email },
      });
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        });
      }

      user.password = await this.hashPassword(dto.newPassword);
      await this.userRepo.save(user);

      await this.refreshTokenRepo.delete({ userId: user.id });

      return { message: 'Password reset successfully' };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid or expired reset token',
        error: 'Unauthorized',
      });
    }
  }
}
