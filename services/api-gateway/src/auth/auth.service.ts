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
    private readonly client: ClientProxy,
  ) {}

  register(dto: RegisterDto, userAgent: string) {
    const payload = { ...dto, userAgent };
    return this.client.send({ cmd: 'register' }, payload);
  }

  verifyEmail(dto: VerifyEmailDto) {
    return this.client.send({ cmd: 'verifyEmail' }, dto);
  }

  uploadProfilePicture(dto: UploadProfilePictureDto & { file: UploadedFile }) {
    // Convert buffer to base64 for microservice transmission
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
    return this.client.send({ cmd: 'uploadProfilePicture' }, payload);
  }

  login(dto: LoginDto, userAgent: string) {
    const payload = { ...dto, userAgent };
    return this.client.send({ cmd: 'login' }, payload);
  }

  currentUser(accessToken: string) {
    return this.client.send({ cmd: 'currentUser' }, accessToken);
  }

  refreshToken(refreshToken: string) {
    return this.client.send({ cmd: 'refreshToken' }, refreshToken);
  }

  requestResetPassword(dto: RequestResetPasswordDto) {
    return this.client.send({ cmd: 'requestResetPassword' }, dto);
  }

  verifyResetCode(dto: VerifyResetCodeDto) {
    return this.client.send({ cmd: 'verifyResetCode' }, dto);
  }

  resetPassword(dto: ResetPasswordDto & { resetToken: string }) {
    return this.client.send({ cmd: 'resetPassword' }, dto);
  }

  logout(refreshToken: string) {
    return this.client.send({ cmd: 'logout' }, refreshToken);
  }
}
