import { IsDefined, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';

export class UploadFileDto {
  // `file` is left as unknown because it will be validated/handled at the gateway boundary
  @IsDefined()
  file!: unknown;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ListFilesDto {
  // No userId needed - will come from JWT token
}

export class GetFileDto {
  // No userId needed - will come from JWT token
  // fileId will come from URL parameter
}

export class DeleteFileDto {
  // No userId needed - will come from JWT token
  // fileId will come from URL parameter
}

export class CreateShareDto {
  @IsNumber()
  @IsDefined()
  expiresInSeconds!: number;
}

// Keep the original DTOs for NATS communication
export class UploadFileNatsDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsDefined()
  file!: unknown;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ListFilesNatsDto {
  @IsString()
  @IsDefined()
  userId!: string;
}

export class GetFileNatsDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  fileId!: string;
}

export class DeleteFileNatsDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  fileId!: string;
}

export class CreateShareNatsDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  fileId!: string;

  @IsNumber()
  @IsDefined()
  expiresInSeconds!: number;
}
