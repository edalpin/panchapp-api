import { User as PrismaUser } from '../../generated/prisma/client.js';

export type ProvisionedUser = {
  user: PrismaUser;
  created: boolean;
};
