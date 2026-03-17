/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
  BadRequestException,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGatewayService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import configuration from '../common/config/configuration';
import { firstValueFrom } from 'rxjs';
import type { UploadedFile as CustomUploadedFile } from '../common/interfaces/file.interface';

@ApiTags('Authentication')
@ApiCookieAuth()
@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(private readonly authService: AuthGatewayService) { }

  // Register Flow
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email verification required.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'john.doe@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
  })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent = 'unknown',
  ) {
    return this.authService.register(dto, userAgent);
  }

  @ApiOperation({
    summary: 'Verify user email',
    description:
      'Verifies user email using the verification code sent to their email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'john.doe@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid verification code',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBody({ type: VerifyEmailDto })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @ApiOperation({
    summary: 'Upload profile picture',
    description:
      'Uploads a profile picture for the user. Requires multipart/form-data with file field.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile picture upload data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture image file',
        },
        userId: {
          type: 'string',
          description: 'User ID',
          example: '507f1f77bcf86cd799439011',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Profile picture uploaded successfully',
        },
        data: {
          type: 'object',
          properties: {
            profilePictureUrl: {
              type: 'string',
              example: 'https://example.com/profile-pictures/user123.jpg',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - File or user ID missing',
  })
  @Post('upload-profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePicture(
    @Body() dto: UploadProfilePictureDto,
    @UploadedFile() file: CustomUploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }
    return this.authService.uploadProfilePicture({ ...dto, file });
  }

  // Login
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user credentials and sets authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                email: { type: 'string', example: 'john.doe@example.com' },
                name: { type: 'string', example: 'John Doe' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent = 'unknown',
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await firstValueFrom(this.authService.login(dto, userAgent));

    // Set refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set access token in HTTP-only cookie
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    // Return response without tokens in body
    return {
      message: result.message,
      data: {
        user: result.data.user,
      },
    };
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refreshes access token using refresh token from cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tokens refreshed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Refresh token cookie required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token',
  })
  @Post('refresh-token')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token cookie is required');
    }

    const result = await firstValueFrom(this.authService.refreshToken(refreshToken));

    // Set new refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set new access token in HTTP-only cookie
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    return {
      message: 'Tokens refreshed successfully',
    };
  }

  @ApiOperation({
    summary: 'Get current user',
    description:
      'Retrieves current user information using access token from cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'john.doe@example.com' },
        name: { type: 'string', example: 'John Doe' },
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Access token cookie required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid access token',
  })
  @Get('current-user')
  currentUser(@Req() request: Request) {
    const accessToken = request.cookies?.accessToken;
    if (!accessToken) {
      throw new BadRequestException('Access token cookie is required');
    }
    return this.authService.currentUser(accessToken);
  }

  @ApiOperation({
    summary: 'Request password reset',
    description: "Sends a password reset code to the user's email address.",
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset code sent to your email',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBody({ type: RequestResetPasswordDto })
  @Post('request-reset-password')
  requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    return this.authService.requestResetPassword(dto);
  }

  @ApiOperation({
    summary: 'Verify password reset code',
    description:
      'Verifies the password reset code and sets a reset token cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset code verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Reset code verified successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid reset code',
  })
  @ApiBody({ type: VerifyResetCodeDto })
  @Post('verify-reset-code')
  async verifyResetCode(
    @Body() dto: VerifyResetCodeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await firstValueFrom(this.authService.verifyResetCode(dto));

    // Set reset token in HTTP-only cookie
    response.cookie('resetToken', result.resetToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 10, // 10 minutes
      path: '/',
    });

    return {
      message: result.message,
    };
  }

  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the reset token from cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid reset token or new password',
  })
  @ApiBody({ type: ResetPasswordDto })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    const resetToken = request.cookies?.resetToken;
    if (!resetToken) {
      throw new BadRequestException('Reset token cookie is required');
    }
    return this.authService.resetPassword({ ...dto, resetToken });
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out user and clears authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Refresh token cookie required',
  })
  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token cookie is required');
    }

    // Clear the refresh token cookie
    response.clearCookie('refreshToken', { path: '/' });
    response.clearCookie('accessToken', { path: '/' });

    return this.authService.logout(refreshToken);
  }

}
