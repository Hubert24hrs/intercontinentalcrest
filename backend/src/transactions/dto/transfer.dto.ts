import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export const TRANSFER_TYPES = ['transfer', 'internal_transfer', 'international_transfer', 'bill_payment'] as const;
export const MAX_TRANSFER_AMOUNT = 1_000_000;

export class TransferDto {
  /** Preferred field name. `senderAccountId` is accepted as an alias. */
  @IsOptional() @IsUUID('4', { message: 'Choose the account to send from' })
  fromAccountId?: string;

  @IsOptional() @IsUUID('4', { message: 'Choose the account to send from' })
  senderAccountId?: string;

  /** Preferred field name. `receiverAccountNumber` is accepted as an alias. */
  @IsOptional() @IsString() @MinLength(4) @MaxLength(64)
  toAccountNumber?: string;

  @IsOptional() @IsString() @MinLength(4) @MaxLength(64)
  receiverAccountNumber?: string;

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false }, { message: 'Enter an amount with at most 2 decimal places' })
  @Min(0.01, { message: 'Amount must be at least $0.01' })
  @Max(MAX_TRANSFER_AMOUNT, { message: 'A single transfer cannot exceed $1,000,000' })
  amount: number;

  @IsOptional() @IsString() @MaxLength(140)
  description?: string;

  @IsOptional() @IsIn(['USD'], { message: 'Only USD transfers are supported' })
  currency?: string;

  @IsOptional() @IsIn(TRANSFER_TYPES as unknown as string[])
  type?: string;
}
