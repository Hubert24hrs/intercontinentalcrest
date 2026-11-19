import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch, ParseUUIDPipe } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_ROLES, Roles } from '../auth/roles.decorator';
import { CreateInvestmentDto, UpdateInvestmentValueDto } from './dto/investment.dto';
import { clampInt } from '../common/pagination';

@Controller('investments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('me')
  async getMyInvestments(@Req() req: any) {
    return this.investmentsService.getMyInvestments(req.user.id);
  }

  @Post()
  async createInvestment(@Req() req: any, @Body() dto: CreateInvestmentDto) {
    return this.investmentsService.createInvestment(req.user.id, dto);
  }

  @Post(':id/close')
  async closeInvestment(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.investmentsService.closeInvestment(req.user.id, id);
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('admin/all')
  @Roles(...ADMIN_ROLES)
  async getAllInvestments(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.investmentsService.getAllInvestments(clampInt(page, 1, 1, 10_000), clampInt(limit, 20, 1, 200), status);
  }

  @Patch('admin/:id/value')
  @Roles(...ADMIN_ROLES)
  async updateValue(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateInvestmentValueDto, @Req() req: any) {
    return this.investmentsService.updateInvestmentValue(id, dto.currentValue, dto.status, req.user.id);
  }
}
