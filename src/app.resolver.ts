import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => Boolean, {
    name: '_ok',
    description: 'Schema bootstrap; use REST GET /health for probes',
  })
  ok(): boolean {
    return true;
  }
}
