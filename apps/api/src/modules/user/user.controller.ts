import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.userService.createUser(req.tenantSchema!, dto);
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
    return this.userService.listUsersPaginated(req.tenantSchema!, query, filters);
  }

  @Get()
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  list(@Req() req: Request, @Query('role') role?: string, @Query('areaId') areaId?: string) {
    return this.userService.listUsers(req.tenantSchema!, { role, areaId });
  }

  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.getUserById(req.tenantSchema!, req.user.userId);
  }

  @Get(':id')
  @Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.userService.getUserById(req.tenantSchema!, id);
  }
}
