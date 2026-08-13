import { GroupView, isPersonalGroup } from '../types/group.types';
import { Group } from './group.object';

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
