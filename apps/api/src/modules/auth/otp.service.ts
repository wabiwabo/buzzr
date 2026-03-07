import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async generateOtp(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, code, 'EX', this.OTP_TTL_SECONDS);
    return code;
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:${phone}`);

    if (!stored || stored !== code) {
      return false;
    }

    await this.redis.del(`otp:${phone}`);
    return true;
  }
}
