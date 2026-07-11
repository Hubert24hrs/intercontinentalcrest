import {
  IsIn,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AdjustBalanceDto {
  @IsIn(['credit', 'debit'], { message: 'type must be "credit" or "debit"' })
  type: 'credit' | 'debit';

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must be a number with at most 2 decimal places' })
  @IsPositive({ message: 'amount must be greater than 0' })
  @Max(500_000, { message: 'Single adjustment cannot exceed $500,000' })
  amount: number;

  @IsUUID('4', { message: 'accountId must be a valid UUID' })
  accountId: string;

  @IsString()
  @MinLength(5, { message: 'reason must be at least 5 characters' })
  @MaxLength(500, { message: 'reason cannot exceed 500 characters' })
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
