import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthPayload } from '@/auth/graphql/auth-payload.object';
import { LoginWithGoogleInput } from '@/auth/graphql/login-with-google.input';
import { loginWithGoogleSchema } from '@/auth/graphql/login-with-google.schema';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthService } from '@/auth/services/auth.service';
import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { parseInput } from '@/core/validation/parse-input';
import { User } from '@/users/graphql/user.object';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload, { name: 'loginWithGoogle' })
  loginWithGoogle(@Args('input') input: LoginWithGoogleInput): Promise<AuthPayload> {
    const { idToken } = parseInput(loginWithGoogleSchema, input);
    return this.authService.loginWithGoogle(idToken);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'me' })
  me(@CurrentUser() user: AuthenticatedUser): User {
    return user;
  }
}
