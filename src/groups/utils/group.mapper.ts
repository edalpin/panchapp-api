import { ConnectionView } from '@/core/pagination/pagination.types';
import { Group as PrismaGroup, User as PrismaUser } from '@/generated/prisma/client.js';
import { GroupConnection } from '@/groups/graphql/groups/group-connection.object';
import { Group } from '@/groups/graphql/groups/group.object';
import { GroupMemberConnection } from '@/groups/graphql/memberships/group-member-connection.object';
import { LeaveGroupPayload } from '@/groups/graphql/memberships/leave-group.payload.object';
import { GroupView } from '@/groups/types/group-view.types';
import { LeaveGroupResult } from '@/groups/types/leave-group.types';
import { isPersonalGroup } from '@/groups/utils/group.policy';
import { toGraphqlUser } from '@/users/utils/user.mapper';

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

export function toGraphqlGroupConnection(connection: ConnectionView<GroupView>): GroupConnection {
  return {
    nodes: connection.nodes.map(toGraphqlGroup),
    pageInfo: connection.pageInfo,
  };
}

export function toGraphqlGroupMemberConnection(connection: ConnectionView<PrismaUser>): GroupMemberConnection {
  return {
    nodes: connection.nodes.map(toGraphqlUser),
    pageInfo: connection.pageInfo,
  };
}

export function toLeaveGroupPayload(result: LeaveGroupResult): LeaveGroupPayload {
  return {
    left: result.left,
    archived: result.archived,
  };
}
