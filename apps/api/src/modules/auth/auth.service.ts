import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async loginWithPassword(tenantSchema: string, email: string, password: string) {
    const users = await this.dataSource.query(
      `SELECT id, name, email, role, password_hash FROM "${tenantSchema}".users WHERE email = $1 AND is_active = true`,
      [email],
    );

    if (!users.length) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    return this.generateTokens(user, tenantSchema);
  }

  async requestOtp(phone: string): Promise<{ message: string }> {
    const code = await this.otpService.generateOtp(phone);
    // TODO: Send via Fonnte/Zenziva SMS gateway
    console.log(`OTP for ${phone}: ${code}`); // Dev only
    return { message: 'Kode OTP telah dikirim' };
  }

  async loginWithOtp(tenantSchema: string, phone: string, code: string) {
    const isValid = await this.otpService.verifyOtp(phone, code);
    if (!isValid) {
      throw new UnauthorizedException('Kode OTP tidak valid atau sudah kadaluarsa');
    }

    let users = await this.dataSource.query(
      `SELECT id, name, phone, role FROM "${tenantSchema}".users WHERE phone = $1 AND is_active = true`,
      [phone],
    );

    if (!users.length) {
      // Auto-register citizen
      const result = await this.dataSource.query(
        `INSERT INTO "${tenantSchema}".users (name, phone, role) VALUES ($1, $2, 'citizen') RETURNING id, name, phone, role`,
        [`User ${phone}`, phone],
      );
      users = result;
    }

    return this.generateTokens(users[0], tenantSchema);
  }

  async generateTokens(user: { id: string; name: string; email?: string; phone?: string; role: string }, tenantSchema: string) {
    const payload = { sub: user.id, role: user.role, tenant: tenantSchema };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    };
  }
}
