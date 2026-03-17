import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { NotificationsGatewayService } from './notifications-gateway.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsGatewayController {
  constructor(private readonly notificationsGatewayService: NotificationsGatewayService) {}

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

  @Get('health')
  @ApiOperation({
    summary: 'Notifications service health check',
    description:
      'Proxy endpoint that checks the health of the notifications microservice and returns its status.',
  })
  @ApiResponse({ status: 200, description: 'Notifications service is healthy' })
  @ApiResponse({
    status: 502,
    description: 'Notifications service is unavailable or cannot be reached',
  })
  async health(@Res() res: Response) {
    try {
      const result = await this.notificationsGatewayService.health();
      return res.status(200).json(result ?? { status: 'ok' });
    } catch {
      return res.status(502).json({ message: 'Notification service unavailable' });
    }
  }
}
