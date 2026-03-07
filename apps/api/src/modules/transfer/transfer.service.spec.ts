import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import { DataSource } from 'typeorm';

describe('TransferService', () => {
  let service: TransferService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<TransferService>(TransferService);
  });

  describe('createCheckpoint', () => {
    it('should create a transfer record and update TPS load', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'tr-1', status: 'in_transit' }]) // insert transfer
        .mockResolvedValueOnce([{ current_load_tons: 5 }]); // update TPS

      const result = await service.createCheckpoint('dlh_demo', {
        scheduleId: 'sch-1',
        sourceTpsId: 'tps-1',
        vehicleId: 'v-1',
        driverId: 'd-1',
        category: 'organic' as any,
        volumeKg: 2000,
        photoUrl: 'https://storage/photo1.jpg',
      });

      expect(result.status).toBe('in_transit');
      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getManifest', () => {
    it('should return all transfer records for a schedule', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'tr-1', category: 'organic', volume_kg: 2000 },
        { id: 'tr-2', category: 'inorganic', volume_kg: 1500 },
      ]);

      const result = await service.getManifest('dlh_demo', 'sch-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('verifyManifest', () => {
    it('should update all records to verified', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'tr-1', status: 'verified' },
        { id: 'tr-2', status: 'verified' },
      ]);

      const result = await service.verifyManifest('dlh_demo', 'sch-1', 'operator-1');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('verified');
    });
  });
});
