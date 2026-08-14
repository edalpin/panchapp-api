import { AuthTokenService } from '@/auth/services/auth-token.service';
import { AuthSessionResult } from '@/auth/types/auth-result.types';
import { GoogleTokenPayload } from '@/auth/types/google-auth.types';
import { toAuthenticatedUser } from '@/auth/utils/authenticated-user.mapper';
import { EnvConfig } from '@/core/config/env.schema';
import { User as PrismaUser, UserStatus } from '@/generated/prisma/client.js';
import { UsersService } from '@/users/services/users.service';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly googleClientIds: string[];

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly authTokenService: AuthTokenService,
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

  async loginWithGoogle(idToken: string): Promise<AuthSessionResult> {
    const googleUser = await this.verifyGoogleIdToken(idToken);
    const user = await this.resolveAllowedUser(googleUser);
    return this.issueSession(user);
  }

  async refreshSession(refreshToken: string): Promise<AuthSessionResult> {
    const payload = await this.authTokenService.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      this.logger.warn({ userId: payload.sub, reason: 'user_not_found' }, 'Refresh rejected');
      throw new UnauthorizedException();
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn({ userId: payload.sub, reason: 'user_not_active' }, 'Refresh rejected');
      throw new UnauthorizedException();
    }

    return this.issueSession(user);
  }

  private async issueSession(user: PrismaUser): Promise<AuthSessionResult> {
    const [accessToken, refreshToken] = await Promise.all([
      this.authTokenService.signAccessToken(user.id),
      this.authTokenService.signRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
      user: toAuthenticatedUser(user),
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
}
