import { Controller, Get, Patch, Body, Param, UseGuards, Req, Res, Query, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Response } from 'express';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class UpdateAccountDto {
  @IsOptional() @IsString() @MaxLength(40) accountName?: string;
}

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
  async getMonthlyStatements(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.accountsService.getMonthlyStatementsList(id, req.user.id);
  }

  @Get(':id/statement/pdf')
  async downloadStatementPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    if (!Number.isInteger(y) || y < 2000 || y > now.getFullYear() + 1 || !Number.isInteger(m) || m < 1 || m > 12) {
      throw new BadRequestException('Choose a valid statement period');
    }

    const pdfBuffer = await this.accountsService.generatePdfStatement(id, req.user.id, y, m);
    const account = await this.accountsService.getAccountById(id, req.user.id);
    const filename = `statement-${account.accountNumber}-${y}-${String(m).padStart(2, '0')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-store',
    });
    res.end(pdfBuffer);
  }

  @Patch(':id')
  async updateAccount(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() body: UpdateAccountDto) {
    return this.accountsService.updateAccount(id, req.user.id, { accountName: body.accountName?.trim() || undefined });
  }

  @Get(':id')
  async getAccount(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.accountsService.getAccountById(id, req.user.id);
  }
}
