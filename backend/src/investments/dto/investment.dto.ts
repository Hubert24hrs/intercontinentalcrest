import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

const toNumber = ({ value }: { value: unknown }) => (typeof value === 'string' ? Number(value) : value);

export class CreateInvestmentDto {
  @IsString() @MinLength(2) @MaxLength(100)
  planName: string;

  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'The minimum investment is $1' })
  @Max(10_000_000, { message: 'A single investment cannot exceed $10,000,000' })
  principalAmount: number;

  /** Illustrative annual return shown to the customer (0–30%). */
  @IsOptional() @Transform(toNumber) @IsNumber() @Min(0) @Max(30)
  interestRate?: number;

  @IsOptional() @Transform(toNumber) @IsInt() @Min(1) @Max(120)
  termMonths?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  maturityDate?: string;

  @IsUUID('4', { message: 'Choose the account to fund this investment from' })
  accountId: string;
}

export class UpdateInvestmentValueDto {
  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100_000_000)
  currentValue: number;

  @IsOptional() @IsIn(['active', 'matured', 'closed'])
  status?: string;
}
