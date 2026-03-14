import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { UploadedFile } from '../common/interfaces/file.interface';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'verifyEmail' })
  verifyEmail(@Payload() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @MessagePattern({ cmd: 'uploadProfilePicture' })
  uploadProfilePicture(
    @Payload() dto: UploadProfilePictureDto & { file: UploadedFile },
  ) {
    return this.authService.uploadProfilePicture(dto);
  }

  @MessagePattern({ cmd: 'login' })
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern({ cmd: 'refreshToken' })
  refreshToken(@Payload() token: string) {
    return this.authService.refreshToken(token);
  }

  @MessagePattern({ cmd: 'logout' })
  logout(@Payload() token: string) {
    return this.authService.logout(token);
  }

  @MessagePattern({ cmd: 'currentUser' })
  getCurrentUser(@Payload() accessToken: string) {
    return this.authService.getCurrentUser(accessToken);
  }

  @MessagePattern({ cmd: 'requestResetPassword' })
  requestResetPassword(@Payload() dto: RequestResetPasswordDto) {
    return this.authService.requestResetPassword(dto);
  }

  @MessagePattern({ cmd: 'verifyResetCode' })
  verifyResetCode(@Payload() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @MessagePattern({ cmd: 'resetPassword' })
  resetPassword(@Payload() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
