import {
  Group as PrismaGroup,
  GroupMembership as PrismaGroupMembership,
  User as PrismaUser,
} from '@/generated/prisma/client.js';

export type UserWithPersonalGroup = PrismaUser & {
  personalGroup: (PrismaGroup & { memberships: PrismaGroupMembership[] }) | null;
};

export type PersonalGroupState = 'complete' | 'missing' | 'contradictory';

export type PersonalGroupContradiction = {
  userId: string;
  email: string;
  reason: string;
};
