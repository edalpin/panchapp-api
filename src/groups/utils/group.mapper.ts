import { Group as PrismaGroup } from '@/generated/prisma/client.js';
import { Group } from '@/groups/graphql/group.object';
import { GroupView } from '@/groups/types/group-view.types';
import { isPersonalGroup } from '@/groups/utils/group.policy';

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

export function toGraphqlGroup(group: GroupView): Group {
  return {
    id: group.id,
    name: group.name,
    isPersonal: isPersonalGroup(group),
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}
