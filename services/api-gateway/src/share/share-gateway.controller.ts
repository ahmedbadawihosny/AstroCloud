import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ShareGatewayService } from './share-gateway.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Sharing')
@Controller('api/v1/share')
export class ShareGatewayController {
  constructor(private readonly shareGatewayService: ShareGatewayService) {}

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

  @Get(':token')
  @ApiOperation({
    summary: 'Download shared file by token',
    description:
      'Resolves a public share token to the underlying file and streams the file back to the client. Returns JSON when no file is found.',
  })
  @ApiParam({
    name: 'token',
    description: 'Public share token generated when sharing a file',
    example: 'sh_abc123xyz',
  })
  @ApiResponse({ status: 200, description: 'File download or JSON payload returned' })
  @ApiResponse({ status: 404, description: 'Share token not found' })
  async download(@Param('token') token: string, @Res() res: Response) {
    const result = await this.shareGatewayService.download(token);
    const downloadUrl = result?.data?.downloadUrl ?? result?.downloadUrl;
    if (typeof downloadUrl === 'string' && downloadUrl.length > 0) {
      return res.redirect(302, downloadUrl);
    }
    if (result?.contentType) res.setHeader('Content-Type', result.contentType);
    if (result?.contentDisposition) res.setHeader('Content-Disposition', result.contentDisposition);
    if (result?.body) {
      const buf = Buffer.from(result.body, result.encoding || 'base64');
      return res.status(200).send(buf);
    }
    return res.status(200).json(result ?? { message: 'Download not found' });
  }
}
