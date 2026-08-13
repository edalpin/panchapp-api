import { Group as PrismaGroup } from '../../generated/prisma/client.js';

export function isPersonalGroup(group: Pick<PrismaGroup, 'personalOwnerId'>): boolean {
  return group.personalOwnerId !== null;
}
