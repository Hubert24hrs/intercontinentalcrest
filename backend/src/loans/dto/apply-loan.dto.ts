import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { LOAN_MAX, LOAN_MIN, LOAN_PRODUCTS, LOAN_TERMS } from '../loan-products';

const toNumber = ({ value }: { value: unknown }) => (typeof value === 'string' ? Number(value) : value);

export class ApplyLoanDto {
  @IsIn(Object.keys(LOAN_PRODUCTS), { message: 'Choose a valid loan type' })
  loanType: string;

  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(LOAN_MIN, { message: `The minimum loan amount is $${LOAN_MIN}` })
  @Max(LOAN_MAX, { message: 'The maximum loan amount is $1,000,000' })
  principalAmount: number;

  @Transform(toNumber)
  @IsInt()
  @IsIn(LOAN_TERMS, { message: 'Choose a valid repayment term' })
  termMonths: number;

  /** Ignored — the rate comes from the loan product. Accepted for backwards compatibility. */
  @IsOptional() @Transform(toNumber) @IsNumber()
  interestRate?: number;

  @IsOptional() @IsUUID('4')
  accountId?: string;

  /**
   * Only the last four digits are kept. Full SSNs are never stored.
   * Accepts "6789", "123-45-6789" or similar.
   */
  @IsOptional() @IsString() @Matches(/^[0-9\- ]{4,11}$/, { message: 'Enter the last 4 digits of your SSN' })
  ssn?: string;

  @IsOptional() @IsString() @Matches(/^\d{4}$/, { message: 'Enter the last 4 digits of your SSN' })
  ssnLast4?: string;

  @IsOptional() @IsString() @MaxLength(60)
  selectedCrypto?: string;

  @IsOptional() @Transform(toNumber) @IsNumber() @Min(0)
  cryptoAmount?: number;

  @IsOptional() @IsIn(['bank', 'crypto_wallet', 'external_bank'])
  disbursementType?: string;

  @IsOptional() @IsString() @MaxLength(500)
  disbursementDestination?: string;
}
