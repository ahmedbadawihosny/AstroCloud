import { IsString, IsOptional, IsDefined } from 'class-validator';

export class UserCreatedEventDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class FileUploadedEventDto {
  @IsString()
  @IsDefined()
  fileId!: string;

  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  filename!: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsOptional()
  size?: number;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class FileDeletedEventDto {
  @IsString()
  @IsDefined()
  fileId!: string;

  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsOptional()
  filename?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class FileSharedEventDto {
  @IsString()
  @IsDefined()
  fileId!: string;

  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  shareId!: string;

  @IsOptional()
  expiresAt?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class NotificationHealthDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  timestamp?: string;

  @IsOptional()
  service?: string;
}
