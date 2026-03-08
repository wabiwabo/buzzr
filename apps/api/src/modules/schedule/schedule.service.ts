import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateScheduleDto, AddStopDto } from './dto/create-schedule.dto';
import { buildPaginatedQuery } from '../../common/utils/query-builder.util';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly dataSource: DataSource) {}

  async createSchedule(tenantSchema: string, dto: CreateScheduleDto) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".schedules (vehicle_id, driver_id, route_name, schedule_type, recurring_days, scheduled_date, start_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [dto.vehicleId, dto.driverId, dto.routeName, dto.scheduleType,
       dto.recurringDays || null, dto.scheduledDate || null, dto.startTime],
    );
    return result[0];
  }

  async addStop(tenantSchema: string, scheduleId: string, dto: AddStopDto) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".schedule_stops (schedule_id, tps_id, stop_order, estimated_arrival)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [scheduleId, dto.tpsId, dto.stopOrder, dto.estimatedArrival || null],
    );
    return result[0];
  }

  async getTodaySchedules(tenantSchema: string, driverId: string) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...

    return this.dataSource.query(
      `SELECT s.*, json_agg(
         json_build_object('id', ss.id, 'tps_id', ss.tps_id, 'stop_order', ss.stop_order, 'estimated_arrival', ss.estimated_arrival)
         ORDER BY ss.stop_order
       ) FILTER (WHERE ss.id IS NOT NULL) as stops
       FROM "${tenantSchema}".schedules s
       LEFT JOIN "${tenantSchema}".schedule_stops ss ON s.id = ss.schedule_id
       WHERE s.driver_id = $1
       AND (
         (s.schedule_type = 'recurring' AND $2 = ANY(s.recurring_days))
         OR (s.schedule_type = 'on_demand' AND s.scheduled_date = CURRENT_DATE)
       )
       GROUP BY s.id
       ORDER BY s.start_time`,
      [driverId, dayOfWeek],
    );
  }

  async listSchedulesPaginated(
    tenantSchema: string,
    query: PaginationQueryDto,
    filters?: Record<string, string>,
  ): Promise<PaginatedResponse<any>> {
    return buildPaginatedQuery(this.dataSource, {
      baseQuery: `SELECT s.id, s.route_name, s.schedule_type, s.status, s.start_time, s.scheduled_date, s.recurring_days, s.created_at, u.name as driver_name, v.plate_number FROM "${tenantSchema}".schedules s LEFT JOIN "${tenantSchema}".users u ON s.driver_id = u.id LEFT JOIN "${tenantSchema}".vehicles v ON s.vehicle_id = v.id`,
      countQuery: `SELECT COUNT(*) FROM "${tenantSchema}".schedules s`,
      searchableColumns: ['s.route_name'],
      sortableColumns: ['s.start_time', 's.created_at', 's.route_name', 's.schedule_type', 's.status'],
      filterableColumns: ['s.schedule_type', 's.status'],
      defaultSort: 's.created_at',
      defaultOrder: 'desc',
    }, {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order,
      search: query.search,
      filters,
    });
  }

  async updateStatus(tenantSchema: string, scheduleId: string, status: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".schedules SET status = $1 WHERE id = $2 RETURNING *`,
      [status, scheduleId],
    );
    if (!result.length) throw new NotFoundException('Jadwal tidak ditemukan');
    return result[0];
  }

  async getScheduleById(tenantSchema: string, id: string) {
    const result = await this.dataSource.query(
      `SELECT s.*, json_agg(
         json_build_object('id', ss.id, 'tps_id', ss.tps_id, 'stop_order', ss.stop_order, 'estimated_arrival', ss.estimated_arrival)
         ORDER BY ss.stop_order
       ) FILTER (WHERE ss.id IS NOT NULL) as stops
       FROM "${tenantSchema}".schedules s
       LEFT JOIN "${tenantSchema}".schedule_stops ss ON s.id = ss.schedule_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id],
    );
    if (!result.length) throw new NotFoundException('Jadwal tidak ditemukan');
    return result[0];
  }
}
