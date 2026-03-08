import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboardSummary(tenantSchema: string) {
    const [wasteToday, drivers, complaints, collection] = await Promise.all([
      this.dataSource.query(
        `SELECT COALESCE(SUM(volume_kg), 0)::numeric as total_waste_today_kg
         FROM "${tenantSchema}".transfer_records WHERE DATE(checkpoint_at) = CURRENT_DATE`,
      ),
      this.dataSource.query(
        `SELECT COUNT(DISTINCT driver_id)::int as active_drivers
         FROM "${tenantSchema}".gps_logs WHERE DATE(recorded_at) = CURRENT_DATE`,
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int as pending_complaints
         FROM "${tenantSchema}".complaints WHERE status IN ('submitted', 'verified', 'assigned')`,
      ),
      this.dataSource.query(
        `SELECT CASE WHEN COUNT(*) = 0 THEN 0
         ELSE ROUND(COUNT(*) FILTER (WHERE status = 'paid') * 100.0 / COUNT(*), 1) END as collection_rate
         FROM "${tenantSchema}".transactions WHERE type = 'retribution'`,
      ),
    ]);

    return {
      totalWasteTodayKg: parseFloat(wasteToday[0].total_waste_today_kg),
      activeDrivers: drivers[0].active_drivers,
      pendingComplaints: complaints[0].pending_complaints,
      collectionRate: parseFloat(collection[0].collection_rate),
    };
  }

  async getWasteVolumeReport(tenantSchema: string, from: string, to: string) {
    return this.dataSource.query(
      `SELECT category, SUM(volume_kg)::numeric as total_kg, COUNT(*)::int as total_records,
       DATE(checkpoint_at) as date
       FROM "${tenantSchema}".transfer_records
       WHERE checkpoint_at BETWEEN $1 AND ($2::date + interval '1 day')
       GROUP BY category, DATE(checkpoint_at)
       ORDER BY date, category`,
      [from, to],
    );
  }

  async getComplaintStats(tenantSchema: string, from: string, to: string) {
    const result = await this.dataSource.query(
      `SELECT COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved,
       COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
       ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL), 1) as avg_resolution_hours
       FROM "${tenantSchema}".complaints
       WHERE created_at BETWEEN $1 AND ($2::date + interval '1 day')`,
      [from, to],
    );
    return result[0];
  }

  async getWasteHeatmap(tenantSchema: string) {
    return this.dataSource.query(
      `SELECT ST_Y(t.coordinates::geometry) as latitude, ST_X(t.coordinates::geometry) as longitude,
       SUM(tr.volume_kg)::numeric as total_kg
       FROM "${tenantSchema}".transfer_records tr
       JOIN "${tenantSchema}".tps_locations t ON tr.source_tps_id = t.id
       WHERE tr.checkpoint_at >= CURRENT_DATE - interval '30 days'
       GROUP BY t.coordinates`,
    );
  }

  async getDriverPerformance(tenantSchema: string, from: string, to: string) {
    return this.dataSource.query(
      `SELECT u.id, u.name,
       COUNT(DISTINCT s.id)::int as total_trips,
       COUNT(DISTINCT tr.id)::int as total_checkpoints,
       SUM(tr.volume_kg)::numeric as total_volume_kg
       FROM "${tenantSchema}".users u
       LEFT JOIN "${tenantSchema}".schedules s ON u.id = s.driver_id AND s.status = 'completed'
       LEFT JOIN "${tenantSchema}".transfer_records tr ON u.id = tr.driver_id AND tr.checkpoint_at BETWEEN $1 AND ($2::date + interval '1 day')
       WHERE u.role = 'driver'
       GROUP BY u.id, u.name
       ORDER BY total_volume_kg DESC NULLS LAST`,
      [from, to],
    );
  }

  async getActivityFeed(tenantSchema: string, limit: number = 20): Promise<any[]> {
    const schemaName = tenantSchema.replace(/[^a-z0-9_]/gi, '');

    const query = `
      SELECT * FROM (
        SELECT
          'complaint' as type,
          'Laporan baru: ' || COALESCE(category, '') as message,
          id,
          created_at as timestamp
        FROM "${schemaName}".complaints
        WHERE created_at > NOW() - INTERVAL '7 days'

        UNION ALL

        SELECT
          'schedule' as type,
          'Jadwal ' || COALESCE(status, '') || ': ' || COALESCE(route_name, '') as message,
          id,
          updated_at as timestamp
        FROM "${schemaName}".schedules
        WHERE updated_at > NOW() - INTERVAL '7 days'

        UNION ALL

        SELECT
          'payment' as type,
          'Pembayaran ' || COALESCE(status, '') || ': Rp' || COALESCE(amount::text, '0') as message,
          id,
          updated_at as timestamp
        FROM "${schemaName}".transactions
        WHERE updated_at > NOW() - INTERVAL '7 days'
      ) activities
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    return this.dataSource.query(query, [limit]);
  }

  async getDashboardWithComparison(tenantSchema: string): Promise<{
    current: any;
    previous: any;
    trends: Record<string, number>;
  }> {
    const current = await this.getDashboardSummary(tenantSchema);

    const schemaName = tenantSchema.replace(/[^a-z0-9_]/gi, '');
    const prevQuery = `
      SELECT
        COALESCE(SUM(tr.volume_kg), 0)::numeric as "totalWasteKg",
        (SELECT COUNT(DISTINCT driver_id)::int FROM "${schemaName}".gps_logs
         WHERE recorded_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
        ) as "activeDrivers",
        (SELECT COUNT(*)::int FROM "${schemaName}".complaints
         WHERE status IN ('submitted','verified','assigned')
         AND created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
        ) as "pendingComplaints"
      FROM "${schemaName}".transfer_records tr
      WHERE tr.checkpoint_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
    `;

    const [prev] = await this.dataSource.query(prevQuery);
    const previous = prev || { totalWasteKg: 0, activeDrivers: 0, pendingComplaints: 0 };

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100 * 10) / 10 : 0;

    return {
      current,
      previous,
      trends: {
        wasteChange: calcChange(current.totalWasteTodayKg || 0, previous.totalWasteKg || 0),
        driverChange: calcChange(current.activeDrivers || 0, previous.activeDrivers || 0),
        complaintChange: calcChange(current.pendingComplaints || 0, previous.pendingComplaints || 0),
      },
    };
  }
}
