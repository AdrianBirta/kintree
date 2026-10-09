import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { YahooStrategy } from './strategies/yahoo.strategy';
import { InvitesModule } from 'src/invites/invites.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    InvitesModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]), // limita implicită; override pe endpointuri
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    FacebookStrategy,
    YahooStrategy,
  ],
})
export class AuthModule { }