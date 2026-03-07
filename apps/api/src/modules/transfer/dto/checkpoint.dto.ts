import { IsString, IsOptional, IsUUID } from 'class-validator';

export class VerifyManifestDto {
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
