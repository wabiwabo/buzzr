import { Test, TestingModule } from '@nestjs/testing';
import { FleetService } from './fleet.service';
import { DataSource } from 'typeorm';

describe('FleetService', () => {
  let service: FleetService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<FleetService>(FleetService);
  });

  describe('createVehicle', () => {
    it('should create a vehicle', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'v-1', plate_number: 'B 1234 CD', type: 'truk', capacity_tons: 8,
      }]);

      const result = await service.createVehicle('dlh_demo', {
        plateNumber: 'B 1234 CD',
        type: 'truk',
        capacityTons: 8,
      });

      expect(result.plate_number).toBe('B 1234 CD');
    });
  });

  describe('assignDriver', () => {
    it('should assign a driver to a vehicle', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'v-1', driver_id: 'driver-1',
      }]);

      const result = await service.assignDriver('dlh_demo', 'v-1', 'driver-1');

      expect(result.driver_id).toBe('driver-1');
    });
  });

  describe('listVehiclesPaginated', () => {
    it('should return paginated vehicles with meta', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'v-1', plate_number: 'B 1234 CD', driver_name: 'John' }])
        .mockResolvedValueOnce([{ count: '15' }]);

      const result = await service.listVehiclesPaginated('dlh_demo', {
        page: 1, limit: 25, order: 'asc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(15);
    });
  });

  describe('listVehicles', () => {
    it('should list vehicles with driver info', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'v-1', plate_number: 'B 1234 CD', driver_name: 'John' },
      ]);

      const result = await service.listVehicles('dlh_demo', {});

      expect(result).toHaveLength(1);
      expect(result[0].driver_name).toBe('John');
    });
  });
});
