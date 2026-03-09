import { IsUUID } from 'class-validator';

export class ReassignScheduleDto {
  @IsUUID()
  driverId!: string;

  @IsUUID()
  vehicleId!: string;
}
