import { randomInt } from 'crypto';

type AccountLookup = { account: { findUnique: (args: { where: { accountNumber: string } }) => Promise<unknown> } };

/** Generates a unique 12-character account number such as IC4821930571. */
export async function generateAccountNumber(db: AccountLookup): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = 'IC' + String(randomInt(0, 10_000_000_000)).padStart(10, '0');
    const exists = await db.account.findUnique({ where: { accountNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('Could not allocate a unique account number');
}
