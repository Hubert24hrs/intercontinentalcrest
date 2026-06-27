import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';

// ─── In-memory price cache to avoid hammering CoinGecko's free tier ───────────
interface PriceCache {
  data: CoinMarket[];
  fetchedAt: number; // epoch ms
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  sparkline_in_7d: { price: number[] } | null;
}

const SUPPORTED_COINS = [
  'bitcoin',
  'ethereum',
  'tether',
  'binancecoin',
  'solana',
  'ripple',
  'cardano',
  'avalanche-2',
  'polkadot',
  'dogecoin',
  'shiba-inu',
  'matic-network',
  'chainlink',
  'litecoin',
  'bitcoin-cash',
  'stellar',
  'uniswap',
  'tron',
  'near',
  'internet-computer',
].join(',');

const CACHE_TTL_MS = 60_000; // refresh cache every 60 seconds

@Injectable()
export class CryptoService {
  private cache: PriceCache | null = null;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ── Private high-fidelity simulation methods for graceful fallback ─────────────

  private getSimulatedMarkets(): CoinMarket[] {
    const baselinePrices: { [key: string]: { name: string; symbol: string; price: number; rank: number; img: string } } = {
      'bitcoin': { name: 'Bitcoin', symbol: 'btc', price: 64120, rank: 1, img: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400' },
      'ethereum': { name: 'Ethereum', symbol: 'eth', price: 3450, rank: 2, img: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501400' },
      'tether': { name: 'Tether', symbol: 'usdt', price: 1.00, rank: 3, img: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501400' },
      'binancecoin': { name: 'BNB', symbol: 'bnb', price: 585, rank: 4, img: 'https://coin-images.coingecko.com/coins/images/825/large/binance-coin-logo.png?1696501400' },
      'solana': { name: 'Solana', symbol: 'sol', price: 145.8, rank: 5, img: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1696501400' },
      'ripple': { name: 'Ripple', symbol: 'xrp', price: 0.49, rank: 6, img: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501400' },
      'cardano': { name: 'Cardano', symbol: 'ada', price: 0.38, rank: 7, img: 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696501400' },
      'avalanche-2': { name: 'Avalanche', symbol: 'avax', price: 28.5, rank: 8, img: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedFont_RGB.png?1696501400' },
      'polkadot': { name: 'Polkadot', symbol: 'dot', price: 5.85, rank: 9, img: 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png?1696501400' },
      'dogecoin': { name: 'Dogecoin', symbol: 'doge', price: 0.125, rank: 10, img: 'https://coin-images.coingecko.com/coins/images/325/large/dogecoin.png?1696501400' },
      'shiba-inu': { name: 'Shiba Inu', symbol: 'shib', price: 0.0000185, rank: 11, img: 'https://coin-images.coingecko.com/coins/images/11939/large/shiba.png?1696501400' },
      'matic-network': { name: 'Polygon', symbol: 'matic', price: 0.55, rank: 12, img: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1696501400' },
      'chainlink': { name: 'Chainlink', symbol: 'link', price: 13.6, rank: 13, img: 'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1696501400' },
      'litecoin': { name: 'Litecoin', symbol: 'ltc', price: 72.8, rank: 14, img: 'https://coin-images.coingecko.com/coins/images/2/large/litecoin.png?1696501400' },
      'bitcoin-cash': { name: 'Bitcoin Cash', symbol: 'bch', price: 382, rank: 15, img: 'https://coin-images.coingecko.com/coins/images/780/large/bitcoin-cash.png?1696501400' },
      'stellar': { name: 'Stellar', symbol: 'xlm', price: 0.095, rank: 16, img: 'https://coin-images.coingecko.com/coins/images/100/large/stellar.png?1696501400' },
      'uniswap': { name: 'Uniswap', symbol: 'uni', price: 7.25, rank: 17, img: 'https://coin-images.coingecko.com/coins/images/12504/large/uniswap-uni.png?1696501400' },
      'tron': { name: 'TRON', symbol: 'trx', price: 0.118, rank: 18, img: 'https://coin-images.coingecko.com/coins/images/1094/large/tron.png?1696501400' },
      'near': { name: 'NEAR Protocol', symbol: 'near', price: 4.85, rank: 19, img: 'https://coin-images.coingecko.com/coins/images/10365/large/near.png?1696501400' },
      'internet-computer': { name: 'Internet Computer', symbol: 'icp', price: 8.25, rank: 20, img: 'https://coin-images.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png?1696501400' }
    };

    const now = Date.now();
    return Object.entries(baselinePrices).map(([id, info], idx) => {
      const wave = Math.sin(now / 300000 + idx); 
      const pctChange = wave * 3.5; 
      const currentPrice = info.price * (1 + pctChange / 100);

      const sparklinePrices: number[] = [];
      for (let i = 24; i >= 0; i--) {
        const pointTime = now - i * 3600 * 1000;
        const pointWave = Math.sin(pointTime / 300000 + idx);
        sparklinePrices.push(info.price * (1 + (pointWave * 3.5) / 100));
      }

      return {
        id,
        symbol: info.symbol,
        name: info.name,
        image: info.img,
        current_price: parseFloat(currentPrice.toFixed(info.price < 1 ? 6 : 2)),
        market_cap: Math.round(info.price * 100000000 * (1 + pctChange / 200)),
        market_cap_rank: info.rank,
        fully_diluted_valuation: Math.round(info.price * 120000000 * (1 + pctChange / 200)),
        total_volume: Math.round(info.price * 5000000 * (1 + Math.abs(wave))),
        high_24h: parseFloat((info.price * 1.05).toFixed(info.price < 1 ? 6 : 2)),
        low_24h: parseFloat((info.price * 0.95).toFixed(info.price < 1 ? 6 : 2)),
        price_change_24h: parseFloat((info.price * (pctChange / 100)).toFixed(info.price < 1 ? 6 : 2)),
        price_change_percentage_24h: parseFloat(pctChange.toFixed(2)),
        market_cap_change_24h: Math.round(info.price * 100000000 * (pctChange / 200)),
        market_cap_change_percentage_24h: parseFloat((pctChange / 2).toFixed(2)),
        circulating_supply: 80000000,
        total_supply: 100000000,
        max_supply: 100000000,
        ath: parseFloat((info.price * 1.5).toFixed(info.price < 1 ? 6 : 2)),
        ath_change_percentage: -33.33,
        ath_date: new Date(now - 365 * 24 * 3600 * 1000).toISOString(),
        atl: parseFloat((info.price * 0.1).toFixed(info.price < 1 ? 6 : 2)),
        atl_change_percentage: 900,
        atl_date: new Date(now - 3 * 365 * 24 * 3600 * 1000).toISOString(),
        sparkline_in_7d: { price: sparklinePrices }
      };
    });
  }

  private getSimulatedCoinDetail(coinId: string): any {
    const markets = this.getSimulatedMarkets();
    const coin = markets.find(c => c.id === coinId) || markets[0];
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: {
        large: coin.image,
        small: coin.image,
        thumb: coin.image,
      },
      market_data: {
        current_price: {
          usd: coin.current_price,
        },
        price_change_percentage_24h: coin.price_change_percentage_24h,
        high_24h: {
          usd: coin.high_24h,
        },
        low_24h: {
          usd: coin.low_24h,
        },
        market_cap: {
          usd: coin.market_cap,
        },
        total_volume: {
          usd: coin.total_volume,
        },
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
      }
    };
  }

  private getSimulatedHistoricalChart(coinId: string, days: number = 7): any {
    const markets = this.getSimulatedMarkets();
    const coin = markets.find(c => c.id === coinId) || markets[0];
    const basePrice = coin.current_price;

    const prices: [number, number][] = [];
    const now = Date.now();
    const totalPoints = days * 24;
    const intervalMs = (days * 24 * 3600 * 1000) / totalPoints;

    for (let i = totalPoints; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const trend = ((totalPoints - i) / totalPoints) * 0.03; 
      const cycle = Math.sin(timestamp / 7200000) * 0.05; 
      const noise = Math.sin(timestamp / 300000) * 0.01; 
      const price = basePrice * (1 + trend + cycle + noise);
      prices.push([timestamp, parseFloat(price.toFixed(basePrice < 1 ? 6 : 2))]);
    }

    return { prices };
  }

  // ── Public market data (proxied through backend so frontend never exposes API) ──

  async getLiveMarkets(): Promise<CoinMarket[]> {
    const now = Date.now();

    if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.data;
    }

    try {
      const url =
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=usd` +
        `&ids=${SUPPORTED_COINS}` +
        `&order=market_cap_desc` +
        `&per_page=20` +
        `&page=1` +
        `&sparkline=true` +
        `&price_change_percentage=1h,24h,7d`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IntercontinentalCrest/1.0',
        },
      });

      if (!res.ok) {
        console.warn(`CoinGecko markets returned ${res.status}. Using simulation fallback.`);
        const simulated = this.getSimulatedMarkets();
        this.cache = { data: simulated, fetchedAt: now };
        return simulated;
      }

      const data: CoinMarket[] = await res.json();
      this.cache = { data, fetchedAt: now };
      return data;
    } catch (err) {
      console.warn(`CoinGecko markets fetch exception: ${err.message}. Using simulation fallback.`);
      const simulated = this.getSimulatedMarkets();
      this.cache = { data: simulated, fetchedAt: now };
      return simulated;
    }
  }

  async getCoinDetail(coinId: string): Promise<any> {
    try {
      const url =
        `https://api.coingecko.com/api/v3/coins/${coinId}` +
        `?localization=false&tickers=false&market_data=true` +
        `&community_data=false&developer_data=false&sparkline=true`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IntercontinentalCrest/1.0',
        },
      });

      if (!res.ok) {
        console.warn(`CoinGecko detail for "${coinId}" returned ${res.status}. Using simulation fallback.`);
        return this.getSimulatedCoinDetail(coinId);
      }
      return await res.json();
    } catch (err) {
      console.warn(`CoinGecko detail for "${coinId}" exception: ${err.message}. Using simulation fallback.`);
      return this.getSimulatedCoinDetail(coinId);
    }
  }

  async getHistoricalChart(
    coinId: string,
    days: number = 7,
    currency: string = 'usd',
  ): Promise<any> {
    try {
      const url =
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart` +
        `?vs_currency=${currency}&days=${days}`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IntercontinentalCrest/1.0',
        },
      });

      if (!res.ok) {
        console.warn(`CoinGecko chart for "${coinId}" returned ${res.status}. Using simulation fallback.`);
        return this.getSimulatedHistoricalChart(coinId, days);
      }
      return await res.json();
    } catch (err) {
      console.warn(`CoinGecko chart for "${coinId}" exception: ${err.message}. Using simulation fallback.`);
      return this.getSimulatedHistoricalChart(coinId, days);
    }
  }

  // ── Portfolio endpoints ────────────────────────────────────────────────────────

  async getPortfolio(userId: string) {
    const holdings = await this.prisma.cryptoHolding.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const orders = await this.prisma.cryptoOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { holdings, orders };
  }

  async buyCrypto(
    userId: string,
    dto: {
      coinId: string;
      coinSymbol: string;
      coinName: string;
      usdAmount: number; // how many USD to spend
      fromAccountId: string;
    },
  ) {
    if (dto.usdAmount < 1) {
      throw new BadRequestException('Minimum purchase is $1 USD');
    }

    // 1. Fetch live price
    const markets = await this.getLiveMarkets();
    const coin = markets.find((c) => c.id === dto.coinId);
    if (!coin) throw new NotFoundException(`Coin ${dto.coinId} not found`);

    const pricePerCoin = coin.current_price;
    const fee = parseFloat((dto.usdAmount * 0.005).toFixed(8)); // 0.5% fee
    const netUsd = dto.usdAmount - fee;
    const quantity = parseFloat((netUsd / pricePerCoin).toFixed(8));

    // 2. Deduct USD from bank account
    const account = await this.prisma.account.findUnique({
      where: { id: dto.fromAccountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new BadRequestException('Account mismatch');
    if (account.isFrozen) throw new BadRequestException('Account is frozen');
    if (account.availableBalance.lessThan(new Decimal(dto.usdAmount))) {
      throw new BadRequestException('Insufficient funds');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from bank account
      await tx.account.update({
        where: { id: dto.fromAccountId },
        data: {
          balance: { decrement: new Decimal(dto.usdAmount) },
          availableBalance: { decrement: new Decimal(dto.usdAmount) },
        },
      });

      // Upsert holding (weighted average cost)
      const existing = await tx.cryptoHolding.findUnique({
        where: { userId_coinId: { userId, coinId: dto.coinId } },
      });

      if (existing) {
        const oldQty = Number(existing.quantity);
        const oldAvg = Number(existing.avgBuyPrice);
        const newQty = oldQty + quantity;
        const newAvg = (oldAvg * oldQty + pricePerCoin * quantity) / newQty;

        await tx.cryptoHolding.update({
          where: { userId_coinId: { userId, coinId: dto.coinId } },
          data: {
            quantity: new Decimal(newQty.toFixed(8)),
            avgBuyPrice: new Decimal(newAvg.toFixed(8)),
          },
        });
      } else {
        await tx.cryptoHolding.create({
          data: {
            userId,
            coinId: dto.coinId,
            coinSymbol: dto.coinSymbol.toUpperCase(),
            coinName: dto.coinName,
            quantity: new Decimal(quantity.toFixed(8)),
            avgBuyPrice: new Decimal(pricePerCoin.toFixed(8)),
          },
        });
      }

      // Record the order
      const order = await tx.cryptoOrder.create({
        data: {
          userId,
          coinId: dto.coinId,
          coinSymbol: dto.coinSymbol.toUpperCase(),
          coinName: dto.coinName,
          type: 'buy',
          quantity: new Decimal(quantity.toFixed(8)),
          priceAtTime: new Decimal(pricePerCoin.toFixed(8)),
          totalUsd: new Decimal(dto.usdAmount.toFixed(2)),
          fee: new Decimal(fee.toFixed(2)),
          status: 'completed',
        },
      });

      return {
        order,
        coinsBought: quantity,
        priceAtTime: pricePerCoin,
        fee,
        message: `Successfully purchased ${quantity.toFixed(6)} ${dto.coinSymbol.toUpperCase()} for $${dto.usdAmount.toFixed(2)}`,
      };
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'Crypto Asset Purchased',
        `Successfully purchased ${result.coinsBought.toFixed(6)} ${dto.coinSymbol.toUpperCase()} at $${result.priceAtTime.toLocaleString('en-US')} per coin for a total of $${dto.usdAmount.toFixed(2)}.`,
        'success',
      );
    } catch (err) {
      console.error('Failed to trigger buy notification:', err);
    }

    return result;
  }

  async sellCrypto(
    userId: string,
    dto: {
      coinId: string;
      coinSymbol: string;
      coinName: string;
      quantity: number;
      toAccountId: string;
    },
  ) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // 1. Check holding
    const holding = await this.prisma.cryptoHolding.findUnique({
      where: { userId_coinId: { userId, coinId: dto.coinId } },
    });
    if (!holding) throw new NotFoundException('You do not hold this coin');
    if (new Decimal(holding.quantity).lessThan(new Decimal(dto.quantity))) {
      throw new BadRequestException('Insufficient coin balance');
    }

    // 2. Fetch live price
    const markets = await this.getLiveMarkets();
    const coin = markets.find((c) => c.id === dto.coinId);
    if (!coin) throw new NotFoundException(`Coin ${dto.coinId} not found`);

    const pricePerCoin = coin.current_price;
    const grossUsd = dto.quantity * pricePerCoin;
    const fee = parseFloat((grossUsd * 0.005).toFixed(2)); // 0.5% fee
    const netUsd = parseFloat((grossUsd - fee).toFixed(2));

    const result = await this.prisma.$transaction(async (tx) => {
      // Update holding
      const newQty = parseFloat(
        (Number(holding.quantity) - dto.quantity).toFixed(8),
      );

      if (newQty <= 0.000001) {
        // Remove holding if dust
        await tx.cryptoHolding.delete({
          where: { userId_coinId: { userId, coinId: dto.coinId } },
        });
      } else {
        await tx.cryptoHolding.update({
          where: { userId_coinId: { userId, coinId: dto.coinId } },
          data: { quantity: new Decimal(newQty.toFixed(8)) },
        });
      }

      // Credit bank account
      await tx.account.update({
        where: { id: dto.toAccountId },
        data: {
          balance: { increment: new Decimal(netUsd.toFixed(2)) },
          availableBalance: { increment: new Decimal(netUsd.toFixed(2)) },
        },
      });

      // Record order
      const order = await tx.cryptoOrder.create({
        data: {
          userId,
          coinId: dto.coinId,
          coinSymbol: dto.coinSymbol.toUpperCase(),
          coinName: dto.coinName,
          type: 'sell',
          quantity: new Decimal(dto.quantity.toFixed(8)),
          priceAtTime: new Decimal(pricePerCoin.toFixed(8)),
          totalUsd: new Decimal(grossUsd.toFixed(2)),
          fee: new Decimal(fee.toFixed(2)),
          status: 'completed',
        },
      });

      return {
        order,
        coinsSold: dto.quantity,
        priceAtTime: pricePerCoin,
        grossUsd,
        fee,
        netUsd,
        message: `Successfully sold ${dto.quantity} ${dto.coinSymbol.toUpperCase()} for $${netUsd.toFixed(2)}`,
      };
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'Crypto Asset Sold',
        `Successfully sold ${dto.quantity} ${dto.coinSymbol.toUpperCase()} at $${result.priceAtTime.toLocaleString('en-US')} per coin. Total proceeds credited: $${result.netUsd.toFixed(2)}.`,
        'success',
      );
    } catch (err) {
      console.error('Failed to trigger sell notification:', err);
    }

    return result;
  }

  async getMyOrders(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.cryptoOrder.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cryptoOrder.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────────

  async getAllOrders(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.cryptoOrder.findMany({
        skip,
        take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cryptoOrder.count(),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTotalCryptoVolume() {
    const result = await this.prisma.cryptoOrder.aggregate({
      _sum: { totalUsd: true, fee: true },
      _count: { id: true },
    });
    return result;
  }

  // ── Real-time stock, index, and commodity quotes via Yahoo Finance ─────────────
  private marketQuoteCache: { data: any[]; fetchedAt: number } | null = null;
  private readonly MARKET_CACHE_TTL = 60_000;

  private readonly MARKET_SYMBOLS = [
    // Indices
    { symbol: '%5EGSPC', display: 'SPX',  name: 'S&P 500',     group: 'index' },
    { symbol: '%5ENDX',  display: 'NDX',  name: 'NASDAQ 100',  group: 'index' },
    { symbol: '%5EDJI',  display: 'DJI',  name: 'Dow Jones',   group: 'index' },
    // Stocks
    { symbol: 'AAPL',  display: 'AAPL',  name: 'Apple',       group: 'stock' },
    { symbol: 'MSFT',  display: 'MSFT',  name: 'Microsoft',   group: 'stock' },
    { symbol: 'NVDA',  display: 'NVDA',  name: 'NVIDIA',      group: 'stock' },
    { symbol: 'TSLA',  display: 'TSLA',  name: 'Tesla',       group: 'stock' },
    { symbol: 'AMZN',  display: 'AMZN',  name: 'Amazon',      group: 'stock' },
    { symbol: 'META',  display: 'META',  name: 'Meta',        group: 'stock' },
    { symbol: 'GOOGL', display: 'GOOGL', name: 'Alphabet',    group: 'stock' },
    // Commodities (futures)
    { symbol: 'GC%3DF', display: 'XAU',  name: 'Gold',        group: 'commodity' },
    { symbol: 'SI%3DF', display: 'XAG',  name: 'Silver',      group: 'commodity' },
    { symbol: 'CL%3DF', display: 'WTI',  name: 'Crude Oil',   group: 'commodity' },
    { symbol: 'PL%3DF', display: 'XPT',  name: 'Platinum',    group: 'commodity' },
    { symbol: 'PA%3DF', display: 'XPD',  name: 'Palladium',   group: 'commodity' },
    { symbol: 'NG%3DF', display: 'NGAS', name: 'Nat. Gas',    group: 'commodity' },
  ];

  // Static fallback prices kept close to real-world ranges
  private getStaticMarketQuotes(): any[] {
    const now = Date.now();
    const staticData = [
      { display: 'SPX',  name: 'S&P 500',     price: 5847.32, group: 'index' },
      { display: 'NDX',  name: 'NASDAQ 100',  price: 20521.45, group: 'index' },
      { display: 'DJI',  name: 'Dow Jones',   price: 42156.78, group: 'index' },
      { display: 'AAPL', name: 'Apple',       price: 207.83,  group: 'stock' },
      { display: 'MSFT', name: 'Microsoft',   price: 421.67,  group: 'stock' },
      { display: 'NVDA', name: 'NVIDIA',      price: 891.20,  group: 'stock' },
      { display: 'TSLA', name: 'Tesla',       price: 248.50,  group: 'stock' },
      { display: 'AMZN', name: 'Amazon',      price: 187.45,  group: 'stock' },
      { display: 'META', name: 'Meta',        price: 512.34,  group: 'stock' },
      { display: 'GOOGL',name: 'Alphabet',    price: 165.23,  group: 'stock' },
      { display: 'XAU',  name: 'Gold',        price: 2387.45, group: 'commodity' },
      { display: 'XAG',  name: 'Silver',      price: 30.48,   group: 'commodity' },
      { display: 'WTI',  name: 'Crude Oil',   price: 78.82,   group: 'commodity' },
      { display: 'XPT',  name: 'Platinum',    price: 1012.50, group: 'commodity' },
      { display: 'XPD',  name: 'Palladium',   price: 945.80,  group: 'commodity' },
      { display: 'NGAS', name: 'Nat. Gas',    price: 2.45,    group: 'commodity' },
    ];
    return staticData.map((item, idx) => {
      const wave = Math.sin(now / 600000 + idx);
      const pct = parseFloat((wave * 1.5).toFixed(2));
      return { ...item, price: parseFloat((item.price * (1 + pct / 100)).toFixed(2)), pct };
    });
  }

  async getMarketQuotes(): Promise<any[]> {
    if (this.marketQuoteCache && Date.now() - this.marketQuoteCache.fetchedAt < this.MARKET_CACHE_TTL) {
      return this.marketQuoteCache.data;
    }

    try {
      const symbols = this.MARKET_SYMBOLS.map(s => s.symbol).join(',');
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,shortName`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);

      const json = await res.json() as any;
      const quotes: any[] = json?.quoteResponse?.result ?? [];

      if (!quotes.length) throw new Error('Empty response from Yahoo Finance');

      const data = this.MARKET_SYMBOLS.map(meta => {
        const raw = quotes.find((q: any) =>
          q.symbol === decodeURIComponent(meta.symbol)
        );
        return {
          symbol: meta.display,
          name: meta.name,
          group: meta.group,
          price: raw?.regularMarketPrice ?? null,
          pct: parseFloat((raw?.regularMarketChangePercent ?? 0).toFixed(2)),
        };
      }).filter(q => q.price !== null);

      if (data.length < 5) throw new Error('Too few valid quotes returned');

      this.marketQuoteCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      console.warn('Yahoo Finance market quotes failed, using static fallback:', err?.message);
      const fallback = this.getStaticMarketQuotes();
      this.marketQuoteCache = { data: fallback, fetchedAt: Date.now() };
      return fallback;
    }
  }
}
