import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: Partial<DataSource>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.accessSecret': 'test-secret',
                'jwt.refreshSecret': 'test-refresh',
                'jwt.accessExpiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('loginWithPassword', () => {
    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (dataSource.query as jest.Mock).mockResolvedValue([
        { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'dlh_admin', password_hash: hashedPassword },
      ]);

      const result = await service.loginWithPassword('dlh_demo', 'admin@test.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('admin@test.com');
    });

    it('should throw for invalid credentials', async () => {
      (dataSource.query as jest.Mock).mockResolvedValue([]);

      await expect(
        service.loginWithPassword('dlh_demo', 'wrong@test.com', 'password'),
      ).rejects.toThrow('Email atau password salah');
    });
  });
});
