import { IsString, IsNumber, IsEnum, IsUUID, Min } from 'class-validator';
import { PaymentType } from '@buzzr/shared-types';

export class CreateInvoiceDto {
  @IsUUID()
  userId!: string;

  @IsNumber()
  @Min(1000)
  amount!: number;

  @IsString()
  description!: string;

  @IsEnum(PaymentType)
  type!: PaymentType;
}
