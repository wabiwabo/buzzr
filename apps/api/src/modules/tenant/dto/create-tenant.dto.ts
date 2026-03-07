import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug hanya boleh huruf kecil, angka, dan strip' })
  @MinLength(3)
  @MaxLength(50)
  slug!: string;
}
