import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Injectable()
export class ComplaintService {
  constructor(private readonly dataSource: DataSource) {}

  async createComplaint(tenantSchema: string, dto: CreateComplaintDto) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".complaints (reporter_id, category, description, latitude, longitude, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dto.reporterId, dto.category, dto.description, dto.latitude, dto.longitude, dto.address || null],
    );
    return result[0];
  }

  async assignComplaint(tenantSchema: string, complaintId: string, assigneeId: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".complaints SET assigned_to = $1, status = 'assigned', updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [assigneeId, complaintId],
    );
    if (!result.length) throw new NotFoundException('Laporan tidak ditemukan');
    return result[0];
  }

  async updateStatus(tenantSchema: string, complaintId: string, status: string) {
    const extra = status === 'resolved' ? ', resolved_at = NOW()' : '';
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".complaints SET status = $1${extra}, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, complaintId],
    );
    if (!result.length) throw new NotFoundException('Laporan tidak ditemukan');
    return result[0];
  }

  async rateComplaint(tenantSchema: string, complaintId: string, rating: number) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".complaints SET rating = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'resolved' RETURNING *`,
      [rating, complaintId],
    );
    if (!result.length) throw new NotFoundException('Laporan belum diselesaikan');
    return result[0];
  }

  async listComplaints(tenantSchema: string, filters: { status?: string; reporterId?: string }) {
    let query = `SELECT c.*, u.name as reporter_name, a.name as assignee_name
                 FROM "${tenantSchema}".complaints c
                 LEFT JOIN "${tenantSchema}".users u ON c.reporter_id = u.id
                 LEFT JOIN "${tenantSchema}".users a ON c.assigned_to = a.id
                 WHERE 1=1`;
    const params: any[] = [];
    if (filters.status) { params.push(filters.status); query += ` AND c.status = $${params.length}`; }
    if (filters.reporterId) { params.push(filters.reporterId); query += ` AND c.reporter_id = $${params.length}`; }
    query += ' ORDER BY c.created_at DESC';
    return this.dataSource.query(query, params);
  }

  async getComplaintById(tenantSchema: string, id: string) {
    const result = await this.dataSource.query(
      `SELECT c.*, u.name as reporter_name FROM "${tenantSchema}".complaints c
       LEFT JOIN "${tenantSchema}".users u ON c.reporter_id = u.id WHERE c.id = $1`,
      [id],
    );
    if (!result.length) throw new NotFoundException('Laporan tidak ditemukan');
    return result[0];
  }
}
