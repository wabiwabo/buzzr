import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { DataSource } from 'typeorm';
import { UserRole } from '@buzzr/shared-types';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create a user with hashed password for password roles', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'user-1', name: 'Driver A', email: 'driver@test.com', role: 'driver',
      }]);

      const result = await service.createUser('dlh_demo', {
        name: 'Driver A',
        email: 'driver@test.com',
        password: 'password123',
        role: UserRole.DRIVER,
      });

      expect(result.name).toBe('Driver A');
      // Verify the query was called with a hashed password (bcrypt hash starts with $2b$)
      const queryCall = dataSource.query.mock.calls[0];
      expect(queryCall[1][3]).toMatch(/^\$2[aby]\$/);
    });

    it('should create a citizen without password', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'user-2', name: 'Citizen', phone: '08123456789', role: 'citizen',
      }]);

      const result = await service.createUser('dlh_demo', {
        name: 'Citizen',
        phone: '08123456789',
        role: UserRole.CITIZEN,
      });

      expect(result.role).toBe('citizen');
    });
  });

  describe('listUsers', () => {
    it('should return users filtered by role', async () => {
      dataSource.query.mockResolvedValue([
        { id: '1', name: 'Driver 1', role: 'driver' },
      ]);

      const result = await service.listUsers('dlh_demo', { role: 'driver' });

      expect(result).toHaveLength(1);
      expect(dataSource.query.mock.calls[0][0]).toContain("role = $1");
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      dataSource.query.mockResolvedValue([{ id: 'user-1', name: 'Admin' }]);

      const result = await service.getUserById('dlh_demo', 'user-1');

      expect(result.name).toBe('Admin');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      dataSource.query.mockResolvedValue([]);

      await expect(service.getUserById('dlh_demo', 'none')).rejects.toThrow();
    });
  });
});
