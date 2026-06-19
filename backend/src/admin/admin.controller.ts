import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getAllUsers(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.getAllUsers(
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
      role,
      status,
    );
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string, @Req() req: any) {
    this.checkAdmin(req);
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { status: string },
  ) {
    this.checkAdmin(req);
    return this.adminService.updateUserStatus(id, dto.status, req.user.id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { role: string },
  ) {
    this.checkAdmin(req);
    return this.adminService.updateUserRole(id, dto.role, req.user.id);
  }

  @Patch('accounts/:id/freeze')
  async toggleAccountFreeze(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { isFrozen: boolean },
  ) {
    this.checkAdmin(req);
    return this.adminService.toggleAccountFreeze(id, dto.isFrozen, req.user.id);
  }

  @Get('transactions')
  async getAllTransactions(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    this.checkAdmin(req);
    return this.adminService.getAllTransactions(
      parseInt(page, 10),
      parseInt(limit, 10),
      status,
    );
  }

  @Get('audit')
  async getAuditLogs(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    this.checkAdmin(req);
    return this.adminService.getAuditLogs(parseInt(page, 10), parseInt(limit, 10));
  }
}
