import { IsString, IsNumber, IsIn, IsOptional, IsUUID, Min } from 'class-validator';
import { WasteCategory } from '@buzzr/shared-types';
import { IsEnum } from 'class-validator';

export class RecordWasteDto {
  @IsUUID()
  tpsId!: string;

  @IsEnum(WasteCategory)
  category!: WasteCategory;

  @IsNumber()
  @Min(0.1)
  volumeKg!: number;

  @IsIn(['in', 'out'])
  direction!: 'in' | 'out';

  @IsString()
  @IsOptional()
  notes?: string;
}
