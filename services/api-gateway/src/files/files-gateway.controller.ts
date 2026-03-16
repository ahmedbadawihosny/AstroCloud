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
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.upload({
      userId: String(userId),
      file: req.body?.file ?? req.file,
      metadata: req.body,
    });
    return res.status(200).json(result);
  }

  @Get()
  @ApiOperation({
    summary: 'List user files',
    description: 'Returns all files owned by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async list(@Req() req: any, @Res() res: Response) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.list(String(userId));
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
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.get({ userId: String(userId), fileId: id });
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
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.delete({ userId: String(userId), fileId: id });
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
    const userId = req.user?.id ?? req.user?.userId ?? req.user?._id;
    const result = await this.filesGatewayService.share({
      userId: String(userId),
      fileId: id,
      expiresInSeconds: body?.expiresInSeconds ?? 86400,
    });
    return res.status(200).json(result);
  }
}
