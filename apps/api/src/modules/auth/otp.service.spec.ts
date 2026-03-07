import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
  let redis: Record<string, jest.Mock>;

  beforeEach(async () => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP and store in Redis', async () => {
      const code = await service.generateOtp('08123456789');

      expect(code).toMatch(/^\d{6}$/);
      expect(redis.set).toHaveBeenCalledWith(
        'otp:08123456789',
        expect.any(String),
        'EX',
        300,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should return true for valid OTP', async () => {
      redis.get.mockResolvedValue('123456');

      const result = await service.verifyOtp('08123456789', '123456');

      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('otp:08123456789');
    });

    it('should return false for invalid OTP', async () => {
      redis.get.mockResolvedValue('123456');

      const result = await service.verifyOtp('08123456789', '000000');

      expect(result).toBe(false);
    });

    it('should return false for expired OTP', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.verifyOtp('08123456789', '123456');

      expect(result).toBe(false);
    });
  });
});
