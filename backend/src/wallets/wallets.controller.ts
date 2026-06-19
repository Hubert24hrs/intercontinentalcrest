import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async getMyWallets(@Req() req: any) {
    return this.walletsService.getWallets(req.user.id);
  }

  @Post('deposit')
  async deposit(@Req() req: any, @Body() dto: { coinId: string; amount: number }) {
    return this.walletsService.deposit(req.user.id, dto);
  }

  @Post('withdraw')
  async withdraw(
    @Req() req: any,
    @Body() dto: { coinId: string; amount: number; destinationAddress: string },
  ) {
    return this.walletsService.withdraw(req.user.id, dto);
  }
}
