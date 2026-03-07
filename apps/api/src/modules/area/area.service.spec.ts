import { Test, TestingModule } from '@nestjs/testing';
import { AreaService } from './area.service';
import { DataSource } from 'typeorm';
import { AreaLevel } from './dto/create-area.dto';

describe('AreaService', () => {
  let service: AreaService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<AreaService>(AreaService);
  });

  describe('createArea', () => {
    it('should create an area', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'area-1', name: 'DKI Jakarta', level: 'provinsi', parent_id: null,
      }]);

      const result = await service.createArea('dlh_demo', {
        name: 'DKI Jakarta',
        level: AreaLevel.PROVINSI,
      });

      expect(result.name).toBe('DKI Jakarta');
      expect(result.level).toBe('provinsi');
    });

    it('should create a child area with parent_id', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'area-2', name: 'Jakarta Selatan', level: 'kota', parent_id: 'area-1',
      }]);

      const result = await service.createArea('dlh_demo', {
        name: 'Jakarta Selatan',
        level: AreaLevel.KOTA,
        parentId: 'area-1',
      });

      expect(result.parent_id).toBe('area-1');
    });
  });

  describe('listAreas', () => {
    it('should return areas filtered by parent_id', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'area-2', name: 'Jakarta Selatan', level: 'kota' },
      ]);

      const result = await service.listAreas('dlh_demo', { parentId: 'area-1' });

      expect(result).toHaveLength(1);
    });

    it('should return root areas when no parent_id', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'area-1', name: 'DKI Jakarta', level: 'provinsi' },
      ]);

      const result = await service.listAreas('dlh_demo', {});

      expect(result).toHaveLength(1);
      expect(dataSource.query.mock.calls[0][0]).toContain('parent_id IS NULL');
    });
  });
});
