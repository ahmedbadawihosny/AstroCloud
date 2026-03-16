import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({ description: 'User identifier owning the file' })
  @IsString()
  @IsDefined()
  userId!: string;

  @ApiProperty({ description: 'Uploaded file payload', required: true })
  @IsDefined()
  file!: unknown;

  @ApiProperty({ description: 'Additional metadata about the file', required: false })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ShareFileDto {
  @ApiProperty({ description: 'Share expiration in seconds', default: 86400 })
  @IsNumber()
  @IsDefined()
  expiresInSeconds!: number;
}

