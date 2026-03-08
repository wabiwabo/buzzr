# Enterprise DataTable Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SmartTable and TriageLayout with a unified, composable DataTable system built on TanStack Table with server-side pagination.

**Architecture:** Composable approach — hooks (`useServerTable`, `useDataTableKeyboard`, `useColumnVisibility`) + components (`DataTable`, `DataTableToolbar`, `DataTableColumnHeader`, `DataTablePagination`, `DataTablePreview`, `DataTableFilterPanel`, `DataTableSkeleton`, `DataTableHighlight`). Backend gains shared pagination utility (`buildPaginatedQuery`) and standardized `PaginatedResponse<T>` format.

**Tech Stack:** TanStack Table v8, @tanstack/react-virtual, shadcn/ui, Tailwind CSS, NestJS, raw SQL (PostgreSQL)

**Design Doc:** `docs/plans/2026-03-08-enterprise-datatable-design.md`

---

## Phase 1: Backend Pagination Infrastructure

### Task 1: Create PaginationQueryDto and PaginatedResponse

**Files:**
- Create: `apps/api/src/common/dto/pagination-query.dto.ts`
- Create: `apps/api/src/common/interfaces/paginated-response.interface.ts`

**Step 1: Create the DTO**

Create `apps/api/src/common/dto/pagination-query.dto.ts`:

```ts
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string;
}
```

**Step 2: Create the response interface**

Create `apps/api/src/common/interfaces/paginated-response.interface.ts`:

```ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

**Step 3: Commit**

```bash
git add apps/api/src/common/dto/pagination-query.dto.ts apps/api/src/common/interfaces/paginated-response.interface.ts
git commit -m "feat(api): add PaginationQueryDto and PaginatedResponse interface"
```

---

### Task 2: Create buildPaginatedQuery utility

**Files:**
- Create: `apps/api/src/common/utils/query-builder.util.ts`

**Step 1: Create the utility**

Create `apps/api/src/common/utils/query-builder.util.ts`:

```ts
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
```

**Step 2: Commit**

```bash
git add apps/api/src/common/utils/query-builder.util.ts
git commit -m "feat(api): add buildPaginatedQuery utility for server-side pagination"
```

---

### Task 3: Write tests for buildPaginatedQuery

**Files:**
- Create: `apps/api/src/common/utils/query-builder.util.spec.ts`

**Step 1: Write the test file**

Create `apps/api/src/common/utils/query-builder.util.spec.ts`:

```ts
import { buildPaginatedQuery } from './query-builder.util';

