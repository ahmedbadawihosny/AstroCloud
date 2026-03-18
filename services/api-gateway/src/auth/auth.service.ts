import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import type { UploadedFile } from '../common/interfaces/file.interface';

@Injectable()
export class AuthGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly natsClient: ClientProxy,
  ) { }

  register(dto: RegisterDto, userAgent: string) {
    const payload = { ...dto, userAgent };
    return this.natsClient.send({ cmd: 'register' }, payload);
  }

  verifyEmail(dto: VerifyEmailDto) {
    return this.natsClient.send({ cmd: 'verifyEmail' }, dto);
  }

  uploadProfilePicture(dto: UploadProfilePictureDto & { file: UploadedFile }) {
    const payload = {
      ...dto,
      file: {
        ...dto.file,
        buffer:
          dto.file.buffer instanceof Buffer
            ? dto.file.buffer.toString('base64')
            : dto.file.buffer,
      },
    };
    return this.natsClient.send({ cmd: 'uploadProfilePicture' }, payload);
  }

  login(dto: LoginDto, userAgent: string) {
    const payload = { ...dto, userAgent };
    return this.natsClient.send({ cmd: 'login' }, payload);
  }

  currentUser(accessToken: string) {
    console.log('[AuthGatewayService] currentUser payload:', {
      hasAccessToken: Boolean(accessToken),
      tokenLength: accessToken?.length,
    });
    return this.natsClient.send({ cmd: 'currentUser' }, accessToken);
  }

  refreshToken(refreshToken: string) {
    console.log('[AuthGatewayService] refreshToken payload:', {
      hasRefreshToken: Boolean(refreshToken),
      tokenLength: refreshToken?.length,
    });
    return this.natsClient.send({ cmd: 'refreshToken' }, refreshToken);
  }

  requestResetPassword(dto: RequestResetPasswordDto) {
    return this.natsClient.send({ cmd: 'requestResetPassword' }, dto);
  }

  verifyResetCode(dto: VerifyResetCodeDto) {
    return this.natsClient.send({ cmd: 'verifyResetCode' }, dto);
  }

  resetPassword(dto: ResetPasswordDto & { resetToken: string }) {
    return this.natsClient.send({ cmd: 'resetPassword' }, dto);
  }

  logout(refreshToken: string) {
    return this.natsClient.send({ cmd: 'logout' }, refreshToken);
  }
}
