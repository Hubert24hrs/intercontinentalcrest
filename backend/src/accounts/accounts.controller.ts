import { Controller, Get, Patch, Body, Param, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getMyAccounts(@Req() req: any) {
    return this.accountsService.getAccountsByUserId(req.user.id);
  }

  @Get('balance')
  async getTotalBalance(@Req() req: any) {
    return this.accountsService.getTotalBalance(req.user.id);
  }

  @Get(':id/statements')
  async getMonthlyStatements(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.accountsService.getMonthlyStatementsList(id, req.user.id);
  }

  @Get(':id/statement/pdf')
  async downloadStatementPdf(
    @Param('id') id: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || (new Date().getMonth() + 1);

    const pdfBuffer = await this.accountsService.generatePdfStatement(id, req.user.id, y, m);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=statement-${id}-${year}-${month}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Patch(':id')
  async updateAccount(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { accountName?: string },
  ) {
    return this.accountsService.updateAccount(id, req.user.id, body);
  }

  @Get(':id')
  async getAccount(@Param('id') id: string, @Req() req: any) {
    return this.accountsService.getAccountById(id, req.user.id);
  }
}
