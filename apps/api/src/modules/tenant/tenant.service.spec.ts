import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { DataSource } from 'typeorm';

describe('TenantService', () => {
  let service: TenantService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  describe('createTenant', () => {
    it('should create a tenant and its schema', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'tenant-1', name: 'DLH Bekasi', slug: 'dlh-bekasi', schema_name: 'dlh_bekasi' }])
        .mockResolvedValueOnce(undefined);

      const result = await service.createTenant({ name: 'DLH Bekasi', slug: 'dlh-bekasi' });

      expect(result.slug).toBe('dlh-bekasi');
      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('listTenants', () => {
    it('should return all active tenants', async () => {
      dataSource.query.mockResolvedValue([
        { id: '1', name: 'DLH Bekasi', slug: 'dlh-bekasi', is_active: true },
      ]);

      const result = await service.listTenants();

      expect(result).toHaveLength(1);
    });
  });
});
