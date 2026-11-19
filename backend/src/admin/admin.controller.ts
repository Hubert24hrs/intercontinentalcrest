import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { AdminService, Actor } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_ROLES, Roles } from '../auth/roles.decorator';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { clampInt } from '../common/pagination';

const toNumber = ({ value }: { value: unknown }) => (typeof value === 'string' ? Number(value) : value);

class UpdateStatusDto {
  @IsIn(['active', 'suspended', 'inactive'], { message: 'status must be active, suspended or inactive' })
  status: string;
}

class UpdateRoleDto {
  @IsIn(['customer', 'support', 'admin'], { message: 'role must be customer, support or admin' })
  role: string;
}

class FreezeDto {
  @IsBoolean() isFrozen: boolean;
}

class LegacyCreditDto {
  @Transform(toNumber) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(500_000) amount: number;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

class CreditCryptoDto {
  @IsString() @Matches(/^[a-z0-9-]{2,40}$/) coinId: string;
  @Transform(toNumber) @IsNumber({ maxDecimalPlaces: 8 }) @Min(0.00000001) @Max(1_000_000) quantity: number;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
  // Older clients send these; the server uses market data instead.
  @IsOptional() @IsString() @MaxLength(20) coinSymbol?: string;
  @IsOptional() @IsString() @MaxLength(60) coinName?: string;
}

function actorOf(req: any): Actor {
  return { id: req.user.id, role: req.user.role, email: req.user.email };
}

function clientIp(req: any): string | undefined {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || undefined;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers(clampInt(page, 1, 1, 10_000), clampInt(limit, 20, 1, 200), search, role, status);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateUserStatus(id, dto.status, actorOf(req));
  }

  @Patch('users/:id/role')
  async updateUserRole(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateUserRole(id, dto.role, actorOf(req));
  }

  /** Legacy endpoint — delegates to the audited balance adjustment. */
  @Post('accounts/:id/credit')
  async creditBankAccount(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() dto: LegacyCreditDto) {
    const owner = await this.adminService.getAccountOwner(id);
    if (!owner) throw new NotFoundException('Account not found');
    return this.adminService.adjustBalance(
      owner.userId,
      { type: 'credit', amount: dto.amount, accountId: id, reason: dto.description?.trim() || 'Manual credit' } as AdjustBalanceDto,
      actorOf(req),
      clientIp(req),
    );
  }

  @Post('users/:id/credit-crypto')
  async creditCrypto(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() dto: CreditCryptoDto) {
    return this.adminService.creditCrypto(id, dto, actorOf(req));
  }

  @Patch('accounts/:id/freeze')
  async toggleAccountFreeze(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() dto: FreezeDto) {
    return this.adminService.toggleAccountFreeze(id, dto.isFrozen, actorOf(req));
  }

  @Get('transactions')
  async getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllTransactions(clampInt(page, 1, 1, 10_000), clampInt(limit, 20, 1, 200), status, search);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.adminService.deleteUser(id, actorOf(req));
  }

  @Get('audit')
  async getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(clampInt(page, 1, 1, 10_000), clampInt(limit, 50, 1, 200));
  }

  @Post('customers/:customerId/adjust-balance')
  async adjustBalance(@Param('customerId', new ParseUUIDPipe()) customerId: string, @Body() dto: AdjustBalanceDto, @Req() req: any) {
    return this.adminService.adjustBalance(customerId, dto, actorOf(req), clientIp(req));
  }
}
