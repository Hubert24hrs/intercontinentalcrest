import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_ROLES, Roles } from '../auth/roles.decorator';
import { clampInt } from '../common/pagination';

const COIN_ID = /^[a-z0-9-]{2,40}$/;
const toNumber = ({ value }: { value: unknown }) => (typeof value === 'string' ? Number(value) : value);

export class BuyCryptoDto {
  @IsString() @Matches(COIN_ID) coinId: string;

  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'The minimum purchase is $1' })
  @Max(1_000_000, { message: 'A single purchase cannot exceed $1,000,000' })
  usdAmount: number;

  @IsUUID('4') fromAccountId: string;

  // Accepted for backwards compatibility; the server uses its own market data.
  @IsOptional() @IsString() @MaxLength(20) coinSymbol?: string;
  @IsOptional() @IsString() @MaxLength(60) coinName?: string;
}

export class SellCryptoDto {
  @IsString() @Matches(COIN_ID) coinId: string;

  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 8, allowNaN: false, allowInfinity: false }, { message: 'Use at most 8 decimal places' })
  @Min(0.00000001)
  quantity: number;

  @IsUUID('4') toAccountId: string;

  @IsOptional() @IsString() @MaxLength(20) coinSymbol?: string;
  @IsOptional() @IsString() @MaxLength(60) coinName?: string;
}

function assertCoinId(coinId: string) {
  if (!COIN_ID.test(coinId)) throw new BadRequestException('Unknown asset');
}

@Controller('crypto')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('markets')
  async getLiveMarkets() {
    return this.cryptoService.getLiveMarkets();
  }

  @Get('markets/:coinId')
  async getCoinDetail(@Param('coinId') coinId: string) {
    assertCoinId(coinId);
    return this.cryptoService.getCoinDetail(coinId);
  }

  @Get('markets/:coinId/chart')
  async getHistoricalChart(@Param('coinId') coinId: string, @Query('days') days?: string) {
    assertCoinId(coinId);
    return this.cryptoService.getHistoricalChart(coinId, clampInt(days, 7, 1, 365));
  }

  @Get('portfolio')
  async getPortfolio(@Req() req: any) {
    return this.cryptoService.getPortfolio(req.user.id);
  }

  @Post('buy')
  async buyCrypto(@Req() req: any, @Body() dto: BuyCryptoDto) {
    return this.cryptoService.buyCrypto(req.user.id, dto);
  }

  @Post('sell')
  async sellCrypto(@Req() req: any, @Body() dto: SellCryptoDto) {
    return this.cryptoService.sellCrypto(req.user.id, dto);
  }

  @Get('orders/me')
  async getMyOrders(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.cryptoService.getMyOrders(req.user.id, clampInt(page, 1, 1, 10_000), clampInt(limit, 20, 1, 200));
  }

  @Get('market-quotes')
  async getMarketQuotes() {
    return this.cryptoService.getMarketQuotes();
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('admin/orders')
  @Roles(...ADMIN_ROLES)
  async getAllOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.cryptoService.getAllOrders(clampInt(page, 1, 1, 10_000), clampInt(limit, 50, 1, 200));
  }

  @Get('admin/volume')
  @Roles(...ADMIN_ROLES)
  async getTotalCryptoVolume() {
    return this.cryptoService.getTotalCryptoVolume();
  }
}
