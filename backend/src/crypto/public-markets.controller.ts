import { Controller, Get } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/** Read-only market data for the public marketing pages (no sign-in required). */
@Controller('public')
export class PublicMarketsController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('markets')
  async markets() {
    const data = await this.cryptoService.getLiveMarkets();
    return data.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      current_price: c.current_price,
      price_change_percentage_24h: c.price_change_percentage_24h,
      market_cap: c.market_cap,
      market_cap_rank: c.market_cap_rank,
      total_volume: c.total_volume,
      sparkline_in_7d: c.sparkline_in_7d,
    }));
  }

  @Get('market-quotes')
  async quotes() {
    return this.cryptoService.getMarketQuotes();
  }
}
