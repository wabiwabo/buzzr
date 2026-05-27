import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
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
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
        { provide: OtpService, useValue: { generateOtp: jest.fn(), verifyOtp: jest.fn() } },
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

  describe('refreshTokens', () => {
    it('should issue new tokens for a valid refresh token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1', role: 'dlh_admin', tenant: 'dlh_demo',
      });
      (dataSource.query as jest.Mock).mockResolvedValue([
        { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'dlh_admin' },
      ]);

      const result = await service.refreshTokens('valid-refresh');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@test.com');
    });

    it('should reject when the refresh token fails verification', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('bad token'));

      await expect(service.refreshTokens('bogus')).rejects.toThrow('Refresh token tidak valid');
    });

    it('should reject when the payload tenant is invalid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1', role: 'dlh_admin', tenant: '; DROP TABLE users;',
      });

      await expect(service.refreshTokens('forged')).rejects.toThrow('Refresh token tidak valid');
    });

    it('should reject when the user is no longer active', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1', role: 'dlh_admin', tenant: 'dlh_demo',
      });
      (dataSource.query as jest.Mock).mockResolvedValue([]);

      await expect(service.refreshTokens('valid-but-stale')).rejects.toThrow('Pengguna tidak ditemukan');
    });
  });
});
