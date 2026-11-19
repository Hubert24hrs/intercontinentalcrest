import { Controller, Get, Post, Body, Query, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransferDto } from './dto/transfer.dto';
import { clampInt } from '../common/pagination';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getMyTransactions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.transactionsService.getTransactionsByUserId(
      req.user.id,
      clampInt(page, 1, 1, 10_000),
      clampInt(limit, 20, 1, 200),
      type,
      status,
      accountId,
    );
  }

  @Get(':id')
  async getTransactionById(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.getTransactionById(req.user.id, id);
  }

  @Post('transfer')
  async transfer(@Req() req: any, @Body() dto: TransferDto) {
    return this.transactionsService.transfer(req.user.id, dto);
  }
}
