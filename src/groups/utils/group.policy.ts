import { GroupStatus, Group as PrismaGroup } from '@/generated/prisma/client.js';

export function isPersonalGroup(group: Pick<PrismaGroup, 'personalOwnerId'>): boolean {
  return group.personalOwnerId !== null;
}

export function isCollaborativeGroup(group: Pick<PrismaGroup, 'personalOwnerId'>): boolean {
  return group.personalOwnerId === null;
}

export function isArchivedGroup(group: Pick<PrismaGroup, 'status'>): boolean {
  return group.status === GroupStatus.ARCHIVED;
}
