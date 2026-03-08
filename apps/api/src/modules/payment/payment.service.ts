import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { randomUUID } from 'crypto';
import { buildPaginatedQuery } from '../../common/utils/query-builder.util';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('XENDIT_SERVICE') private readonly xenditService: any,
  ) {}

  async createInvoice(tenantSchema: string, dto: CreateInvoiceDto) {
    const referenceId = `RET-${randomUUID().split('-')[0]}`;

    // Create Xendit invoice
    const xenditInvoice = await this.xenditService.createInvoice({
      externalId: referenceId,
      amount: dto.amount,
      description: dto.description,
    });

    // Create transaction record
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".transactions
       (user_id, type, amount, status, external_id, reference_id, description, expired_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, NOW() + interval '7 days')
       RETURNING *`,
      [dto.userId, dto.type, dto.amount, xenditInvoice.id, referenceId, dto.description],
    );

    return { ...result[0], invoice_url: xenditInvoice.invoice_url };
  }

  async handleWebhook(data: { external_id: string; status: string; paid_at?: string }) {
    const status = data.status === 'PAID' ? 'paid' : data.status === 'EXPIRED' ? 'expired' : 'failed';

    const result = await this.dataSource.query(
      `UPDATE "${this.getSchemaFromExternalId(data.external_id)}".transactions
       SET status = $1, paid_at = $2, updated_at = NOW()
       WHERE external_id = $3 OR reference_id = $3
       RETURNING *`,
      [status, data.paid_at || null, data.external_id],
    );

    return result[0];
  }

  // NOTE: In a real implementation, the webhook would need to know which tenant schema to use.
  // This could be embedded in the external_id or stored in a public lookup table.
  // For now, we'll handle this in the controller by looking up the tenant.
  private getSchemaFromExternalId(externalId: string): string {
    // Placeholder - will be implemented properly
    return 'dlh_demo';
  }

  async listPayments(tenantSchema: string, filters: { type?: string; status?: string; userId?: string }) {
    let query = `SELECT t.*, u.name as user_name
                 FROM "${tenantSchema}".transactions t
                 LEFT JOIN "${tenantSchema}".users u ON t.user_id = u.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (filters.type) {
      params.push(filters.type);
      query += ` AND t.type = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status);
      query += ` AND t.status = $${params.length}`;
    }
    if (filters.userId) {
      params.push(filters.userId);
      query += ` AND t.user_id = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';
    return this.dataSource.query(query, params);
  }

  async listPaymentsPaginated(
    tenantSchema: string,
    query: PaginationQueryDto,
    filters?: Record<string, string>,
  ): Promise<PaginatedResponse<any>> {
    return buildPaginatedQuery(this.dataSource, {
      baseQuery: `SELECT t.id, t.type, t.amount, t.status, t.reference_id, t.description, t.created_at, t.paid_at, t.expired_at, u.name as user_name FROM "${tenantSchema}".transactions t LEFT JOIN "${tenantSchema}".users u ON t.user_id = u.id`,
      countQuery: `SELECT COUNT(*) FROM "${tenantSchema}".transactions t`,
      searchableColumns: ['t.reference_id'],
      sortableColumns: ['t.created_at', 't.amount', 't.status'],
      filterableColumns: ['t.type', 't.status'],
      defaultSort: 't.created_at',
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

  async getOverdueInvoices(tenantSchema: string) {
    return this.dataSource.query(
      `SELECT t.*, u.name as user_name
       FROM "${tenantSchema}".transactions t
       LEFT JOIN "${tenantSchema}".users u ON t.user_id = u.id
       WHERE t.status = 'pending' AND t.expired_at < NOW()
       ORDER BY t.expired_at`,
    );
  }
}
