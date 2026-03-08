import { DataSource } from 'typeorm';
import type { PaginatedResponse } from '../interfaces/paginated-response.interface';

interface PaginatedQueryOptions {
  /** Base SQL without WHERE/ORDER/LIMIT, e.g. `SELECT ... FROM "schema".table` */
  baseQuery: string;
  /** Base SQL for count, e.g. `SELECT COUNT(*) FROM "schema".table` */
  countQuery: string;
  /** Existing WHERE conditions, e.g. `is_active = true` */
  baseConditions?: string[];
  /** Existing params for base conditions */
  baseParams?: any[];
  /** Columns that can be searched (global search) */
  searchableColumns?: string[];
  /** Columns allowed for sorting (whitelist) */
  sortableColumns?: string[];
  /** Columns allowed for filtering (whitelist) */
  filterableColumns?: string[];
  /** Default sort column */
  defaultSort?: string;
  /** Default sort order */
  defaultOrder?: 'asc' | 'desc';
}

interface PaginatedQueryInput {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

export async function buildPaginatedQuery<T>(
  dataSource: DataSource,
  options: PaginatedQueryOptions,
  input: PaginatedQueryInput,
): Promise<PaginatedResponse<T>> {
  const {
    baseQuery,
    countQuery,
    baseConditions = [],
    baseParams = [],
    searchableColumns = [],
    sortableColumns = [],
    filterableColumns = [],
    defaultSort = 'created_at',
    defaultOrder = 'desc',
  } = options;

  const page = Math.max(1, input.page || 1);
  const limit = Math.min(100, Math.max(1, input.limit || 25));
  const offset = (page - 1) * limit;

  const conditions = [...baseConditions];
  const params = [...baseParams];

  // Global search
  if (input.search && searchableColumns.length > 0) {
    params.push(`%${input.search.toLowerCase()}%`);
    const searchClauses = searchableColumns.map(
      (col) => `LOWER(${col}) LIKE $${params.length}`,
    );
    conditions.push(`(${searchClauses.join(' OR ')})`);
  }

  // Column filters
  if (input.filters) {
    for (const [key, value] of Object.entries(input.filters)) {
      if (value && filterableColumns.includes(key)) {
        params.push(value);
        conditions.push(`${key} = $${params.length}`);
      }
    }
  }

  const whereClause = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  // Sorting (validated against whitelist)
  const sortCol = input.sort && sortableColumns.includes(input.sort)
    ? input.sort
    : defaultSort;
  const sortDir = input.order === 'asc' ? 'ASC' : input.order === 'desc' ? 'DESC'
    : defaultOrder === 'asc' ? 'ASC' : 'DESC';
  const orderClause = ` ORDER BY ${sortCol} ${sortDir}`;

  // Pagination
  params.push(limit, offset);
  const limitClause = ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  // Execute both queries
  const dataQuery = baseQuery + whereClause + orderClause + limitClause;

  // Count query uses same conditions but different base params for LIMIT/OFFSET
  const countParams = params.slice(0, params.length - 2);
  const fullCountQuery = countQuery + whereClause;

  const [data, countResult] = await Promise.all([
    dataSource.query(dataQuery, params),
    dataSource.query(fullCountQuery, countParams),
  ]);

  const total = parseInt(countResult[0]?.count || '0', 10);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
