/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Client, RpcException } from '@nestjs/microservices';
import { WaitlistService } from './waitlist/waitlist.service';
import { NotificationService } from './notification/notification.service';
import configuration from './common/config/configuration';
import type { UploadedFile } from './common/interfaces/file.interface';
import {
  User,
  UserDocument,
  Account,
  AccountDocument,
  RefreshToken,
  RefreshTokenDocument,
  EmailVerification,
  EmailVerificationDocument,
  PasswordReset,
  PasswordResetDocument,
} from './schema';
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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly nats: NatsClient,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(PasswordReset.name)
    private readonly passwordResetModel: Model<PasswordResetDocument>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlistService: WaitlistService,
    private readonly notificationService: NotificationService,
  ) { }

  // ========== Helpers ==========

  private signAccessToken(userId: string, role: string) {
    return this.jwtService.sign({ userId, role });
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

  // ========== Register Flow Services ==========

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (existing) {
      throw new RpcException({
        statusCode: 400,
        message: 'Email already exists',
        error: 'Bad Request',
      });
    }

    try {
      const user = new this.userModel({
        name: dto.name,
        email: normalizedEmail,
        password: dto.password,
        role: 'PENDING',
        isVerified: false,
        isActive: true,
      });
      await user.save();

      try {
        await this.nats.publish(EVENTS.USER_CREATED, {
          userId: user._id.toString(),
          email: user.email,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[AuthService] user_created publish failed:', err);
      }

      const account = new this.accountModel({
        userId: user._id,
        provider: ProviderEnum.EMAIL,
        providerId: normalizedEmail,
      });
      await account.save();

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      await this.emailVerificationModel.create({
        email: normalizedEmail,
        verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await this.notificationService.sendEmailVerification({
        email: normalizedEmail,
        name: dto.name,
        code: verificationCode,
      });

      return {
        message: 'User registered successfully, verification code sent',
      };
    } catch (err: any) {
      if (err?.code === 11000) {
        // Mongo duplicate key safety net
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
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const record = await this.emailVerificationModel.findOne({
      email: dto.email,
      verificationCode: dto.code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired verification code',
        error: 'Bad Request',
      });
    }

    record.used = true;
    await record.save();

    user.isVerified = true;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async uploadProfilePicture(
    dto: UploadProfilePictureDto & { file: UploadedFile },
  ) {
    // Convert base64 back to buffer if needed
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

    const user = await this.userModel.findById(dto.userId).exec();
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
    await user.save();

    return {
      message: 'Profile picture uploaded successfully',
      url,
    };
  }

  private omitUserPassword(user: UserDocument) {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  // ========== Login & Tokens ==========

  async login(dto: LoginDto) {
    const account = await this.accountModel
      .findOne({ provider: ProviderEnum.EMAIL, providerId: dto.email })
      .exec();
    if (!account) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    const user = await this.userModel.findById(account.userId).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    // Secure password comparison using bcrypt (see UserSchema.comparePassword)
    const userWithPassword = await this.userModel
      .findById(account.userId)
      .select('+password')
      .exec();

    if (!userWithPassword) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found for the given account',
        error: 'Not Found',
      });
    }

    const isMatch = await (userWithPassword as any).comparePassword(
      dto.password,
    );
    if (!isMatch) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid credentials',
        error: 'Bad Request',
      });
    }

    if (!user.isVerified) {
      throw new RpcException({
        statusCode: 400,
        message: 'You should verify your email first',
        error: 'Bad Request',
      });
    }

    userWithPassword.lastLogin = new Date();
    await userWithPassword.save();

    const accessToken = this.signAccessToken(
      String(userWithPassword._id),
      userWithPassword.role,
    );
    const refreshToken = this.signRefreshToken(
      String(userWithPassword._id),
      userWithPassword.role,
    );

    await this.refreshTokenModel
      .deleteMany({ userId: userWithPassword._id })
      .exec();
    await this.refreshTokenModel.create({
      userId: userWithPassword._id,
      tokenHash: refreshToken,
      jti: `${userWithPassword._id.toString()}-${Date.now()}`,
      deviceHash: dto.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      message: 'User logged in successfully',
      data: {
        user: {
          _id: userWithPassword._id,
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

      const user = await this.userModel.findById(payload.userId).exec();
      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'User not found',
          error: 'Unauthorized',
        });
      }

      const accessToken = this.signAccessToken(String(user._id), user.role);
      const refreshToken = this.signRefreshToken(String(user._id), user.role);

      await this.refreshTokenModel.deleteMany({ userId: user._id }).exec();
      await this.refreshTokenModel.create({
        userId: user._id,
        tokenHash: refreshToken,
        jti: `${user._id.toString()}-${Date.now()}`,
        deviceHash: 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

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
    // Invalidate the given refresh token by deleting matching record
    await this.refreshTokenModel.deleteOne({ tokenHash: token }).exec();
    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(accessToken: string) {
    try {
      const payload = this.jwtService.verify<{ userId: string; role: string }>(
        accessToken,
      );
      const user = await this.userModel
        .findById(payload.userId)
        .select('-password -couponCode -expireCouponCode -knowAboutUs')
        .exec();
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        });
      }
      return {
        message: 'Current user fetched successfully',
        user,
      };
    } catch (e) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid access token',
        error: 'Unauthorized',
      });
    }
  }

  // ========== Password Reset ==========

  async requestResetPassword(dto: RequestResetPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.passwordResetModel.deleteMany({ email: dto.email }).exec();
    await this.passwordResetModel.create({
      email: dto.email,
      resetCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.notificationService.sendPasswordResetCode({
      email: dto.email,
      code: resetCode,
    });

    return { message: 'A reset code has been sent successfully' };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const record = await this.passwordResetModel.findOne({
      email: dto.email,
      resetCode: dto.code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired reset code',
        error: 'Bad Request',
      });
    }

    record.used = true;
    await record.save();

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

      const user = await this.userModel
        .findOne({ email: payload.email })
        .exec();
      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        });
      }

      user.password = dto.newPassword;
      await user.save(); // triggers pre-save hook to hash password

      await this.refreshTokenModel.deleteMany({ userId: user._id }).exec();

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
