import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Crypto balances have a single source of truth: CryptoHolding.quantity.
 * CryptoWallet.balance mirrors it for coins that have a custody wallet, so
 * buying, selling, depositing and withdrawing can never let the same coins
 * be spent twice.
 */

type Tx = Prisma.TransactionClient;

export interface CoinRef {
  coinId: string;
  coinSymbol: string;
  coinName: string;
}

const DUST = new Decimal('0.00000001');

function toDecimal(n: number | Decimal): Decimal {
  return n instanceof Decimal ? n : new Decimal(Number(n).toFixed(8));
}

async function mirrorWallet(tx: Tx, userId: string, coinId: string, quantity: Decimal) {
  await tx.cryptoWallet.updateMany({ where: { userId, coinId }, data: { balance: quantity } });
}

/** Add coins to a holding (weighted-average cost) and mirror the wallet balance. */
export async function creditCoins(tx: Tx, userId: string, coin: CoinRef, qty: number | Decimal, pricePerCoin: number) {
  const quantity = toDecimal(qty);
  if (quantity.lessThanOrEqualTo(0)) throw new BadRequestException('Quantity must be greater than 0');

  const existing = await tx.cryptoHolding.findUnique({ where: { userId_coinId: { userId, coinId: coin.coinId } } });
  let newQty: Decimal;
  if (existing) {
    newQty = existing.quantity.plus(quantity);
    const newAvg = existing.avgBuyPrice.times(existing.quantity).plus(quantity.times(pricePerCoin)).dividedBy(newQty);
    await tx.cryptoHolding.update({
      where: { userId_coinId: { userId, coinId: coin.coinId } },
      data: { quantity: newQty, avgBuyPrice: newAvg.toDecimalPlaces(8) },
    });
  } else {
    newQty = quantity;
    await tx.cryptoHolding.create({
      data: {
        userId,
        coinId: coin.coinId,
        coinSymbol: coin.coinSymbol.toUpperCase(),
        coinName: coin.coinName,
        quantity,
        avgBuyPrice: new Decimal(pricePerCoin.toFixed(8)),
      },
    });
  }
  await mirrorWallet(tx, userId, coin.coinId, newQty);
  return newQty;
}

/** Remove coins from a holding; throws if the customer doesn't hold enough. */
export async function debitCoins(tx: Tx, userId: string, coinId: string, qty: number | Decimal) {
  const quantity = toDecimal(qty);
  if (quantity.lessThanOrEqualTo(0)) throw new BadRequestException('Quantity must be greater than 0');

  const holding = await tx.cryptoHolding.findUnique({ where: { userId_coinId: { userId, coinId } } });
  if (!holding || holding.quantity.lessThan(quantity)) {
    throw new BadRequestException('Insufficient coin balance');
  }

  const remaining = holding.quantity.minus(quantity);
  if (remaining.lessThan(DUST)) {
    await tx.cryptoHolding.delete({ where: { userId_coinId: { userId, coinId } } });
    await mirrorWallet(tx, userId, coinId, new Decimal(0));
    return new Decimal(0);
  }
  await tx.cryptoHolding.update({ where: { userId_coinId: { userId, coinId } }, data: { quantity: remaining } });
  await mirrorWallet(tx, userId, coinId, remaining);
  return remaining;
}
