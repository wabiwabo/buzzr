import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintService } from './complaint.service';
import { DataSource } from 'typeorm';
import { ComplaintCategory } from '@buzzr/shared-types';

describe('ComplaintService', () => {
  let service: ComplaintService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<ComplaintService>(ComplaintService);
  });

  describe('createComplaint', () => {
    it('should create a complaint', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'c-1', category: 'illegal_dumping', status: 'submitted',
      }]);
      const result = await service.createComplaint('dlh_demo', {
        reporterId: 'u-1', category: ComplaintCategory.ILLEGAL_DUMPING, description: 'Sampah liar di sungai',
        latitude: -6.19, longitude: 106.82, address: 'Jl. Menteng',
      });
      expect(result.status).toBe('submitted');
    });
  });

  describe('assignComplaint', () => {
    it('should assign to petugas and update status', async () => {
      dataSource.query.mockResolvedValue([{ id: 'c-1', status: 'assigned', assigned_to: 'petugas-1' }]);
      const result = await service.assignComplaint('dlh_demo', 'c-1', 'petugas-1');
      expect(result.status).toBe('assigned');
    });
  });

  describe('resolveComplaint', () => {
    it('should resolve complaint', async () => {
      dataSource.query.mockResolvedValue([{ id: 'c-1', status: 'resolved' }]);
      const result = await service.updateStatus('dlh_demo', 'c-1', 'resolved');
      expect(result.status).toBe('resolved');
    });
  });

  describe('rateComplaint', () => {
    it('should add rating to resolved complaint', async () => {
      dataSource.query.mockResolvedValue([{ id: 'c-1', rating: 5 }]);
      const result = await service.rateComplaint('dlh_demo', 'c-1', 5);
      expect(result.rating).toBe(5);
    });
  });
});
