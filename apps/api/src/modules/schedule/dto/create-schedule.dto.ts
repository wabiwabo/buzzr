import { IsString, IsOptional, IsNumber, IsArray, IsIn, IsUUID, IsDateString, ArrayMinSize, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  driverId!: string;

  @IsString()
  routeName!: string;

  @IsIn(['recurring', 'on_demand'])
  scheduleType!: string;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  recurringDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  startTime!: string; // HH:MM format
}

export class AddStopDto {
  @IsUUID()
  tpsId!: string;

  @IsNumber()
  @Min(1)
  stopOrder!: number;

  @IsString()
  @IsOptional()
  estimatedArrival?: string; // HH:MM format
}
