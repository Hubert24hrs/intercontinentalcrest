import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2FaDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code: string;
}
