import { User as PrismaUser } from '@/generated/prisma/client.js';
import { User } from '@/users/graphql/user.object';

export function toGraphqlUser(user: Pick<PrismaUser, 'id' | 'email' | 'name'>): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
