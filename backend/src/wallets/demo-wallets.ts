import { createHash } from 'crypto';

/**
 * Crypto custody on this platform is simulated: balances live in the database
 * and nothing is detected on-chain. Deposit "addresses" are therefore per-user
 * demo references that no real wallet will accept, so nobody can send real
 * funds to an address the platform cannot see.
 */
export const DEFAULT_WALLETS = [
  { coinId: 'bitcoin', coinSymbol: 'BTC', coinName: 'Bitcoin' },
  { coinId: 'ethereum', coinSymbol: 'ETH', coinName: 'Ethereum' },
  { coinId: 'tether', coinSymbol: 'USDT', coinName: 'Tether' },
  { coinId: 'usd-coin', coinSymbol: 'USDC', coinName: 'USD Coin' },
  { coinId: 'binancecoin', coinSymbol: 'BNB', coinName: 'BNB' },
  { coinId: 'solana', coinSymbol: 'SOL', coinName: 'Solana' },
  { coinId: 'ripple', coinSymbol: 'XRP', coinName: 'XRP' },
] as const;

/** Addresses that older versions handed to every customer. They are replaced on read. */
export const LEGACY_SHARED_ADDRESSES = new Set([
  'bc1quj2mqa6xt0kr47suvavff4lnak3pujv4efrz60',
  '0xbb1097d8642dfbf2b2a9c1676ac06c9715462f95',
  'HFETb6Vz7Tgp5Xx2dURvxbxfs2AVPZHAhmvJewGNEBi8',
]);

export function demoDepositAddress(userId: string, coinSymbol: string): string {
  const digest = createHash('sha256').update(`${userId}:${coinSymbol.toUpperCase()}`).digest('hex');
  return `DEMO-${coinSymbol.toUpperCase()}-${digest.slice(0, 32).toUpperCase()}`;
}
