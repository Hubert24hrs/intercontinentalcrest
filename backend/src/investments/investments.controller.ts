import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('me')
  async getMyInvestments(@Req() req: any) {
    return this.investmentsService.getMyInvestments(req.user.id);
  }

  @Post()
  async createInvestment(@Req() req: any, @Body() dto: any) {
    return this.investmentsService.createInvestment(req.user.id, dto);
  }

  @Post(':id/close')
  async closeInvestment(@Req() req: any, @Param('id') id: string) {
    return this.investmentsService.closeInvestment(req.user.id, id);
  }

  // Admin routes
  @Get('admin/all')
  async getAllInvestments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.investmentsService.getAllInvestments(
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Patch('admin/:id/value')
  async updateValue(
    @Param('id') id: string,
    @Body() dto: { currentValue: number; status?: string },
  ) {
    return this.investmentsService.updateInvestmentValue(
      id,
      dto.currentValue,
      dto.status,
    );
  }
}
