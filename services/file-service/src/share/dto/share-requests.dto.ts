import { IsDefined, IsString } from 'class-validator';

export class GetShareDownloadDto {
  @IsString()
  @IsDefined()
  token!: string;
}

