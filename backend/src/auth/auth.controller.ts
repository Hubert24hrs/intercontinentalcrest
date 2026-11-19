import {
  Controller,
  Post,
  Patch,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2FaDto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsNotEmpty, IsString, IsOptional, MaxLength, MinLength, Matches, IsEmail } from 'class-validator';
import { ACCESS_COOKIE_MAX_AGE_MS, REFRESH_COOKIE_MAX_AGE_MS } from './jwt.config';

class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) fullName?: string;
  @IsOptional() @IsString() @Matches(/^(\+?[0-9 ()-]{7,20})?$/, { message: 'Enter a valid phone number' }) phone?: string;
}

class ChangePasswordDto {
  @IsNotEmpty() @IsString() @MaxLength(200) currentPassword: string;
  @IsNotEmpty() @IsString() @Matches(PASSWORD_RULE, { message: PASSWORD_RULE_MESSAGE }) newPassword: string;
}

class ForgotPasswordDto {
  @IsNotEmpty() @IsEmail({}, { message: 'Enter a valid email address' }) @MaxLength(254) email: string;
}

class ResetPasswordDto {
  @IsNotEmpty() @IsString() @MaxLength(200) token: string;
  @IsNotEmpty() @IsString() @Matches(PASSWORD_RULE, { message: PASSWORD_RULE_MESSAGE }) newPassword: string;
}

class TwoFaAuthenticateDto {
  @IsNotEmpty() @IsString() @MaxLength(2000) tempToken: string;
  @IsNotEmpty() @IsString() @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code' }) code: string;
}

function isSecureRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
}

/**
 * The web app talks to this API through its own origin (Next.js rewrite of /api),
 * so cookies are first-party: httpOnly + SameSite=Lax is enough and nothing
 * sensitive has to live in localStorage.
 */
function cookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureRuntime(),
    sameSite: 'lax',
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto);
    const result = (await this.authService.login(user)) as any;

    if (result.require2Fa) return { require2Fa: true, tempToken: result.tempToken };

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generate2Fa(@Req() req: any) {
    return this.authService.generate2FaSecret(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2Fa(@Req() req: any, @Body() verifyDto: Verify2FaDto) {
    return this.authService.verify2FaSetup(req.user.id, verifyDto.code);
  }

  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate2Fa(@Body() dto: TwoFaAuthenticateDto, @Res({ passthrough: true }) res: Response) {
    const result = (await this.authService.authenticate2Fa(dto.tempToken, dto.code)) as any;
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2Fa(@Req() req: any, @Body() verifyDto: Verify2FaDto) {
    return this.authService.disable2Fa(req.user.id, verifyDto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies?.['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('Session expired. Please sign in again.');

    const result = (await this.authService.refreshAccessToken(refreshToken)) as any;
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  /** Logout never requires a valid session — it always clears the cookies. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', cookieOptions());
    res.clearCookie('refreshToken', cookieOptions());
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const freshUser = await this.authService.getUserById(req.user.id);
    if (!freshUser) throw new UnauthorizedException('Session expired. Please sign in again.');
    return { user: this.authService.toPublicUser(freshUser) };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, cookieOptions(ACCESS_COOKIE_MAX_AGE_MS));
    res.cookie('refreshToken', refreshToken, cookieOptions(REFRESH_COOKIE_MAX_AGE_MS));
  }
}
