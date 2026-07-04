import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['accessToken'] || req.cookies['jwt'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretjwtkey!changeme',
    });
  }

  async validate(payload: any) {
    // ARCHITECTURAL DECISION: Trust the cryptographically-verified JWT payload directly.
    // No per-request DB lookup is performed here — this is intentional for performance.
    //
    // Rationale: The JWT is signed with JWT_SECRET (known only to the server), so the
    // payload is tamper-proof. Suspended/deleted account enforcement happens at:
    //   • Login time    → validateUser() does a DB lookup + bcrypt verify
    //   • Token refresh → refreshAccessToken() always does a DB lookup
    //
    // If you need immediate revocation on protected routes (e.g. to block suspended users
    // mid-session without waiting for token expiry), replace this return with:
    //   const user = await this.usersService.findOneById(payload.sub);
    //   if (!user || user.status !== 'active') throw new UnauthorizedException();
    //   return user;
    if (!payload?.sub) throw new UnauthorizedException('Invalid token');
    return { id: payload.sub, email: payload.email, role: payload.role, fullName: payload.fullName };
  }
}
