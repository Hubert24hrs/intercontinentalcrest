import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getMyTransactions(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.getTransactionsByUserId(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      type,
      status,
    );
  }

  @Get(':id')
  async getTransactionById(@Req() req: any, @Param('id') id: string) {
    return this.transactionsService.getTransactionById(req.user.id, id);
  }

  @Post('transfer')
  async transfer(@Req() req: any, @Body() dto: any) {
    return this.transactionsService.transfer(req.user.id, dto);
  }
}
