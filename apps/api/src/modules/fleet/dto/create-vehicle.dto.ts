import { IsString, IsNumber, IsIn, Min, MinLength, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  plateNumber!: string;

  @IsIn(['truk', 'gerobak', 'motor'])
  type!: string;

  @IsNumber()
  @Min(0.1)
  capacityTons!: number;
}
