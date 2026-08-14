import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthPayload } from '@/auth/graphql/auth-payload.object';
import { LoginWithGoogleInput } from '@/auth/graphql/login-with-google.input';
import { loginWithGoogleSchema } from '@/auth/graphql/login-with-google.schema';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthCookieService } from '@/auth/services/auth-cookie.service';
import { AuthService } from '@/auth/services/auth.service';
import type { GraphqlContext } from '@/auth/types/graphql-context.types';
import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { readRefreshTokenFromCookie } from '@/auth/utils/auth-cookie.util';
import { parseInput } from '@/core/validation/parse-input';
import { User } from '@/users/graphql/user.object';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Mutation(() => AuthPayload, { name: 'loginWithGoogle' })
  async loginWithGoogle(
    @Args('input') input: LoginWithGoogleInput,
    @Context() context: GraphqlContext,
  ): Promise<AuthPayload> {
    const { idToken } = parseInput(loginWithGoogleSchema, input);
    const session = await this.authService.loginWithGoogle(idToken);
    this.authCookieService.setAuthCookies(context.res, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Mutation(() => AuthPayload, { name: 'refreshSession' })
  async refreshSession(@Context() context: GraphqlContext): Promise<AuthPayload> {
    const refreshToken = readRefreshTokenFromCookie(context.req);
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const session = await this.authService.refreshSession(refreshToken);
    this.authCookieService.setAuthCookies(context.res, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Mutation(() => Boolean, { name: 'logout' })
  logout(@Context() context: GraphqlContext): boolean {
    this.authCookieService.clearAuthCookies(context.res);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'me' })
  me(@CurrentUser() user: AuthenticatedUser): User {
    return user;
  }
}
