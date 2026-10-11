import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findById(payload.sub);
    // cont șters sau dezactivat => 401 imediat (frontend-ul va încerca refresh, care va eșua, apoi face logout)
    if (!user || user.disabled) throw new UnauthorizedException();
    // rolul vine din DB, nu din token: o schimbare de rol are efect imediat
    return { userId: user.id, email: user.email, role: user.role };
  }
}