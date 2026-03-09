import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SendPushDto {
  @IsUUID()
  driverId!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsString()
  @IsOptional()
  type?: string;
}
