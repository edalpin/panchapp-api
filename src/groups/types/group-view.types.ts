import { Group as PrismaGroup } from '@/generated/prisma/client.js';

export type GroupView = {
  id: string;
  name: string;
  status: PrismaGroup['status'];
  personalOwnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
