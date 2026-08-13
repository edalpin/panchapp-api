import { Group as PrismaGroup } from '../../generated/prisma/client.js';

export type GroupView = {
  id: string;
  name: string;
  status: PrismaGroup['status'];
  personalOwnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toGroupView(group: PrismaGroup): GroupView {
  return {
    id: group.id,
    name: group.name,
    status: group.status,
    personalOwnerId: group.personalOwnerId,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

export function isPersonalGroup(group: Pick<PrismaGroup, 'personalOwnerId'>): boolean {
  return group.personalOwnerId !== null;
}
