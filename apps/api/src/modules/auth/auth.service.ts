import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
