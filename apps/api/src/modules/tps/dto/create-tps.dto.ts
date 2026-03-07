import { IsString, IsNumber, IsEnum, IsUUID, Min, Max, MinLength, MaxLength } from 'class-validator';
import { TpsType } from '@buzzr/shared-types';

export class CreateTpsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEnum(TpsType)
  type!: TpsType;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @IsUUID()
  areaId!: string;

  @IsNumber()
  @Min(0.1)
  capacityTons!: number;
}
