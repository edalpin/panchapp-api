import { AuthResolver } from '@/auth/graphql/auth.resolver';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthCookieService } from '@/auth/services/auth-cookie.service';
import { AuthTokenService } from '@/auth/services/auth-token.service';
import { AuthService } from '@/auth/services/auth.service';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { EnvConfig } from '@/core/config/env.schema';
import { getJwtConfig } from '@/core/config/jwt.config';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => getJwtConfig(configService),
    }),
  ],
  providers: [AuthService, AuthTokenService, AuthCookieService, AuthResolver, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
