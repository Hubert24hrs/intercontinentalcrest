import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsDateString, Matches } from 'class-validator';

export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/;
export const PASSWORD_RULE_MESSAGE =
  'Password must be 12 to 72 characters and include an uppercase letter, a lowercase letter and a number';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(254)
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_RULE_MESSAGE })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,20}$/, { message: 'Enter a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
