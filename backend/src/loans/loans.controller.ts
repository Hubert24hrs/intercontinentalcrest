import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch, ParseUUIDPipe } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_ROLES, Roles } from '../auth/roles.decorator';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { clampInt } from '../common/pagination';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('me')
  async getMyLoans(@Req() req: any) {
    return this.loansService.getMyLoans(req.user.id);
  }

  @Post('apply')
  async applyForLoan(@Req() req: any, @Body() dto: ApplyLoanDto) {
    return this.loansService.applyForLoan(req.user.id, dto);
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('admin/all')
  @Roles(...ADMIN_ROLES)
  async getAllLoans(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.loansService.getAllLoans(clampInt(page, 1, 1, 10_000), clampInt(limit, 20, 1, 200), status);
  }

  @Patch('admin/:id/approve')
  @Roles(...ADMIN_ROLES)
  async approveLoan(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.loansService.approveLoan(id, req.user.id);
  }

  @Patch('admin/:id/reject')
  @Roles(...ADMIN_ROLES)
  async rejectLoan(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.loansService.rejectLoan(id, req.user.id);
  }
}
