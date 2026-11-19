import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getAccessSecret } from './jwt.config';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => (req && req.cookies ? req.cookies['accessToken'] || null : null),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: (_req: unknown, _raw: unknown, done: (err: any, secret?: string) => void) => {
        try {
          done(null, getAccessSecret());
        } catch (err) {
          done(err);
        }
      },
    });
  }

  /**
   * Only `typ: "access"` tokens are accepted here — refresh tokens and 2FA
   * challenge tokens are rejected. The user is re-read from the database so a
   * suspended account or a changed role takes effect immediately.
   */
  async validate(payload: any): Promise<AuthUser> {
    if (!payload?.sub || payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, fullName: true, status: true },
    });

    if (!user) throw new UnauthorizedException('Session expired. Please sign in again.');
    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account is not active. Please contact support.');
    }

    return { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  }
}
