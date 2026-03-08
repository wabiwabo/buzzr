import { Test, TestingModule } from '@nestjs/testing';
import { TpsService } from './tps.service';
import { DataSource } from 'typeorm';
import { TpsType, WasteCategory } from '@buzzr/shared-types';

describe('TpsService', () => {
  let service: TpsService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TpsService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<TpsService>(TpsService);
  });

  describe('createTps', () => {
    it('should create a TPS with coordinates and QR code', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'tps-1', name: 'TPS Menteng', type: 'tps', qr_code: 'TPS-abc123',
        status: 'active', capacity_tons: 10, current_load_tons: 0,
      }]);

      const result = await service.createTps('dlh_demo', {
        name: 'TPS Menteng',
        type: TpsType.TPS,
        latitude: -6.1944,
        longitude: 106.8229,
        address: 'Jl. Menteng Raya No. 1',
        areaId: 'area-1',
        capacityTons: 10,
      });

      expect(result.name).toBe('TPS Menteng');
      expect(result.qr_code).toBeDefined();
    });
  });

  describe('recordWaste', () => {
    it('should record waste and update current load', async () => {
      // First call: insert waste record
      dataSource.query
        .mockResolvedValueOnce([{ id: 'record-1' }])
        // Second call: update current_load_tons
        .mockResolvedValueOnce([{ current_load_tons: 5.5 }]);

      const result = await service.recordWaste('dlh_demo', {
        tpsId: 'tps-1',
        category: WasteCategory.ORGANIC,
        volumeKg: 5500,
        direction: 'in',
      });

      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('listTpsPaginated', () => {
    it('should return paginated TPS with nearCapacity flag', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'tps-1', name: 'TPS A', capacity_tons: 10, current_load_tons: 9 }])
        .mockResolvedValueOnce([{ count: '30' }]);

      const result = await service.listTpsPaginated('dlh_demo', {
        page: 1, limit: 25, order: 'asc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].nearCapacity).toBe(true);
      expect(result.meta.total).toBe(30);
    });
  });

  describe('listTps', () => {
    it('should return TPS with nearCapacity flag', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'tps-1', name: 'TPS A', capacity_tons: 10, current_load_tons: 9 },
      ]);

      const result = await service.listTps('dlh_demo', {});

      expect(result[0].nearCapacity).toBe(true);
    });
  });
});
