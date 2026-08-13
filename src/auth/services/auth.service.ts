import { AuthResult } from '@/auth/types/auth-result.types';
import { GoogleTokenPayload } from '@/auth/types/google-auth.types';
import { AuthenticatedUser } from '@/auth/types/jwt.types';
import { EnvConfig } from '@/config/env.schema';
import { User as PrismaUser, UserStatus } from '@/generated/prisma/client.js';
import { UsersService } from '@/users/services/users.service';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly googleClientIds: string[];

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {
    this.googleClientIds = this.configService
      .get('GOOGLE_CLIENT_ID', { infer: true })
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    this.googleClient = new OAuth2Client();
  }

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleIdToken(idToken);
    const user = await this.resolveAllowedUser(googleUser);
    const accessToken = await this.jwtService.signAsync({ sub: user.id });

    return {
      accessToken,
      user: this.toAuthenticatedUser(user),
    };
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientIds,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name ?? null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.warn({ error: error as Error }, 'Google ID token verification failed');
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async resolveAllowedUser(googleUser: GoogleTokenPayload): Promise<PrismaUser> {
    let user = await this.usersService.findByGoogleSub(googleUser.sub);

    if (user) {
      if (user.email.toLowerCase() !== googleUser.email) {
        this.logger.warn({ userId: user.id }, 'Login rejected: Google email mismatch');
        throw new ForbiddenException('Google account mismatch');
      }
    } else {
      user = await this.usersService.findByEmail(googleUser.email);
    }

    if (!user) {
      this.logger.warn({ email: googleUser.email }, 'Login rejected: account not registered');
      throw new ForbiddenException('Account not registered');
    }

    if (user.status === UserStatus.DISABLED) {
      this.logger.warn({ userId: user.id }, 'Login rejected: account disabled');
      throw new ForbiddenException('Account disabled');
    }

    if (user.googleSub && user.googleSub !== googleUser.sub) {
      this.logger.warn({ userId: user.id }, 'Login rejected: Google account mismatch');
      throw new ForbiddenException('Google account mismatch');
    }

    if (!user.googleSub) {
      const linked = await this.usersService.linkGoogleSub(user.id, googleUser.sub);
      if (!linked) {
        this.logger.warn({ userId: user.id }, 'Login rejected: Google account link failed');
        throw new ForbiddenException('Google account mismatch');
      }
      user = linked;
    }

    return user;
  }

  private toAuthenticatedUser(user: PrismaUser): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
