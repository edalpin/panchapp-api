import { User as PrismaUser } from '../../generated/prisma/client.js';

export type ProvisionUserInput = {
  email: string;
  name?: string | null;
};

export type ProvisionedUser = {
  user: PrismaUser;
  created: boolean;
};

export type PersonalGroupBackfillReport = {
  created: number;
  skipped: number;
  contradictions: PersonalGroupContradiction[];
};

export type PersonalGroupContradiction = {
  userId: string;
  email: string;
  reason: string;
};
