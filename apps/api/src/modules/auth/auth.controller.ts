import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginPasswordDto, RequestOtpDto, VerifyOtpDto } from './dto/login.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async loginWithPassword(@Body() dto: LoginPasswordDto, @Req() req: Request) {
    return this.authService.loginWithPassword(req.tenantSchema!, dto.email, dto.password);
  }

  @Post('otp/request')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.loginWithOtp(req.tenantSchema!, dto.phone, dto.code);
  }
}
