import { IsDefined, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsDefined()
  userId!: string;

  // `file` is left as unknown because it will be validated/handled at the gateway boundary
  @IsDefined()
  file!: unknown;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ListFilesDto {
  @IsString()
  @IsDefined()
  userId!: string;
}

export class GetFileDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  fileId!: string;
}

export class DeleteFileDto {
  @IsString()
  @IsDefined()
  userId!: string;

  @IsString()
  @IsDefined()
  fileId!: string;
}

export class CreateShareDto {
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

