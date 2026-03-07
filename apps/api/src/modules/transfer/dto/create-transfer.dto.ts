import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { WasteCategory } from '@buzzr/shared-types';

export class CreateCheckpointDto {
  @IsUUID()
  scheduleId!: string;

  @IsUUID()
  sourceTpsId!: string;

  @IsUUID()
  @IsOptional()
  destinationTpsId?: string;

  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  driverId!: string;

  @IsEnum(WasteCategory)
  category!: WasteCategory;

  @IsNumber()
  @Min(0.1)
  volumeKg!: number;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
