// apps/api/src/modules/tps/dto/update-tps.dto.ts

import { IsString, IsNumber, IsEnum, IsUUID, IsOptional, MinLength, MaxLength, Min, Max } from 'class-validator';
import { TpsType, TpsStatus } from '@buzzr/shared-types';

export class UpdateTpsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEnum(TpsType)
  @IsOptional()
  type?: TpsType;

  @IsEnum(TpsStatus)
  @IsOptional()
  status?: TpsStatus;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  capacityTons?: number;
}
