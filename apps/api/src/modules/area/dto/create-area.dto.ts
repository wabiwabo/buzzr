import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsUUID } from 'class-validator';

export enum AreaLevel {
  PROVINSI = 'provinsi',
  KOTA = 'kota',
  KECAMATAN = 'kecamatan',
  KELURAHAN = 'kelurahan',
  RW = 'rw',
  RT = 'rt',
}

export class CreateAreaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEnum(AreaLevel)
  level!: AreaLevel;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
