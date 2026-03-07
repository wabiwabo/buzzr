import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';

@Controller('bank-sampah')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankSampahController {
  constructor(private readonly walletService: WalletService) {}

  @Get('prices')
  getPriceList() {
    return this.walletService.getPriceList();
  }

  @Get('wallet')
  getMyWallet(@Req() req: any) {
    return this.walletService.getOrCreateWallet(req.tenantSchema, req.user.userId);
  }

  @Post('sell')
  @Roles(UserRole.TPS_OPERATOR, UserRole.DLH_ADMIN)
  recordSale(@Body() body: { userId: string; amount: number; description: string }, @Req() req: any) {
    return this.walletService.creditWallet(req.tenantSchema, body.userId, body.amount, body.description);
  }

  @Post('payout')
  requestPayout(@Body() body: { amount: number }, @Req() req: any) {
    return this.walletService.requestPayout(req.tenantSchema, req.user.userId, body.amount);
  }

  @Get('history')
  getHistory(@Req() req: any) {
    return this.walletService.getTransactionHistory(req.tenantSchema, req.user.userId);
  }
}
