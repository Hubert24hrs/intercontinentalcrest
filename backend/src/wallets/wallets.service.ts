import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Decimal } from '@prisma/client/runtime/library';
import { DEFAULT_WALLETS, LEGACY_SHARED_ADDRESSES, demoDepositAddress } from './demo-wallets';
import { creditCoins, debitCoins } from '../crypto/crypto-ledger';

/** Simulated deposits are capped per request so a typo can't create absurd balances. */
const MAX_SIMULATED_DEPOSIT_USD = 250_000;

function usd(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Returns the user's custody wallets. Also self-heals older data:
   *  - creates any missing default wallets,
   *  - replaces the legacy shared addresses with per-user demo references,
   *  - re-syncs wallet balances with holdings (the source of truth).
   */
  async getWallets(userId: string) {
    const [wallets, holdings] = await Promise.all([
      this.prisma.cryptoWallet.findMany({ where: { userId } }),
      this.prisma.cryptoHolding.findMany({ where: { userId } }),
    ]);

    const existing = new Set(wallets.map((w) => w.coinId));
    const missing = DEFAULT_WALLETS.filter((w) => !existing.has(w.coinId));
    if (missing.length) {
      await this.prisma.cryptoWallet.createMany({
        data: missing.map((w) => ({
          userId,
          coinId: w.coinId,
          coinSymbol: w.coinSymbol,
          coinName: w.coinName,
          address: demoDepositAddress(userId, w.coinSymbol),
          balance: holdings.find((h) => h.coinId === w.coinId)?.quantity ?? 0,
        })),
        skipDuplicates: true,
      });
    }

    for (const w of wallets) {
      const holdingQty = holdings.find((h) => h.coinId === w.coinId)?.quantity ?? new Decimal(0);
      const needsAddress = LEGACY_SHARED_ADDRESSES.has(w.address) || !w.address.startsWith('DEMO-');
      const needsBalance = !new Decimal(w.balance).equals(holdingQty);
      if (needsAddress || needsBalance) {
        await this.prisma.cryptoWallet.update({
          where: { id: w.id },
          data: {
            ...(needsAddress ? { address: demoDepositAddress(userId, w.coinSymbol) } : {}),
            ...(needsBalance ? { balance: holdingQty } : {}),
          },
        });
      }
    }

    return this.prisma.cryptoWallet.findMany({ where: { userId }, orderBy: { coinName: 'asc' } });
  }

  private async priceFor(coinId: string): Promise<number> {
    const markets = await this.cryptoService.getLiveMarkets();
    const coin = markets.find((c) => c.id === coinId);
    if (coin?.current_price) return coin.current_price;
    if (coinId === 'tether' || coinId === 'usd-coin') return 1;
    throw new BadRequestException('A live price for this asset is not available right now. Try again shortly.');
  }

  /** Simulated deposit: credits the custody wallet directly (no on-chain transfer happens). */
  async deposit(userId: string, dto: { coinId: string; amount: number }) {
    const wallet = await this.prisma.cryptoWallet.findUnique({ where: { userId_coinId: { userId, coinId: dto.coinId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const price = await this.priceFor(dto.coinId);
    const usdValue = dto.amount * price;
    if (usdValue > MAX_SIMULATED_DEPOSIT_USD) {
      throw new BadRequestException(`Simulated deposits are limited to $${usd(MAX_SIMULATED_DEPOSIT_USD)} per request`);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await creditCoins(tx, userId, wallet, dto.amount, price);
      return tx.cryptoOrder.create({
        data: {
          userId,
          coinId: wallet.coinId,
          coinSymbol: wallet.coinSymbol,
          coinName: wallet.coinName,
          type: 'deposit',
          quantity: new Decimal(dto.amount.toFixed(8)),
          priceAtTime: new Decimal(price.toFixed(8)),
          totalUsd: new Decimal(usdValue.toFixed(2)),
          fee: new Decimal(0),
          status: 'completed',
        },
      });
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'Crypto deposit credited',
        `${dto.amount} ${wallet.coinSymbol} (≈ $${usd(usdValue)}) was credited to your ${wallet.coinName} wallet (simulated deposit).`,
        'success',
      );
    } catch (err) {
      console.error('Failed to send deposit notification:', err);
    }

    const updated = await this.prisma.cryptoWallet.findUnique({ where: { id: wallet.id } });
    return { wallet: updated, order };
  }

  /** Simulated withdrawal: debits the custody wallet; nothing is broadcast to a blockchain. */
  async withdraw(userId: string, dto: { coinId: string; amount: number; destinationAddress: string }) {
    const wallet = await this.prisma.cryptoWallet.findUnique({ where: { userId_coinId: { userId, coinId: dto.coinId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const destination = dto.destinationAddress.trim();
    if (destination === wallet.address) throw new BadRequestException('You cannot withdraw to your own deposit reference');

    const price = await this.priceFor(dto.coinId).catch(() => 0);
    const usdValue = dto.amount * price;

    const order = await this.prisma.$transaction(async (tx) => {
      await debitCoins(tx, userId, wallet.coinId, dto.amount);
      return tx.cryptoOrder.create({
        data: {
          userId,
          coinId: wallet.coinId,
          coinSymbol: wallet.coinSymbol,
          coinName: wallet.coinName,
          type: 'withdrawal',
          quantity: new Decimal(dto.amount.toFixed(8)),
          priceAtTime: new Decimal(price.toFixed(8)),
          totalUsd: new Decimal(usdValue.toFixed(2)),
          fee: new Decimal(0),
          status: 'completed',
          networkAddress: destination,
        },
      });
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'Crypto withdrawal completed',
        `${dto.amount} ${wallet.coinSymbol} was withdrawn to ${destination.slice(0, 10)}…${destination.slice(-6)} (simulated).`,
        'info',
      );
    } catch (err) {
      console.error('Failed to send withdrawal notification:', err);
    }

    const updated = await this.prisma.cryptoWallet.findUnique({ where: { id: wallet.id } });
    return { wallet: updated, order };
  }

  /** Deposits and withdrawals for the wallet screens, including entries recorded by older versions. */
  async getHistory(userId: string, coinId?: string) {
    const [orders, legacy] = await Promise.all([
      this.prisma.cryptoOrder.findMany({
        where: { userId, type: { in: ['deposit', 'withdrawal'] }, ...(coinId ? { coinId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.transaction.findMany({
        where: {
          type: { in: ['crypto_deposit', 'crypto_withdrawal'] },
          OR: [{ senderAccount: { userId } }, { receiverAccount: { userId } }],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const legacyMapped = legacy
      .map((t) => {
        let meta: any = {};
        try {
          meta = t.metadata ? JSON.parse(t.metadata) : {};
        } catch {
          meta = {};
        }
        return {
          id: t.id,
          coinId: meta.coinId ?? null,
          coinSymbol: meta.coinSymbol ?? '',
          type: t.type === 'crypto_deposit' ? 'deposit' : 'withdrawal',
          quantity: meta.quantity ?? null,
          totalUsd: t.amount,
          networkAddress: meta.destinationAddress ?? null,
          status: t.status,
          reference: t.transactionReference,
          createdAt: t.createdAt,
        };
      })
      .filter((t) => !coinId || t.coinId === coinId);

    const mapped = orders.map((o) => ({
      id: o.id,
      coinId: o.coinId,
      coinSymbol: o.coinSymbol,
      type: o.type,
      quantity: o.quantity,
      totalUsd: o.totalUsd,
      networkAddress: o.networkAddress,
      status: o.status,
      reference: o.id.slice(0, 8).toUpperCase(),
      createdAt: o.createdAt,
    }));

    return [...mapped, ...legacyMapped].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}
