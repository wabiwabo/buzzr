import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCheckpointDto } from './dto/create-transfer.dto';

@Injectable()
export class TransferService {
  constructor(private readonly dataSource: DataSource) {}

  async createCheckpoint(tenantSchema: string, dto: CreateCheckpointDto) {
    // Create transfer record
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".transfer_records
       (schedule_id, source_tps_id, destination_tps_id, vehicle_id, driver_id, category, volume_kg, status, photo_url, notes, checkpoint_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'in_transit', $8, $9, NOW())
       RETURNING *`,
      [dto.scheduleId, dto.sourceTpsId, dto.destinationTpsId || null, dto.vehicleId, dto.driverId,
       dto.category, dto.volumeKg, dto.photoUrl || null, dto.notes || null],
    );

    // Decrease TPS current_load
    await this.dataSource.query(
      `UPDATE "${tenantSchema}".tps_locations
       SET current_load_tons = GREATEST(0, current_load_tons - $1), updated_at = NOW()
       WHERE id = $2
       RETURNING current_load_tons`,
      [dto.volumeKg / 1000, dto.sourceTpsId],
    );

    return result[0];
  }

  async getManifest(tenantSchema: string, scheduleId: string) {
    return this.dataSource.query(
      `SELECT tr.*, t.name as source_tps_name
       FROM "${tenantSchema}".transfer_records tr
       LEFT JOIN "${tenantSchema}".tps_locations t ON tr.source_tps_id = t.id
       WHERE tr.schedule_id = $1
       ORDER BY tr.checkpoint_at`,
      [scheduleId],
    );
  }

  async verifyManifest(tenantSchema: string, scheduleId: string, operatorId: string) {
    return this.dataSource.query(
      `UPDATE "${tenantSchema}".transfer_records
       SET status = 'verified', operator_id = $1, verified_at = NOW()
       WHERE schedule_id = $2
       RETURNING *`,
      [operatorId, scheduleId],
    );
  }

  async updateTransferStatus(tenantSchema: string, transferId: string, status: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".transfer_records SET status = $1 WHERE id = $2 RETURNING *`,
      [status, transferId],
    );
    if (!result.length) throw new NotFoundException('Transfer record tidak ditemukan');
    return result[0];
  }
}
