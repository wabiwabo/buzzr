import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ComplaintCategory } from '@buzzr/shared-types';

export class CreateComplaintDto {
  @IsUUID()
  reporterId!: string;

  @IsEnum(ComplaintCategory)
  category!: ComplaintCategory;

  @IsString()
  description!: string;

  @IsNumber() @Min(-90) @Max(90)
  latitude!: number;

  @IsNumber() @Min(-180) @Max(180)
  longitude!: number;

  @IsString() @IsOptional()
  address?: string;
}
