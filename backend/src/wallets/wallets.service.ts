import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private notificationsService: NotificationsService,
  ) {}

  private readonly defaultWallets = [
    { coinId: 'bitcoin', coinSymbol: 'BTC', coinName: 'Bitcoin', address: 'bc1quj2mqa6xt0kr47suvavff4lnak3pujv4efrz60' },
    { coinId: 'ethereum', coinSymbol: 'ETH', coinName: 'Ethereum', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
    { coinId: 'tether', coinSymbol: 'USDT', coinName: 'Tether', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
    { coinId: 'usd-coin', coinSymbol: 'USDC', coinName: 'USD Coin', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
    { coinId: 'binancecoin', coinSymbol: 'BNB', coinName: 'BNB', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
    { coinId: 'solana', coinSymbol: 'SOL', coinName: 'Solana', address: 'HFETb6Vz7Tgp5Xx2dURvxbxfs2AVPZHAhmvJewGNEBi8' },
    { coinId: 'ripple', coinSymbol: 'XRP', coinName: 'Ripple', address: '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95' },
  ];

  async getWallets(userId: string) {
    let wallets = await this.prisma.cryptoWallet.findMany({
      where: { userId },
      orderBy: { coinName: 'asc' },
    });

    // Dynamically backfill wallets for users registered prior to this feature
    if (wallets.length < this.defaultWallets.length) {
      const existingCoinIds = new Set(wallets.map((w) => w.coinId));
      const missing = this.defaultWallets.filter((w) => !existingCoinIds.has(w.coinId));

      if (missing.length > 0) {
        await this.prisma.$transaction(async (tx) => {
          for (const w of missing) {
            await tx.cryptoWallet.create({
              data: {
                userId,
                coinId: w.coinId,
                coinSymbol: w.coinSymbol,
                coinName: w.coinName,
                address: w.address,
                balance: 0.00,
              },
            });
          }
        });
        wallets = await this.prisma.cryptoWallet.findMany({
          where: { userId },
          orderBy: { coinName: 'asc' },
        });
      }
    }

    return wallets;
  }

  async deposit(userId: string, dto: { coinId: string; amount: number }) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than 0');
    }

    const wallet = await this.prisma.cryptoWallet.findUnique({
      where: { userId_coinId: { userId, coinId: dto.coinId } },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet for coin ${dto.coinId} not found`);
    }

    // Get live price to calculate USD equivalent and update CryptoHolding buy price
    const markets = await this.cryptoService.getLiveMarkets();
    const coin = markets.find((c) => c.id === dto.coinId);
    const pricePerCoin = coin ? coin.current_price : 1.00;
    const usdValue = dto.amount * pricePerCoin;

    // Find the user's primary checking account to link the transaction to their ledger
    const checkingAccount = await this.prisma.account.findFirst({
      where: { userId, accountType: 'checking' },
    });
    const ledgerAccountId = checkingAccount?.id ?? null;

    const txRef = 'DEP-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update wallet balance
      const updatedWallet = await tx.cryptoWallet.update({
        where: { userId_coinId: { userId, coinId: dto.coinId } },
        data: {
          balance: { increment: new Decimal(dto.amount) },
        },
      });

      // 2. Upsert CryptoHolding
      const existingHolding = await tx.cryptoHolding.findUnique({
        where: { userId_coinId: { userId, coinId: dto.coinId } },
      });

      if (existingHolding) {
        const oldQty = Number(existingHolding.quantity);
        const oldAvg = Number(existingHolding.avgBuyPrice);
        const newQty = oldQty + dto.amount;
        const newAvg = (oldAvg * oldQty + pricePerCoin * dto.amount) / newQty;

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
            coinSymbol: wallet.coinSymbol,
            coinName: wallet.coinName,
            quantity: new Decimal(dto.amount.toFixed(8)),
            avgBuyPrice: new Decimal(pricePerCoin.toFixed(8)),
          },
        });
      }

      // 3. Log to transactions ledger (receiverAccountId set to user's checking account for ledger tracking)
      await tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: null,
          receiverAccountId: ledgerAccountId,
          amount: new Decimal(usdValue.toFixed(2)),
          fee: new Decimal(0.00),
          currency: 'USD',
          status: 'completed',
          type: 'crypto_deposit',
          description: `Crypto Deposit: ${dto.amount} ${wallet.coinSymbol} (${wallet.coinName})`,
          metadata: JSON.stringify({
            coinId: dto.coinId,
            coinSymbol: wallet.coinSymbol,
            quantity: dto.amount,
            pricePerCoin,
          }),
        },
      });

      return updatedWallet;
    });

    // 4. Trigger user notification
    try {
      await this.notificationsService.createNotification(
        userId,
        'Crypto Wallet Deposit',
        `Your wallet has been credited with ${dto.amount} ${wallet.coinSymbol} (approx. $${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}). Reference: ${txRef}`,
        'success',
      );
    } catch (err) {
      console.error('Failed to send deposit notification:', err);
    }

    return result;
  }

  async withdraw(userId: string, dto: { coinId: string; amount: number; destinationAddress: string }) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than 0');
    }
    if (!dto.destinationAddress || dto.destinationAddress.trim() === '') {
      throw new BadRequestException('Destination address is required');
    }

    const wallet = await this.prisma.cryptoWallet.findUnique({
      where: { userId_coinId: { userId, coinId: dto.coinId } },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet for coin ${dto.coinId} not found`);
    }

    if (new Decimal(wallet.balance).lessThan(new Decimal(dto.amount))) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Get live price to calculate USD equivalent
    const markets = await this.cryptoService.getLiveMarkets();
    const coin = markets.find((c) => c.id === dto.coinId);
    const pricePerCoin = coin ? coin.current_price : 1.00;
    const usdValue = dto.amount * pricePerCoin;

    // Find the user's primary checking account to link the transaction to their ledger
    const checkingAccount = await this.prisma.account.findFirst({
      where: { userId, accountType: 'checking' },
    });
    const ledgerAccountId = checkingAccount?.id ?? null;

    const txRef = 'WTH-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update wallet balance
      const updatedWallet = await tx.cryptoWallet.update({
        where: { userId_coinId: { userId, coinId: dto.coinId } },
        data: {
          balance: { decrement: new Decimal(dto.amount) },
        },
      });

      // 2. Update CryptoHolding
      const existingHolding = await tx.cryptoHolding.findUnique({
        where: { userId_coinId: { userId, coinId: dto.coinId } },
      });

      if (existingHolding) {
        const currentQty = Number(existingHolding.quantity);
        const newQty = Math.max(0, currentQty - dto.amount);

        if (newQty <= 0.000001) {
          await tx.cryptoHolding.delete({
            where: { userId_coinId: { userId, coinId: dto.coinId } },
          });
        } else {
          await tx.cryptoHolding.update({
            where: { userId_coinId: { userId, coinId: dto.coinId } },
            data: {
              quantity: new Decimal(newQty.toFixed(8)),
            },
          });
        }
      }

      // 3. Log to transactions ledger (senderAccountId set to user's checking account for ledger tracking)
      await tx.transaction.create({
        data: {
          transactionReference: txRef,
          senderAccountId: ledgerAccountId,
          receiverAccountId: null,
          amount: new Decimal(usdValue.toFixed(2)),
          fee: new Decimal(0.00),
          currency: 'USD',
          status: 'completed',
          type: 'crypto_withdrawal',
          description: `Crypto Withdrawal: ${dto.amount} ${wallet.coinSymbol} to ${dto.destinationAddress}`,
          metadata: JSON.stringify({
            coinId: dto.coinId,
            coinSymbol: wallet.coinSymbol,
            quantity: dto.amount,
            pricePerCoin,
            destinationAddress: dto.destinationAddress,
          }),
        },
      });

      return updatedWallet;
    });

    // 4. Trigger user notification
    try {
      await this.notificationsService.createNotification(
        userId,
        'Crypto Wallet Withdrawal',
        `Your withdrawal of ${dto.amount} ${wallet.coinSymbol} to ${dto.destinationAddress} has been successfully completed. Reference: ${txRef}`,
        'success',
      );
    } catch (err) {
      console.error('Failed to send withdrawal notification:', err);
    }

    return result;
  }
}
