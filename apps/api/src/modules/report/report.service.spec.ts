import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { DataSource } from 'typeorm';

describe('ReportService', () => {
  let service: ReportService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<ReportService>(ReportService);
  });

  describe('getDashboardSummary', () => {
    it('should return aggregated stats', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ total_waste_today_kg: 5000 }])
        .mockResolvedValueOnce([{ active_drivers: 12 }])
        .mockResolvedValueOnce([{ pending_complaints: 3 }])
        .mockResolvedValueOnce([{ collection_rate: 85.5 }]);

      const result = await service.getDashboardSummary('dlh_demo');

      expect(result).toHaveProperty('totalWasteTodayKg');
      expect(result).toHaveProperty('activeDrivers');
      expect(result).toHaveProperty('pendingComplaints');
      expect(result).toHaveProperty('collectionRate');
    });
  });

  describe('getWasteVolumeReport', () => {
    it('should return waste volume by category', async () => {
      dataSource.query.mockResolvedValue([
        { category: 'organic', total_kg: 3000 },
        { category: 'inorganic', total_kg: 2000 },
      ]);

      const result = await service.getWasteVolumeReport('dlh_demo', '2026-03-01', '2026-03-07');

      expect(result).toHaveLength(2);
    });
  });

  describe('getComplaintStats', () => {
    it('should return complaint statistics', async () => {
      dataSource.query.mockResolvedValue([{
        total: 50, resolved: 40, avg_resolution_hours: 24.5,
      }]);

      const result = await service.getComplaintStats('dlh_demo', '2026-03-01', '2026-03-07');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('resolved');
    });
  });

  describe('getActivityFeed', () => {
    it('should return recent activities', async () => {
      const mockActivities = [
        { type: 'complaint', message: 'Laporan baru: organic', timestamp: '2026-03-08T10:23:00Z' },
        { type: 'schedule', message: 'Jadwal completed: Rute Utara', timestamp: '2026-03-08T10:15:00Z' },
      ];

      dataSource.query.mockResolvedValueOnce(mockActivities);
      const result = await service.getActivityFeed('dlh_demo', 20);
      expect(result).toEqual(mockActivities);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UNION ALL'),
        expect.any(Array),
      );
    });
  });

  describe('getDashboardWithComparison', () => {
    it('should return current and previous period data with trends', async () => {
      // Mock getDashboardSummary (4 queries)
      dataSource.query
        .mockResolvedValueOnce([{ total_waste_today_kg: 1250 }])
        .mockResolvedValueOnce([{ active_drivers: 12 }])
        .mockResolvedValueOnce([{ pending_complaints: 5 }])
        .mockResolvedValueOnce([{ collection_rate: 87 }])
        // Mock previous period query
        .mockResolvedValueOnce([{ totalWasteKg: 1100, activeDrivers: 10, pendingComplaints: 7 }]);

      const result = await service.getDashboardWithComparison('dlh_demo');
      expect(result.current).toBeDefined();
      expect(result.previous).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.trends.wasteChange).toBeCloseTo(13.6, 0);
    });
  });
});
