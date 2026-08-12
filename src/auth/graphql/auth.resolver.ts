import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { parseInput } from '../../common/validation/parse-input';
import { User } from '../../users/graphql/user.object';
import { AuthService } from '../auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../types/auth.types';
import { AuthPayload } from './auth-payload.object';
import { LoginWithGoogleInput } from './login-with-google.input';
import { loginWithGoogleSchema } from './login-with-google.schema';

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
