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
});
