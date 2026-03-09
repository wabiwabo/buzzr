import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { Request } from 'express';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  @Roles(UserRole.CITIZEN)
  create(@Body() dto: CreateComplaintDto, @Req() req: any) {
    dto.reporterId = req.user.userId;
    return this.complaintService.createComplaint(req.tenantSchema!, dto);
  }

  @Get('paginated')
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
    return this.complaintService.listComplaintsPaginated(req.tenantSchema!, query, filters);
  }

  @Get()
  list(@Req() req: Request, @Query('status') status?: string) {
    return this.complaintService.listComplaints(req.tenantSchema!, { status });
  }

  @Get('my')
  @Roles(UserRole.CITIZEN)
  getMyComplaints(@Req() req: any) {
    return this.complaintService.listComplaints(req.tenantSchema!, { reporterId: req.user.userId });
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.complaintService.getComplaintById(req.tenantSchema!, id);
  }

  @Patch(':id/assign')
  @Roles(UserRole.DLH_ADMIN)
  assign(@Param('id') id: string, @Body('assigneeId') assigneeId: string, @Req() req: Request) {
    return this.complaintService.assignComplaint(req.tenantSchema!, id, assigneeId);
  }

  @Patch(':id/status')
  @Roles(UserRole.DLH_ADMIN, UserRole.SWEEPER)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.complaintService.updateStatus(req.tenantSchema!, id, status);
  }

  @Patch(':id/rate')
  @Roles(UserRole.CITIZEN)
  rate(@Param('id') id: string, @Body('rating') rating: number, @Req() req: Request) {
    return this.complaintService.rateComplaint(req.tenantSchema!, id, rating);
  }
}
