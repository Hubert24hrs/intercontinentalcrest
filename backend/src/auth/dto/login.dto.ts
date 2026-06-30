import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  // No MinLength here — login should accept whatever password the user enters.
  // Password complexity is enforced only at registration (register.dto.ts).
  // A MinLength constraint here would reject users who registered via the API
  // with a shorter password, causing a 400 DTO validation error instead of
  // the expected 401 "Invalid email or password" auth error.
  password: string;
}
