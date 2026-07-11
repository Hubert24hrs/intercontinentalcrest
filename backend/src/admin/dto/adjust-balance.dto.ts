export class AdjustBalanceDto {
  type: 'credit' | 'debit';
  amount: number;
  accountId: string;
  reason: string;
  reference?: string;
}
