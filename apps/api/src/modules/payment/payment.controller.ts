import { Controller, Post, Get, Body, Query, Headers, UseGuards, Req, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    return this.paymentService.createInvoice(req.tenantSchema!, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() data: any, @Headers('x-callback-token') token: string) {
    // TODO: Verify webhook signature with xenditService
    return this.paymentService.handleWebhook(data);
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  listPaginated(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
    @Query('filters') filtersStr?: string,
  ) {
    let filters: Record<string, string> | undefined;
    if (filtersStr) {
      try { filters = JSON.parse(filtersStr); } catch { /* ignore */ }
    }
    return this.paymentService.listPaymentsPaginated(req.tenantSchema!, query, filters);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Req() req: Request, @Query('type') type?: string, @Query('status') status?: string) {
    return this.paymentService.listPayments(req.tenantSchema!, { type, status });
  }

  @Get('overdue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DLH_ADMIN)
  getOverdue(@Req() req: Request) {
    return this.paymentService.getOverdueInvoices(req.tenantSchema!);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyPayments(@Req() req: any) {
    return this.paymentService.listPayments(req.tenantSchema!, { userId: req.user.userId });
  }
}
