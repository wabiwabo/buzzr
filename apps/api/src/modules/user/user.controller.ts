import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
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
