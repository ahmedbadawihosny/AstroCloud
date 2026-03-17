/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Body,
  Put,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccountGatewayService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Account')
@ApiBearerAuth()
@Controller('api/v1/account')
@UseGuards(JwtAuthGuard)
export class AccountGatewayController {
  constructor(private readonly accountService: AccountGatewayService) {}

   /** Resolve current user id from req.user (id, sub, or _id) so upload and sessions use the same value. */
   private getCurrentUserId(req: unknown): string | undefined {
    const r = req as
      | { user?: { _id?: unknown; id?: unknown; sub?: unknown } }
      | undefined;
    const raw = r?.user?.id ?? r?.user?.sub ?? r?.user?._id;
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'string') return raw.trim() || undefined;
    if (typeof raw === 'object' && raw !== null) {
      // Prefer Mongo ObjectId-style conversions when available.
      const maybeHex = (raw as { toHexString?: () => string }).toHexString?.();
      if (typeof maybeHex === 'string' && maybeHex.trim())
        return maybeHex.trim();

      const s = (raw as { toString?: () => string }).toString?.();
      if (typeof s === 'string') {
        const trimmed = s.trim();
        if (trimmed && trimmed !== '[object Object]') return trimmed;
      }
      // Avoid returning "[object Object]" for arbitrary objects
      return undefined;
    }
    if (
      typeof raw === 'number' ||
      typeof raw === 'boolean' ||
      typeof raw === 'bigint' ||
      typeof raw === 'symbol'
    ) {
      return String(raw).trim() || undefined;
    }
    return undefined;
  }

  @ApiOperation({
    summary: 'Get user account information',
    description:
      'Retrieves the account details for a specific user. Users can only access their own account information.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Account information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
        bio: {
          type: 'string',
          example:
            'Software developer passionate about creating innovative solutions.',
        },
        dateOfBirth: { type: 'string', example: '1990-01-01' },
        address: { type: 'string', example: '123 Main St, City, Country' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - User can only access their own account',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('user/:userId')
  async findOne(@Param('userId') userId: string, @Request() req: any) {
    const currentUserId = this.getCurrentUserId(req);
    // Authorization: User can only access their own account
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own account',
      );
    }
    return firstValueFrom(this.accountService.findOne(userId));
  }

  @ApiOperation({
    summary: 'Update user account information',
    description:
      'Updates the account details for a specific user. Users can only update their own account information. All fields are optional.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Account information updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
        bio: {
          type: 'string',
          example:
            'Software developer passionate about creating innovative solutions.',
        },
        dateOfBirth: { type: 'string', example: '1990-01-01' },
        address: { type: 'string', example: '123 Main St, City, Country' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - User can only update their own account',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @Put('user/:userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req: any,
  ) {
    const currentUserId = this.getCurrentUserId(req);
    // Authorization: User can only update their own account
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own account',
      );
    }
    return firstValueFrom(this.accountService.update(userId, updateAccountDto));
  }
}
