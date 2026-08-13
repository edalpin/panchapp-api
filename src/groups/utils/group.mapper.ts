import { Group as PrismaGroup } from '../../generated/prisma/client.js';
import { Group } from '../graphql/group.object';
import { GroupView } from '../types/group-view.types';
import { isPersonalGroup } from './group.policy';

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
