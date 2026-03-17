import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FilesGatewayService } from './files-gateway.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { ShareFileDto, UploadFileDto } from './dto/file-requests.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('api/v1/files')
@UseGuards(JwtGuard)
export class FilesGatewayController {
  constructor(private readonly filesGatewayService: FilesGatewayService) {}

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
        return s.trim() || undefined;
      }
    }
    return undefined;
  }

  /** Get auth token from request headers or cookies */
  private getAuthToken(req: any): string {
    // Try to get from Authorization header first
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Fallback to access token cookie
    return req.cookies?.accessToken || '';
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Uploads a file for the authenticated user. Supports multipart/form-data; the gateway forwards the file and metadata to the file service.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload payload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        // All other fields are treated as metadata and forwarded as-is
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  async upload(@Req() req: any, @Res() res: Response) {
    const userId = this.getCurrentUserId(req);
    const authToken = this.getAuthToken(req);
    const result = await this.filesGatewayService.upload({
      userId: String(userId),
      file: req.body?.file ?? req.file,
      metadata: req.body,
    }, authToken);
    return res.status(200).json(result);
  }

  @Get()
  @ApiOperation({
    summary: 'List user files',
    description: 'Returns all files owned by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async list(@Req() req: any, @Res() res: Response) {
    const userId = this.getCurrentUserId(req);
    const authToken = this.getAuthToken(req);
    const result = await this.filesGatewayService.list(authToken);
    return res.status(200).json(result);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a file by ID',
    description:
      'Retrieves metadata (and, depending on implementation, download info) for a single file owned by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async get(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const userId = this.getCurrentUserId(req);
    const authToken = this.getAuthToken(req);
    const result = await this.filesGatewayService.get(id, authToken);
    return res.status(200).json(result);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Deletes a single file owned by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async delete(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const userId = this.getCurrentUserId(req);
    const authToken = this.getAuthToken(req);
    const result = await this.filesGatewayService.delete(id, authToken);
    return res.status(200).json(result);
  }

  @Post(':id/share')
  @ApiOperation({
    summary: 'Create a share link',
    description:
      'Creates a share token for a file so it can be downloaded via a public share URL. The body controls how long the link stays valid.',
  })
  @ApiResponse({ status: 200, description: 'Share link created successfully' })
  async share(
    @Param('id') id: string,
    @Body() body: ShareFileDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = this.getCurrentUserId(req);
    const authToken = this.getAuthToken(req);
    const result = await this.filesGatewayService.share(id, {
      expiresInSeconds: body?.expiresInSeconds ?? 86400,
    }, authToken);
    return res.status(200).json(result);
  }
}
