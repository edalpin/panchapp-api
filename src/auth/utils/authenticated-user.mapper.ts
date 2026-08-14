import { AuthenticatedUser } from '@/auth/types/jwt.types';
import { User as PrismaUser } from '@/generated/prisma/client.js';

export function toAuthenticatedUser(user: Pick<PrismaUser, 'id' | 'email' | 'name'>): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
