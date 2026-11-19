import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const toNumber = ({ value }: { value: unknown }) => (typeof value === 'string' ? Number(value) : value);

export class WalletDepositDto {
  @IsString() @Matches(/^[a-z0-9-]{2,40}$/) coinId: string;

  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 8, allowNaN: false, allowInfinity: false }, { message: 'Use at most 8 decimal places' })
  @Min(0.00000001, { message: 'Amount must be greater than 0' })
  @Max(1_000_000_000)
  amount: number;
}

export class WalletWithdrawDto extends WalletDepositDto {
  @IsString()
  @Matches(/^[A-Za-z0-9:_-]{20,120}$/, { message: 'Enter a valid destination address' })
  destinationAddress: string;
}

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async getMyWallets(@Req() req: any) {
    return this.walletsService.getWallets(req.user.id);
  }

  @Get('history')
  async getHistory(@Req() req: any, @Query('coinId') coinId?: string) {
    return this.walletsService.getHistory(req.user.id, coinId || undefined);
  }

  @Post('deposit')
  async deposit(@Req() req: any, @Body() dto: WalletDepositDto) {
    return this.walletsService.deposit(req.user.id, dto);
  }

  @Post('withdraw')
  async withdraw(@Req() req: any, @Body() dto: WalletWithdrawDto) {
    return this.walletsService.withdraw(req.user.id, dto);
  }
}
