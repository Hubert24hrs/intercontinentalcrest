import { Controller, Post, Body, Res, Req, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2FaDto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(loginDto);
    const result = await this.authService.login(user) as any;

    if (result.require2Fa) {
      return result;
    }

    // Set cookies for authentication
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generate2Fa(@Req() req: any) {
    return this.authService.generate2FaSecret(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2Fa(
    @Req() req: any,
    @Body() verifyDto: Verify2FaDto,
  ) {
    return this.authService.verify2FaSetup(req.user.id, verifyDto.code);
  }

  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate2Fa(
    @Body('tempToken') tempToken: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.authenticate2Fa(tempToken, code) as any;

    // Set cookies for authentication
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2Fa(
    @Req() req: any,
    @Body() verifyDto: Verify2FaDto,
  ) {
    return this.authService.disable2Fa(req.user.id, verifyDto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.['refreshToken'];
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }
    const result = await this.authService.refreshAccessToken(refreshToken) as any;
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return { user: req.user };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
