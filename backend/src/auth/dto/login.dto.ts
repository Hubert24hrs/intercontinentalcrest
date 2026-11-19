import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(254)
  email: string;

  // No complexity rules here — login accepts whatever the user enters and
  // answers with a generic 401 when it doesn't match.
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  password: string;
}
