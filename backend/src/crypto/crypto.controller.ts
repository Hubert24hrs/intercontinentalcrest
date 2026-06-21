import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crypto')
@UseGuards(JwtAuthGuard)
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('markets')
  async getLiveMarkets() {
    return this.cryptoService.getLiveMarkets();
  }

  @Get('markets/:coinId')
  async getCoinDetail(@Param('coinId') coinId: string) {
    return this.cryptoService.getCoinDetail(coinId);
  }

  @Get('markets/:coinId/chart')
  async getHistoricalChart(
    @Param('coinId') coinId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.cryptoService.getHistoricalChart(coinId, daysNum);
  }

  @Get('portfolio')
  async getPortfolio(@Req() req: any) {
    return this.cryptoService.getPortfolio(req.user.id);
  }

  @Post('buy')
  async buyCrypto(
    @Req() req: any,
    @Body() dto: {
      coinId: string;
      coinSymbol: string;
      coinName: string;
      usdAmount: number;
      fromAccountId: string;
    },
  ) {
    return this.cryptoService.buyCrypto(req.user.id, dto);
  }

  @Post('sell')
  async sellCrypto(
    @Req() req: any,
    @Body() dto: {
      coinId: string;
      coinSymbol: string;
      coinName: string;
      quantity: number;
      toAccountId: string;
    },
  ) {
    return this.cryptoService.sellCrypto(req.user.id, dto);
  }

  @Get('orders/me')
  async getMyOrders(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.cryptoService.getMyOrders(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  // Admin routes
  @Get('admin/orders')
  async getAllOrders(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.cryptoService.getAllOrders(parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('admin/volume')
  async getTotalCryptoVolume(@Req() req: any) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.cryptoService.getTotalCryptoVolume();
  }

  @Get('market-quotes')
  async getMarketQuotes() {
    return this.cryptoService.getMarketQuotes();
  }
}
