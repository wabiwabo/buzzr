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