describe('buildPaginatedQuery', () => {
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
  });

  it('should return paginated data with meta', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ id: '1', name: 'Test' }])
      .mockResolvedValueOnce([{ count: '42' }]);

    const result = await buildPaginatedQuery(dataSource as any, {
      baseQuery: 'SELECT * FROM "test".users',
      countQuery: 'SELECT COUNT(*) FROM "test".users',
    }, { page: 1, limit: 25 });

    expect(result.data).toEqual([{ id: '1', name: 'Test' }]);
    expect(result.meta).toEqual({ page: 1, limit: 25, total: 42, totalPages: 2 });
  });

  it('should apply search across searchable columns', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: '0' }]);

    await buildPaginatedQuery(dataSource as any, {
      baseQuery: 'SELECT * FROM "test".users',
      countQuery: 'SELECT COUNT(*) FROM "test".users',
      searchableColumns: ['name', 'email'],
    }, { search: 'john' });

    const dataCall = dataSource.query.mock.calls[0];
    expect(dataCall[0]).toContain('LOWER(name) LIKE');
    expect(dataCall[0]).toContain('LOWER(email) LIKE');
    expect(dataCall[1]).toContain('%john%');
  });

  it('should apply column filters from whitelist only', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: '0' }]);

    await buildPaginatedQuery(dataSource as any, {
      baseQuery: 'SELECT * FROM "test".users',
      countQuery: 'SELECT COUNT(*) FROM "test".users',
      filterableColumns: ['role'],
    }, { filters: { role: 'driver', hackerField: 'drop table' } });

    const dataCall = dataSource.query.mock.calls[0];
    expect(dataCall[0]).toContain('role = $');
    expect(dataCall[0]).not.toContain('hackerField');
  });

  it('should validate sort column against whitelist', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: '0' }]);

    await buildPaginatedQuery(dataSource as any, {
      baseQuery: 'SELECT * FROM "test".users',
      countQuery: 'SELECT COUNT(*) FROM "test".users',
      sortableColumns: ['name', 'created_at'],
      defaultSort: 'created_at',
    }, { sort: 'password_hash', order: 'asc' });

    const dataCall = dataSource.query.mock.calls[0];
    expect(dataCall[0]).toContain('ORDER BY created_at');
    expect(dataCall[0]).not.toContain('password_hash');
  });

  it('should clamp limit to max 100', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: '0' }]);

    await buildPaginatedQuery(dataSource as any, {
      baseQuery: 'SELECT * FROM "test".users',
      countQuery: 'SELECT COUNT(*) FROM "test".users',
    }, { limit: 999 });

    const dataCall = dataSource.query.mock.calls[0];
    expect(dataCall[1]).toContain(100); // limit clamped
  });

  it('should work with base conditions', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: '0' }]);

    await buildPaginatedQuery(dataSource as any, {
      baseQuery: 'SELECT * FROM "test".users',
      countQuery: 'SELECT COUNT(*) FROM "test".users',
      baseConditions: ['is_active = $1'],
      baseParams: [true],
    }, {});

    const dataCall = dataSource.query.mock.calls[0];
    expect(dataCall[0]).toContain('is_active = $1');
    expect(dataCall[1][0]).toBe(true);
  });
});
```

**Step 2: Run the tests**

```bash
cd apps/api && npx jest src/common/utils/query-builder.util.spec.ts --verbose
```

Expected: All 5 tests PASS.

**Step 3: Commit**

```bash
git add apps/api/src/common/utils/query-builder.util.spec.ts
git commit -m "test(api): add tests for buildPaginatedQuery utility"
```

---

### Task 4: Add pagination to User service and controller

**Files:**
- Modify: `apps/api/src/modules/user/user.service.ts` — add `listUsersPaginated` method
- Modify: `apps/api/src/modules/user/user.controller.ts` — add paginated list endpoint
- Modify: `apps/api/src/modules/user/user.service.spec.ts` — add test for paginated list

**Step 1: Add listUsersPaginated to user.service.ts**

Add this import at the top of `user.service.ts`:

```ts
import { buildPaginatedQuery } from '../../common/utils/query-builder.util';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
```

Add this new method to `UserService` (keep existing `listUsers` for backward compat):

```ts
async listUsersPaginated(
  tenantSchema: string,
  query: PaginationQueryDto,
  filters?: Record<string, string>,
): Promise<PaginatedResponse<any>> {
  return buildPaginatedQuery(this.dataSource, {
    baseQuery: `SELECT id, name, email, phone, role, area_id, is_active, created_at FROM "${tenantSchema}".users`,
    countQuery: `SELECT COUNT(*) FROM "${tenantSchema}".users`,
    baseConditions: ['is_active = $1'],
    baseParams: [true],
    searchableColumns: ['name', 'email', 'phone'],
    sortableColumns: ['name', 'email', 'role', 'created_at'],
    filterableColumns: ['role', 'area_id'],
    defaultSort: 'name',
    defaultOrder: 'asc',
  }, {
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    order: query.order,
    search: query.search,
    filters,
  });
}
```

**Step 2: Add paginated endpoint to user.controller.ts**

Add import at the top:

```ts
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
```

Add this new endpoint to `UserController` (above the existing `@Get()` list method):

```ts
@Get('paginated')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
listPaginated(
  @Req() req: Request,
  @Query() query: PaginationQueryDto,
  @Query('filters') filtersStr?: string,
) {
  let filters: Record<string, string> | undefined;
  if (filtersStr) {
    try { filters = JSON.parse(filtersStr); } catch { /* ignore */ }
  }
  return this.userService.listUsersPaginated(req.tenantSchema!, query, filters);
}
```

**Step 3: Add test for paginated list**

Add this test to `user.service.spec.ts` inside the existing `describe('UserService')` block:

```ts
describe('listUsersPaginated', () => {
  it('should return paginated users with meta', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ id: 'u1', name: 'Ahmad', role: 'driver' }])
      .mockResolvedValueOnce([{ count: '50' }]);

    const result = await service.listUsersPaginated('dlh_demo', {
      page: 1, limit: 25, order: 'asc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(50);
    expect(result.meta.totalPages).toBe(2);
  });
});
```

**Step 4: Run tests**

```bash
cd apps/api && npx jest src/modules/user/user.service.spec.ts --verbose
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/api/src/modules/user/user.service.ts apps/api/src/modules/user/user.controller.ts apps/api/src/modules/user/user.service.spec.ts
git commit -m "feat(api): add paginated list endpoint for users"
```

---

### Task 5: Add pagination to all remaining services

Apply the same pattern from Task 4 to all other list endpoints. For each module, add a `listXxxPaginated` method and `GET xxx/paginated` endpoint.

**Files:**
- Modify: `apps/api/src/modules/tps/tps.service.ts`
- Modify: `apps/api/src/modules/tps/tps.controller.ts`
- Modify: `apps/api/src/modules/tps/tps.service.spec.ts`
- Modify: `apps/api/src/modules/fleet/fleet.service.ts`
- Modify: `apps/api/src/modules/fleet/fleet.controller.ts`
- Modify: `apps/api/src/modules/fleet/fleet.service.spec.ts`
- Modify: `apps/api/src/modules/complaint/complaint.service.ts`
- Modify: `apps/api/src/modules/complaint/complaint.controller.ts`
- Modify: `apps/api/src/modules/complaint/complaint.service.spec.ts`
- Modify: `apps/api/src/modules/schedule/schedule.service.ts`
- Modify: `apps/api/src/modules/schedule/schedule.controller.ts`
- Modify: `apps/api/src/modules/schedule/schedule.service.spec.ts`
- Modify: `apps/api/src/modules/payment/payment.service.ts`
- Modify: `apps/api/src/modules/payment/payment.controller.ts`
- Modify: `apps/api/src/modules/payment/payment.service.spec.ts`

**Per-module config:**

**TPS:**
- searchableColumns: `['name', 'address']`
- sortableColumns: `['name', 'type', 'status', 'capacity_tons', 'current_load_tons', 'created_at']`
- filterableColumns: `['type', 'status', 'area_id']`
- baseQuery SELECT: `id, name, type, status, address, area_id, capacity_tons, current_load_tons, qr_code, ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude, created_at`
- table: `tps_locations`
- No base conditions (return all TPS)
- Apply `nearCapacity` flag in post-processing of returned data

**Fleet:**
- searchableColumns: `['v.plate_number', 'v.brand']`
- sortableColumns: `['v.plate_number', 'v.brand', 'v.type', 'v.status', 'v.created_at']`
- filterableColumns: `['v.type', 'v.status']`
- baseConditions: `['v.is_active = $1']`, baseParams: `[true]`
- Read `apps/api/src/modules/fleet/fleet.service.ts` for exact SELECT columns and JOIN pattern

**Complaints:**
- searchableColumns: `['c.description', 'c.address']`
- sortableColumns: `['c.created_at', 'c.status', 'c.category']`
- filterableColumns: `['c.status', 'c.category']`
- Read `apps/api/src/modules/complaint/complaint.service.ts` for exact SELECT columns and JOIN pattern

**Schedule:**
- Read `apps/api/src/modules/schedule/schedule.service.ts` first — schedules currently only have `getTodaySchedules`. Add a new `listSchedulesPaginated` with a broader query.
- searchableColumns: `['s.route_name']` (check actual column name)
- sortableColumns: `['s.start_time', 's.created_at']`
- filterableColumns: `['s.type', 's.status']`

**Payment:**
- searchableColumns: `['t.reference_number']`
- sortableColumns: `['t.created_at', 't.amount', 't.status']`
- filterableColumns: `['t.type', 't.status']`
- Read `apps/api/src/modules/payment/payment.service.ts` for exact SELECT columns

**Step 1:** For each module, read the existing service file to understand the exact SQL pattern, then add a `listXxxPaginated` method using `buildPaginatedQuery`.

**Step 2:** For each module, add a `GET xxx/paginated` controller endpoint.

**Step 3:** For each module, add a basic test for the paginated method.

**Step 4: Run all tests**

```bash
cd apps/api && npx jest --verbose
```

Expected: All 18+ test suites PASS.

**Step 5: Commit**

```bash
git add apps/api/src/modules/
git commit -m "feat(api): add paginated list endpoints for tps, fleet, complaints, schedules, payments"
```

---

## Phase 2: Frontend Foundation

### Task 6: Install TanStack Virtual and create types

**Files:**
- Modify: `apps/web/package.json` (install dep via pnpm)
- Create: `apps/web/src/components/data-table/types.ts`

**Step 1: Install @tanstack/react-virtual**

Note: `@tanstack/react-table` is already installed (v8.21.3 in package.json).

```bash
cd apps/web && pnpm add @tanstack/react-virtual
```

**Step 2: Create shared types**

Create `apps/web/src/components/data-table/types.ts`:

```ts
import type { ColumnDef, Table } from '@tanstack/react-table';

