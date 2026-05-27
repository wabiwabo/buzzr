# Phase 7: Backend — New Endpoints

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add activity feed endpoint and dashboard comparison to support dashboard features.

**Depends on:** Independent — can run in parallel with frontend phases.

**Note:** The notification endpoints already exist in the API (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`). No backend work needed for notifications.

---

### Task 26: Activity Feed Endpoint

**Files:**
- Create: `apps/api/src/modules/report/dto/activity-feed.dto.ts`
- Modify: `apps/api/src/modules/report/report.service.ts`
- Modify: `apps/api/src/modules/report/report.controller.ts`
- Create: `apps/api/src/modules/report/report.service.spec.ts` (add test)

**Step 1: Write the failing test**

Add to `apps/api/src/modules/report/report.service.spec.ts`:

```ts
describe('getActivityFeed', () => {
  it('should return recent activities', async () => {
    const mockActivities = [
      { type: 'complaint', message: 'Complaint baru #412', timestamp: '2026-03-08T10:23:00Z' },
      { type: 'driver', message: 'Driver Budi memulai rute', timestamp: '2026-03-08T10:15:00Z' },
    ];

    mockDataSource.query.mockResolvedValueOnce(mockActivities);
    const result = await service.getActivityFeed('tenant_schema', 20);
    expect(result).toEqual(mockActivities);
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UNION ALL'),
      expect.any(Array),
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /opt/buzzr/apps/api && npx jest --testPathPattern=report.service.spec --verbose
```

Expected: FAIL — `getActivityFeed is not a function`

**Step 3: Implement getActivityFeed in ReportService**

Add to `apps/api/src/modules/report/report.service.ts`:

```ts
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
```

**Step 4: Add controller endpoint**

Add to `apps/api/src/modules/report/report.controller.ts`:

```ts
@Get('activity-feed')
async getActivityFeed(
  @TenantSchema() tenantSchema: string,
  @Query('limit') limit?: string,
) {
  return this.reportService.getActivityFeed(tenantSchema, Number(limit) || 20);
}
```

**Step 5: Run test to verify it passes**

```bash
cd /opt/buzzr/apps/api && npx jest --testPathPattern=report.service.spec --verbose
```

Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/modules/report/
git commit -m "feat(api): add activity feed endpoint for dashboard timeline"
```

---

### Task 27: Dashboard Comparison Data

**Files:**
- Modify: `apps/api/src/modules/report/report.service.ts`
- Modify: `apps/api/src/modules/report/report.controller.ts`

**Step 1: Write the failing test**

```ts
describe('getDashboardSummary with comparison', () => {
  it('should return current and previous period data', async () => {
    mockDataSource.query
      .mockResolvedValueOnce([{ totalWasteTodayKg: 1250, activeDrivers: 12, pendingComplaints: 5, collectionRate: 87 }])
      .mockResolvedValueOnce([{ totalWasteTodayKg: 1100, activeDrivers: 10, pendingComplaints: 7, collectionRate: 84 }]);

    const result = await service.getDashboardWithComparison('tenant_schema');
    expect(result.current).toBeDefined();
    expect(result.previous).toBeDefined();
    expect(result.trends).toBeDefined();
    expect(result.trends.wasteChange).toBeCloseTo(13.6, 0);
  });
});
```

**Step 2: Implement getDashboardWithComparison**

Add to report service:

```ts
async getDashboardWithComparison(tenantSchema: string): Promise<{
  current: any;
  previous: any;
  trends: Record<string, number>;
}> {
  const current = await this.getDashboardSummary(tenantSchema);

  // Get previous week's data using the same queries with date offset
  const schemaName = tenantSchema.replace(/[^a-z0-9_]/gi, '');
  const prevQuery = `
    SELECT
      COALESCE(SUM(tr.volume_kg), 0) as "totalWasteKg",
      COUNT(DISTINCT gl.driver_id) as "activeDrivers",
      (SELECT COUNT(*) FROM "${schemaName}".complaints
       WHERE status IN ('submitted','verified','assigned')
       AND created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
      ) as "pendingComplaints"
    FROM "${schemaName}".transfer_records tr
    LEFT JOIN "${schemaName}".gps_logs gl
      ON gl.recorded_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
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
```

**Step 3: Add controller endpoint**

Update the dashboard endpoint or add a new one:

```ts
@Get('dashboard')
async getDashboard(
  @TenantSchema() tenantSchema: string,
  @Query('compare') compare?: string,
) {
  if (compare === 'prev_week') {
    return this.reportService.getDashboardWithComparison(tenantSchema);
  }
  return this.reportService.getDashboardSummary(tenantSchema);
}
```

**Step 4: Run tests**

```bash
cd /opt/buzzr/apps/api && npx jest --testPathPattern=report --verbose
```

**Step 5: Commit**

```bash
git add apps/api/src/modules/report/
git commit -m "feat(api): add dashboard comparison data for trend indicators"
```
