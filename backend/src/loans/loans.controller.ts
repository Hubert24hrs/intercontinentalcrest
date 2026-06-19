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
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('me')
  async getMyLoans(@Req() req: any) {
    return this.loansService.getMyLoans(req.user.id);
  }

  @Post('apply')
  async applyForLoan(@Req() req: any, @Body() dto: any) {
    return this.loansService.applyForLoan(req.user.id, dto);
  }

  // Admin routes
  @Get('admin/all')
  async getAllLoans(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.loansService.getAllLoans(parseInt(page), parseInt(limit), status);
  }

  @Patch('admin/:id/approve')
  async approveLoan(@Param('id') id: string, @Req() req: any) {
    return this.loansService.approveLoan(id, req.user.id);
  }

  @Patch('admin/:id/reject')
  async rejectLoan(@Param('id') id: string, @Req() req: any) {
    return this.loansService.rejectLoan(id, req.user.id);
  }
}