export type { ColumnDef };

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'text' | 'date-range';
  options?: { label: string; value: string }[];
}

export interface ServerTableMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ColumnPriority {
  /** 1 = always visible, 2 = hidden on mobile, 3 = hidden on tablet */
  priority?: 1 | 2 | 3;
}

export interface PreviewMode {
  mode: 'split' | 'drawer';
  setMode: (mode: 'split' | 'drawer') => void;
}
```

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/components/data-table/types.ts
git commit -m "feat(web): install @tanstack/react-virtual and create DataTable types"
```

---

### Task 7: Create useServerTable hook

**Files:**
- Create: `apps/web/src/hooks/useServerTable.ts`

**Step 1: Create the hook**

Create `apps/web/src/hooks/useServerTable.ts`:

```ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  type Table,
} from '@tanstack/react-table';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import type { ServerTableMeta, FilterDef } from '@/components/data-table/types';

interface UseServerTableOptions<T> {
  endpoint: string;
  columnDefs: ColumnDef<T, any>[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  defaultLimit?: number;
  filterDefs?: FilterDef[];
  /** Fields to highlight in UI (not sent to server) */
  searchFields?: string[];
  /** Transform raw API data before passing to table */
  transformData?: (data: any[]) => T[];
}

interface UseServerTableReturn<T> {
  table: Table<T>;
  data: T[];
  isLoading: boolean;
  meta: ServerTableMeta;
  searchText: string;
  setSearchText: (text: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string | undefined) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  refetch: () => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: (state: VisibilityState) => void;
}

export function useServerTable<T>(options: UseServerTableOptions<T>): UseServerTableReturn<T> {
  const {
    endpoint,
    columnDefs,
    defaultSort = { field: 'created_at', order: 'desc' as const },
    defaultLimit = 25,
    filterDefs = [],
    transformData,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<ServerTableMeta>({ page: 1, limit: defaultLimit, total: 0, totalPages: 0 });
  const [sorting, setSorting] = useState<SortingState>(() => {
    const urlSort = searchParams.get('sort');
    const urlOrder = searchParams.get('order');
    if (urlSort) return [{ id: urlSort, desc: urlOrder === 'desc' }];
    return [{ id: defaultSort.field, desc: defaultSort.order === 'desc' }];
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Debounced search
  const [searchText, setSearchTextImmediate] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const setSearchText = useCallback((text: string) => {
    setSearchTextImmediate(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 300);
  }, []);

  // Filters from URL
  const [filters, setFiltersState] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('f_')) f[key.slice(2)] = val;
    });
    return f;
  });

  const setFilter = useCallback((key: string, value: string | undefined) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setSearchTextImmediate('');
    setDebouncedSearch('');
  }, []);

  const activeFilterCount = Object.keys(filters).length;

  // Page from URL
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || defaultLimit;

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== defaultLimit) params.set('limit', String(limit));
    if (sorting[0]) {
      params.set('sort', sorting[0].id);
      params.set('order', sorting[0].desc ? 'desc' : 'asc');
    }
    if (debouncedSearch) params.set('search', debouncedSearch);
    Object.entries(filters).forEach(([k, v]) => params.set(`f_${k}`, v));
    setSearchParams(params, { replace: true });
  }, [page, limit, sorting, debouncedSearch, filters, defaultLimit, setSearchParams]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (sorting[0]) {
        params.sort = sorting[0].id;
        params.order = sorting[0].desc ? 'desc' : 'asc';
      }
      if (debouncedSearch) params.search = debouncedSearch;
      if (Object.keys(filters).length > 0) params.filters = JSON.stringify(filters);

      const { data: response } = await api.get(`${endpoint}/paginated`, { params });
      const items = transformData ? transformData(response.data) : response.data;
      setData(items);
      setMeta(response.meta);
    } catch {
      setData([]);
      setMeta({ page: 1, limit, total: 0, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, page, limit, sorting, debouncedSearch, filters, transformData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page to 1 when search/filter/sort changes
  useEffect(() => {
    if (page > 1) {
      setSearchParams((prev) => {
        prev.delete('page');
        return prev;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, sorting]);

  const setPage = useCallback((newPage: number) => {
    setSearchParams((prev) => {
      if (newPage <= 1) prev.delete('page');
      else prev.set('page', String(newPage));
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const setLimit = useCallback((newLimit: number) => {
    setSearchParams((prev) => {
      prev.set('limit', String(newLimit));
      prev.delete('page');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  // Memoize columns
  const columns = useMemo(() => columnDefs, [columnDefs]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: meta.totalPages,
    enableRowSelection: true,
    getRowId: (row: any) => row.id,
  });

  // Attach page/limit setters to table for pagination component
  (table as any)._setPage = setPage;
  (table as any)._setLimit = setLimit;
  (table as any)._meta = meta;

  return {
    table,
    data,
    isLoading,
    meta,
    searchText,
    setSearchText,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    refetch: fetchData,
    columnVisibility,
    setColumnVisibility,
  };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useServerTable.ts
git commit -m "feat(web): add useServerTable hook with debounced search and URL sync"
```

---

### Task 8: Create useDataTableKeyboard hook

**Files:**
- Create: `apps/web/src/hooks/useDataTableKeyboard.ts`

**Step 1: Create the hook**

Create `apps/web/src/hooks/useDataTableKeyboard.ts`:

```ts
import { useEffect, useCallback, useRef } from 'react';
import type { Table } from '@tanstack/react-table';

interface UseDataTableKeyboardOptions<T> {
  table: Table<T>;
  enabled?: boolean;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onEnter?: (row: T) => void;
  onEscape?: () => void;
}

export function useDataTableKeyboard<T>({
  table,
  enabled = true,
  activeIndex,
  setActiveIndex,
  onEnter,
  onEscape,
}: UseDataTableKeyboardOptions<T>) {
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (target.isContentEditable) return;

      const rows = table.getRowModel().rows;
      if (rows.length === 0) return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(activeIndexRef.current + 1, rows.length - 1);
          setActiveIndex(next);
          break;
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(activeIndexRef.current - 1, 0);
          setActiveIndex(prev);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const row = rows[activeIndexRef.current];
          if (row && onEnter) onEnter(row.original);
          break;
        }
        case 'x': {
          e.preventDefault();
          const row = rows[activeIndexRef.current];
          if (row) row.toggleSelected();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onEscape?.();
          break;
        }
        case 'a': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              table.toggleAllRowsSelected(false);
            } else {
              table.toggleAllRowsSelected(true);
            }
          }
          break;
        }
      }
    },
    [enabled, table, setActiveIndex, onEnter, onEscape],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useDataTableKeyboard.ts
git commit -m "feat(web): add useDataTableKeyboard hook with J/K/Enter/X/Escape/Cmd+A shortcuts"
```

---

### Task 9: Create useColumnVisibility hook

**Files:**
- Create: `apps/web/src/hooks/useColumnVisibility.ts`

**Step 1: Create the hook**

Create `apps/web/src/hooks/useColumnVisibility.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import type { VisibilityState } from '@tanstack/react-table';

interface ColumnPriorityConfig {
  id: string;
  priority?: 1 | 2 | 3;
}

interface UseColumnVisibilityOptions {
  columns: ColumnPriorityConfig[];
  storageKey: string;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function getBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < MOBILE_BREAKPOINT) return 'mobile';
  if (window.innerWidth < TABLET_BREAKPOINT) return 'tablet';
  return 'desktop';
}

function getAutoVisibility(
  columns: ColumnPriorityConfig[],
  breakpoint: 'mobile' | 'tablet' | 'desktop',
): VisibilityState {
  const state: VisibilityState = {};
  for (const col of columns) {
    const priority = col.priority ?? 2;
    if (breakpoint === 'mobile' && priority >= 2) state[col.id] = false;
    else if (breakpoint === 'tablet' && priority >= 3) state[col.id] = false;
  }
  return state;
}

export function useColumnVisibility({ columns, storageKey }: UseColumnVisibilityOptions) {
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);
  const [manualOverrides, setManualOverrides] = useState<VisibilityState>(() => {
    try {
      const stored = localStorage.getItem(`col-vis-${storageKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const autoVisibility = getAutoVisibility(columns, breakpoint);

  // Manual overrides take precedence over auto
  const visibility: VisibilityState = { ...autoVisibility, ...manualOverrides };

  const setColumnVisibility = useCallback(
    (state: VisibilityState) => {
      setManualOverrides(state);
      localStorage.setItem(`col-vis-${storageKey}`, JSON.stringify(state));
    },
    [storageKey],
  );

  const hasHiddenColumns = Object.values(visibility).some((v) => v === false);

  return {
    visibility,
    setColumnVisibility,
    hasHiddenColumns,
    breakpoint,
  };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useColumnVisibility.ts
git commit -m "feat(web): add useColumnVisibility hook with responsive priority and localStorage"
```

---

## Phase 3: DataTable Components

### Task 10: Create DataTableHighlight component

**Files:**
- Create: `apps/web/src/components/data-table/DataTableHighlight.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTableHighlight.tsx`:

```tsx
import React from 'react';

interface HighlightProps {
  text: string;
  query: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, query }) => {
  if (!query || query.length < 2) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200/60 dark:bg-yellow-500/30 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTableHighlight.tsx
git commit -m "feat(web): add DataTableHighlight component for search match highlighting"
```

---

### Task 11: Create DataTableSkeleton component

**Files:**
- Create: `apps/web/src/components/data-table/DataTableSkeleton.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTableSkeleton.tsx`:

```tsx
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell } from '@/components/ui/table';

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  hasCheckbox?: boolean;
}

export const DataTableSkeleton: React.FC<DataTableSkeletonProps> = ({
  columnCount,
  rowCount = 10,
  hasCheckbox = false,
}) => {
  const totalCols = columnCount + (hasCheckbox ? 1 : 0);

  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          {hasCheckbox && (
            <TableCell className="w-10">
              <Skeleton className="h-4 w-4" />
            </TableCell>
          )}
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-3/4" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTableSkeleton.tsx
git commit -m "feat(web): add DataTableSkeleton loading placeholder"
```

---

### Task 12: Create DataTableColumnHeader component

**Files:**
- Create: `apps/web/src/components/data-table/DataTableColumnHeader.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTableColumnHeader.tsx`:

```tsx
import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter } from 'lucide-react';
import { type Column } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  filterType?: 'text' | 'select';
  filterOptions?: { label: string; value: string }[];
  filterValue?: string;
  onFilterChange?: (value: string | undefined) => void;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  filterType,
  filterOptions,
  filterValue,
  onFilterChange,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();

  return (
    <div className="flex items-center gap-1">
      {canSort ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 text-xs font-medium"
          onClick={() => column.toggleSorting(sorted === 'asc')}
        >
          {title}
          {sorted === 'asc' ? (
            <ArrowUp className="ml-1 h-3.5 w-3.5" />
          ) : sorted === 'desc' ? (
            <ArrowDown className="ml-1 h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </Button>
      ) : (
        <span className="text-xs font-medium">{title}</span>
      )}

      {filterType && onFilterChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-6 w-6', filterValue && 'text-primary')}
            >
              <Filter className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            {filterType === 'text' ? (
              <Input
                placeholder={`Filter ${title}...`}
                value={filterValue || ''}
                onChange={(e) => onFilterChange(e.target.value || undefined)}
                className="h-8 text-sm"
              />
            ) : filterType === 'select' && filterOptions ? (
              <Select value={filterValue || ''} onValueChange={(v) => onFilterChange(v || undefined)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={`Semua ${title}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTableColumnHeader.tsx
git commit -m "feat(web): add DataTableColumnHeader with sort toggle and inline filter popover"
```

---

### Task 13: Create DataTablePagination component

**Files:**
- Create: `apps/web/src/components/data-table/DataTablePagination.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTablePagination.tsx`:

```tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ServerTableMeta } from './types';

interface DataTablePaginationProps {
  meta: ServerTableMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  meta,
  onPageChange,
  onLimitChange,
}) => {
  const { page, limit, total, totalPages } = meta;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground tabular-nums">
        {rangeStart}-{rangeEnd} dari {total.toLocaleString('id-ID')}
      </span>
      <div className="flex items-center gap-2">
        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-sm tabular-nums min-w-[60px] text-center">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTablePagination.tsx
git commit -m "feat(web): add DataTablePagination with page size selector and navigation"
```

---

### Task 14: Create DataTableToolbar component

**Files:**
- Create: `apps/web/src/components/data-table/DataTableToolbar.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTableToolbar.tsx`:

```tsx
import React from 'react';
import {
  Search, Filter, Download, RefreshCw, X, Columns3,
} from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DataTableToolbarProps<T> {
  table: Table<T>;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  activeFilterCount: number;
  onToggleFilterPanel: () => void;
  filters: Record<string, string>;
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
  filterLabels?: Record<string, string>;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onRefresh?: () => void;
  extra?: React.ReactNode;
}

export function DataTableToolbar<T>({
  table,
  searchText,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  activeFilterCount,
  onToggleFilterPanel,
  filters,
  onRemoveFilter,
  onResetFilters,
  filterLabels,
  onExportCSV,
  onExportExcel,
  onRefresh,
  extra,
}: DataTableToolbarProps<T>) {
  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className="sticky top-0 z-20 bg-background pb-3 space-y-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm pr-8"
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={onToggleFilterPanel}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Columns3 className="h-3.5 w-3.5" />
              Kolom
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table.getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                  className="text-sm"
                >
                  {(col.columnDef.meta as any)?.title || col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        {(onExportCSV || onExportExcel) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {onExportCSV && <DropdownMenuItem onClick={onExportCSV}>Export CSV</DropdownMenuItem>}
              {onExportExcel && <DropdownMenuItem onClick={onExportExcel}>Export Excel</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Refresh */}
        {onRefresh && (
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {extra}

        {/* Bulk selection info */}
        {selectedCount > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedCount} dipilih</span>
            <Button size="sm" variant="ghost" onClick={() => table.toggleAllRowsSelected(false)}>
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap sticky top-11 z-10">
          <span className="text-xs text-muted-foreground mr-1">Filter aktif:</span>
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1 text-xs">
              {filterLabels?.[key] || key}: {value}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(key)} />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onResetFilters}>
            Reset semua
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTableToolbar.tsx
git commit -m "feat(web): add DataTableToolbar with search, filters, column visibility, export"
```

---

### Task 15: Create DataTableFilterPanel component

**Files:**
- Create: `apps/web/src/components/data-table/DataTableFilterPanel.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTableFilterPanel.tsx`:

```tsx
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FilterDef } from './types';

interface DataTableFilterPanelProps {
  filterDefs: FilterDef[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string | undefined) => void;
  onReset: () => void;
  onClose: () => void;
}

export const DataTableFilterPanel: React.FC<DataTableFilterPanelProps> = ({
  filterDefs,
  filters,
  onFilterChange,
  onReset,
  onClose,
}) => (
  <Card className="mb-3">
    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium">Filter</CardTitle>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
          Reset
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pb-4 px-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filterDefs.map((def) => (
          <div key={def.key}>
            <Label className="text-xs mb-1 block">{def.label}</Label>
            {def.type === 'select' || def.type === 'multi-select' ? (
              <Select
                value={filters[def.key] || ''}
                onValueChange={(v) => onFilterChange(def.key, v || undefined)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={`Semua`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {def.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : def.type === 'text' ? (
              <Input
                value={filters[def.key] || ''}
                onChange={(e) => onFilterChange(def.key, e.target.value || undefined)}
                placeholder={`Cari ${def.label.toLowerCase()}...`}
                className="h-8 text-sm"
              />
            ) : def.type === 'date-range' ? (
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={filters[`${def.key}_from`] || ''}
                  onChange={(e) => onFilterChange(`${def.key}_from`, e.target.value || undefined)}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  value={filters[`${def.key}_to`] || ''}
                  onChange={(e) => onFilterChange(`${def.key}_to`, e.target.value || undefined)}
                  className="h-8 text-xs"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTableFilterPanel.tsx
git commit -m "feat(web): add DataTableFilterPanel with select, text, and date-range filters"
```

---

### Task 16: Create DataTablePreview component

**Files:**
- Create: `apps/web/src/components/data-table/DataTablePreview.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTablePreview.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type PreviewMode = 'split' | 'drawer';

interface DataTablePreviewProps {
  open: boolean;
  onClose: () => void;
  renderContent: () => React.ReactNode;
  defaultMode?: PreviewMode;
}

export const DataTablePreview: React.FC<DataTablePreviewProps> = ({
  open,
  onClose,
  renderContent,
  defaultMode = 'split',
}) => {
  const [mode, setMode] = useState<PreviewMode>(() => {
    try {
      return (localStorage.getItem('dt-preview-mode') as PreviewMode) || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  useEffect(() => {
    localStorage.setItem('dt-preview-mode', mode);
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === 'split' ? 'drawer' : 'split'));

  if (!open) return null;

  // Drawer mode
  if (mode === 'drawer') {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex flex-row items-center justify-between">
            <SheetTitle className="text-sm">Detail</SheetTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMode} title="Mode split">
                <PanelRightOpen className="h-3.5 w-3.5" />
              </Button>
            </div>
          </SheetHeader>
          <div className="p-4">{renderContent()}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Split mode
  return (
    <div className="border-l bg-background flex flex-col w-[40%] min-w-[320px] max-w-[520px]">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Detail</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMode} title="Mode drawer">
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
    </div>
  );
};

/** Hook to get preview mode toggle button for toolbar */
export function usePreviewModeButton() {
  const [mode, setMode] = useState<PreviewMode>(() => {
    try {
      return (localStorage.getItem('dt-preview-mode') as PreviewMode) || 'split';
    } catch {
      return 'split';
    }
  });

  const button = (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => {
        const next = mode === 'split' ? 'drawer' : 'split';
        setMode(next);
        localStorage.setItem('dt-preview-mode', next);
      }}
      title={mode === 'split' ? 'Mode drawer' : 'Mode split'}
    >
      {mode === 'split' ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
    </Button>
  );

  return { mode, button };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTablePreview.tsx
git commit -m "feat(web): add DataTablePreview with split panel and drawer mode toggle"
```

---

### Task 17: Create DataTable main component

**Files:**
- Create: `apps/web/src/components/data-table/DataTable.tsx`

**Step 1: Create the component**

Create `apps/web/src/components/data-table/DataTable.tsx`:

```tsx
import React, { useState, useRef, useCallback } from 'react';
import { flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableFilterPanel } from './DataTableFilterPanel';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTablePreview } from './DataTablePreview';
import type { FilterDef, ServerTableMeta } from './types';
import type { Table as TTable } from '@tanstack/react-table';

const ROW_HEIGHT = 48;
const VIRTUALIZE_THRESHOLD = 50;

interface DataTableProps<T> {
  table: TTable<T>;
  meta: ServerTableMeta;
  isLoading: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string | undefined) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  filterDefs?: FilterDef[];
  filterLabels?: Record<string, string>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRefresh?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onRowClick?: (row: T) => void;
  activeIndex?: number;
  setActiveIndex?: (index: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  toolbarExtra?: React.ReactNode;
  // Preview
  previewOpen?: boolean;
  onPreviewClose?: () => void;
  renderPreview?: () => React.ReactNode;
  previewMode?: 'split' | 'drawer';
}

export function DataTable<T>({
  table,
  meta,
  isLoading,
  searchText,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  filterDefs,
  filterLabels,
  onPageChange,
  onLimitChange,
  onRefresh,
  onExportCSV,
  onExportExcel,
  onRowClick,
  activeIndex = -1,
  setActiveIndex,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  toolbarExtra,
  previewOpen,
  onPreviewClose,
  renderPreview,
  previewMode = 'split',
}: DataTableProps<T>) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = table.getRowModel().rows;
  const columns = table.getVisibleFlatColumns();
  const useVirtual = rows.length > VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    enabled: useVirtual,
  });

  const handleRowClick = useCallback(
    (row: T, index: number) => {
      setActiveIndex?.(index);
      onRowClick?.(row);
    },
    [setActiveIndex, onRowClick],
  );

  const showPreviewSplit = previewOpen && previewMode === 'split' && renderPreview;

  return (
    <div className="flex">
      {/* Main table area */}
      <div className={cn('flex-1 min-w-0', showPreviewSplit && 'w-[60%]')}>
        <DataTableToolbar
          table={table}
          searchText={searchText}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          activeFilterCount={activeFilterCount}
          onToggleFilterPanel={() => setFilterPanelOpen((o) => !o)}
          filters={filters}
          onRemoveFilter={(key) => onFilterChange(key, undefined)}
          onResetFilters={onResetFilters}
          filterLabels={filterLabels}
          onExportCSV={onExportCSV}
          onExportExcel={onExportExcel}
          onRefresh={onRefresh}
          extra={toolbarExtra}
        />

        {filterPanelOpen && filterDefs && (
          <DataTableFilterPanel
            filterDefs={filterDefs}
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onResetFilters}
            onClose={() => setFilterPanelOpen(false)}
          />
        )}

        <div className="rounded-md border">
          <div
            ref={scrollRef}
            className={cn(useVirtual && 'max-h-[calc(100vh-280px)] overflow-y-auto')}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {table.options.enableRowSelection && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={table.getIsAllPageRowsSelected()}
                          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
                          aria-label="Select all"
                        />
                      </TableHead>
                    )}
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <DataTableSkeleton
                    columnCount={columns.length}
                    rowCount={meta.limit}
                    hasCheckbox={!!table.options.enableRowSelection}
                  />
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (table.options.enableRowSelection ? 1 : 0)}
                      className="h-48"
                    >
                      <EmptyState
                        type={searchText || activeFilterCount > 0 ? 'no-results' : 'no-data'}
                        title={searchText || activeFilterCount > 0 ? 'Tidak ada data yang cocok' : emptyTitle}
                        description={searchText || activeFilterCount > 0 ? 'Coba ubah kata kunci atau filter' : emptyDescription}
                        actionLabel={searchText || activeFilterCount > 0 ? 'Reset Filter' : emptyActionLabel}
                        onAction={searchText || activeFilterCount > 0 ? onResetFilters : onEmptyAction}
                      />
                    </TableCell>
                  </TableRow>
                ) : useVirtual ? (
                  <>
                    {virtualizer.getVirtualItems().length > 0 && (
                      <TableRow style={{ height: virtualizer.getVirtualItems()[0].start }}>
                        <TableCell colSpan={columns.length + (table.options.enableRowSelection ? 1 : 0)} className="p-0" />
                      </TableRow>
                    )}
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const row = rows[virtualRow.index];
                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() ? 'selected' : undefined}
                          className={cn(
                            onRowClick && 'cursor-pointer',
                            virtualRow.index === activeIndex && 'ring-2 ring-primary/30 ring-inset',
                          )}
                          onClick={() => handleRowClick(row.original, virtualRow.index)}
                        >
                          {table.options.enableRowSelection && (
                            <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                              />
                            </TableCell>
                          )}
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                    {virtualizer.getVirtualItems().length > 0 && (
                      <TableRow
                        style={{
                          height: virtualizer.getTotalSize() -
                            (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                        }}
                      >
                        <TableCell colSpan={columns.length + (table.options.enableRowSelection ? 1 : 0)} className="p-0" />
                      </TableRow>
                    )}
                  </>
                ) : (
                  rows.map((row, rowIdx) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className={cn(
                        onRowClick && 'cursor-pointer',
                        rowIdx === activeIndex && 'ring-2 ring-primary/30 ring-inset',
                      )}
                      onClick={() => handleRowClick(row.original, rowIdx)}
                    >
                      {table.options.enableRowSelection && (
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                          />
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DataTablePagination
          meta={meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>

      {/* Preview panel (split mode) */}
      {showPreviewSplit && onPreviewClose && (
        <DataTablePreview
          open
          onClose={onPreviewClose}
          renderContent={renderPreview}
        />
      )}

      {/* Preview panel (drawer mode) */}
      {previewOpen && previewMode === 'drawer' && renderPreview && onPreviewClose && (
        <DataTablePreview
          open
          onClose={onPreviewClose}
          renderContent={renderPreview}
          defaultMode="drawer"
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/data-table/DataTable.tsx
git commit -m "feat(web): add DataTable main component with virtualization, sticky header, and preview"
```

---

### Task 18: Create barrel export and verify build

**Files:**
- Create: `apps/web/src/components/data-table/index.ts`

**Step 1: Create barrel export**

Create `apps/web/src/components/data-table/index.ts`:

```ts
export { DataTable } from './DataTable';
export { DataTableToolbar } from './DataTableToolbar';
export { DataTableColumnHeader } from './DataTableColumnHeader';
export { DataTablePagination } from './DataTablePagination';
export { DataTablePreview, usePreviewModeButton } from './DataTablePreview';
export { DataTableFilterPanel } from './DataTableFilterPanel';
export { DataTableSkeleton } from './DataTableSkeleton';
export { Highlight } from './DataTableHighlight';
export type { FilterDef, ServerTableMeta, ColumnPriority, PreviewMode } from './types';
```

**Step 2: Verify build**

```bash
cd apps/web && pnpm run build
```

Expected: Build succeeds. New components are tree-shaken out since no page imports them yet.

**Step 3: Commit**

```bash
git add apps/web/src/components/data-table/index.ts
git commit -m "feat(web): add DataTable barrel export and verify build"
```

---

## Phase 4: Page Migrations

### Task 19: Migrate UserPage to DataTable

**Files:**
- Modify: `apps/web/src/pages/UserPage.tsx`

**Step 1: Rewrite UserPage**

Replace the SmartTable usage with DataTable + useServerTable. Key changes:

- Replace `import { SmartTable, DetailDrawer } from '../components/data'` with `import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table'`
- Replace `import { useTableState } from '../hooks/useTableState'` with `import { useServerTable } from '@/hooks/useServerTable'`
- Define TanStack `ColumnDef<User>[]` using `columnHelper` pattern with `DataTableColumnHeader` for headers
- Use `useServerTable({ endpoint: '/users', ... })` instead of `useTableState`
- Remove manual `fetchData` with `api.get` — `useServerTable` handles fetching
- Keep the create form (SlideOver + react-hook-form) as-is
- Use `DataTablePreview` (drawer mode) instead of `DetailDrawer` for user detail view
- Use `Highlight` component to wrap name/email cells for search match highlighting
- Add `filterDefs` for role and status columns
- Column priorities: name=1, contact=1, role=2, area=3, status=2, created_at=3, actions=1

**Step 2: Verify build**

```bash
cd apps/web && pnpm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/web/src/pages/UserPage.tsx
git commit -m "feat(web): migrate UserPage from SmartTable to DataTable"
```

---

### Task 20: Migrate ReportPage to DataTable

**Files:**
- Modify: `apps/web/src/pages/ReportPage.tsx`

**Step 1: Rewrite the driver performance table in ReportPage**

- Replace `SmartTable<DriverPerf>` with `DataTable`
- Use `useServerTable` for driver performance data
- Keep the chart/stats sections unchanged
- This page may not need preview panel — just standard DataTable

**Step 2: Verify build**

```bash
cd apps/web && pnpm run build
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/ReportPage.tsx
git commit -m "feat(web): migrate ReportPage from SmartTable to DataTable"
```

---

### Task 21: Migrate ComplaintTriagePage to DataTable

**Files:**
- Modify: `apps/web/src/pages/ComplaintTriagePage.tsx`

**Step 1: Rewrite ComplaintTriagePage**

This is the most complex migration. Key changes:

- Replace `import { TriageLayout } from '@/components/triage'` and all triage hooks
- Use `useServerTable({ endpoint: '/complaints', ... })` for data fetching
- Define TanStack `ColumnDef<Complaint>[]` with columns: description, category, status, reporter, address, created_at, SLA
- Use `DataTable` with `previewOpen` / `renderPreview` props for the detail panel
- Use `useDataTableKeyboard` for J/K/Enter/X/Escape navigation
- Include `StatusStepper` and `SlaCountdown` inside `renderPreview`
- Include status transition buttons inside preview
- Filter defs: status (select), category (select)
- Default preview mode: 'split'

**Step 2: Verify build**

```bash
cd apps/web && pnpm run build
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintTriagePage.tsx
git commit -m "feat(web): migrate ComplaintTriagePage from TriageLayout to DataTable"
```

---

### Task 22: Migrate TpsTriagePage to DataTable

**Files:**
- Modify: `apps/web/src/pages/TpsTriagePage.tsx`

**Step 1: Rewrite TpsTriagePage**

Same pattern as ComplaintTriagePage:
- Use `useServerTable({ endpoint: '/tps', ... })`
- Columns: name, type, status, address, capacity, load%, created_at
- Filter defs: type (select), status (select)
- Preview with TPS detail, load percentage, map coordinates
- Keyboard navigation enabled
- Default preview mode: 'split'

**Step 2: Verify build and commit**

```bash
cd apps/web && pnpm run build
git add apps/web/src/pages/TpsTriagePage.tsx
git commit -m "feat(web): migrate TpsTriagePage from TriageLayout to DataTable"
```

---

### Task 23: Migrate FleetTriagePage to DataTable

**Files:**
- Modify: `apps/web/src/pages/FleetTriagePage.tsx`

Same pattern. Columns: plate_number, brand, type, status, driver_name. Filter defs: type, status. Preview with vehicle details.

**Step 1: Rewrite, build, commit**

```bash
cd apps/web && pnpm run build
git add apps/web/src/pages/FleetTriagePage.tsx
git commit -m "feat(web): migrate FleetTriagePage from TriageLayout to DataTable"
```

---

### Task 24: Migrate ScheduleTriagePage to DataTable

**Files:**
- Modify: `apps/web/src/pages/ScheduleTriagePage.tsx`

Same pattern. Columns: route_name, type, status, start_time, driver. Filter defs: type, status.

**Step 1: Rewrite, build, commit**

```bash
cd apps/web && pnpm run build
git add apps/web/src/pages/ScheduleTriagePage.tsx
git commit -m "feat(web): migrate ScheduleTriagePage from TriageLayout to DataTable"
```

---

### Task 25: Migrate PaymentTriagePage to DataTable

**Files:**
- Modify: `apps/web/src/pages/PaymentTriagePage.tsx`

Same pattern. Columns: reference_number, type, amount, status, user_name, created_at. Filter defs: type, status.

**Step 1: Rewrite, build, commit**

```bash
cd apps/web && pnpm run build
git add apps/web/src/pages/PaymentTriagePage.tsx
git commit -m "feat(web): migrate PaymentTriagePage from TriageLayout to DataTable"
```

---

## Phase 5: Cleanup

### Task 26: Remove old SmartTable and triage components

**Files:**
- Delete: `apps/web/src/components/data/SmartTable.tsx`
- Delete: `apps/web/src/components/data/FilterPanel.tsx`
- Delete: `apps/web/src/components/data/DetailDrawer.tsx`
- Modify: `apps/web/src/components/data/index.ts` — remove deleted exports
- Delete: `apps/web/src/hooks/useTableState.ts`
- Delete: `apps/web/src/hooks/useTriageSelection.ts`
- Delete: `apps/web/src/hooks/useTriageKeyboard.ts`
- Delete: `apps/web/src/hooks/useFacetedFilter.ts`
- Delete: `apps/web/src/hooks/useSavedViews.ts`
- Delete: `apps/web/src/components/triage/TriageLayout.tsx`
- Delete: `apps/web/src/components/triage/TriageList.tsx`
- Delete: `apps/web/src/components/triage/TriageListRow.tsx`
- Delete: `apps/web/src/components/triage/TriagePreview.tsx`
- Delete: `apps/web/src/components/triage/TriageToolbar.tsx`
- Delete: `apps/web/src/components/triage/TriageBulkBar.tsx`
- Delete: `apps/web/src/components/triage/FilterSidebar.tsx`
- Delete: `apps/web/src/components/triage/FacetGroup.tsx`
- Delete: `apps/web/src/components/triage/SavedViewList.tsx`
- Modify: `apps/web/src/components/triage/index.ts` — keep only StatusStepper, SlaCountdown, CommandPalette

**Step 1:** Grep for any remaining imports of deleted files:

```bash
cd apps/web && grep -r "SmartTable\|FilterPanel\|DetailDrawer\|useTableState\|useTriageSelection\|useTriageKeyboard\|useFacetedFilter\|useSavedViews\|TriageLayout\|TriageList\|TriageToolbar\|TriageBulkBar\|FilterSidebar\|FacetGroup\|SavedViewList" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches (all pages already migrated).

**Step 2:** Delete files and update barrel exports.

**Step 3: Verify build**

```bash
cd apps/web && pnpm run build
```

**Step 4: Run API tests to confirm no regressions**

```bash
cd apps/api && npx jest --verbose
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add -A apps/web/src/components/data/ apps/web/src/components/triage/ apps/web/src/hooks/
git commit -m "refactor(web): remove SmartTable, triage components, and old hooks — replaced by DataTable"
```

---

### Task 27: Final verification

**Step 1: Full build**

```bash
cd apps/web && pnpm run build
```

Expected: Build succeeds. Check main bundle size — should be smaller or similar since old triage code is removed.

**Step 2: Run all API tests**

```bash
cd apps/api && npx jest --verbose
```

Expected: All test suites PASS (18+ original + new pagination tests).

**Step 3: Verify no dead imports**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No type errors.

**Step 4: Commit (if any fixes needed)**

```bash
git add -A && git commit -m "fix(web): final cleanup and verification"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1: Backend | 1-5 | PaginationDto, PaginatedResponse, buildPaginatedQuery, paginated endpoints for all 6 modules |
| 2: Frontend Foundation | 6-9 | Types, useServerTable, useDataTableKeyboard, useColumnVisibility |
| 3: DataTable Components | 10-18 | Highlight, Skeleton, ColumnHeader, Pagination, Toolbar, FilterPanel, Preview, DataTable, barrel export |
| 4: Page Migrations | 19-25 | UserPage, ReportPage, ComplaintTriagePage, TpsTriagePage, FleetTriagePage, ScheduleTriagePage, PaymentTriagePage |
| 5: Cleanup | 26-27 | Delete old components/hooks, final verification |
