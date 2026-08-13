import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { PAGINATION_DEFAULT_FIRST } from '@/core/constants/pagination.constants';
import { paginationArgsSchema } from '@/core/validation/pagination.schema';
import { parseInput } from '@/core/validation/parse-input';
import { Group } from '@/groups/graphql/groups/group.object';
import { GroupMemberConnection } from '@/groups/graphql/memberships/group-member-connection.object';
import { LeaveGroupPayload } from '@/groups/graphql/memberships/leave-group.payload.object';
import { GroupMembershipService } from '@/groups/services/group-membership.service';
import { GroupsService } from '@/groups/services/groups.service';
import { toGraphqlGroupMemberConnection, toLeaveGroupPayload } from '@/groups/utils/group.mapper';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';

@UseGuards(JwtAuthGuard)
@Resolver(() => Group)
export class GroupMembershipsResolver {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMembershipService: GroupMembershipService,
  ) {}

  @ResolveField(() => GroupMemberConnection, { name: 'members' })
  async members(
    @Parent() group: Group,
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', { type: () => Int, nullable: true, defaultValue: PAGINATION_DEFAULT_FIRST }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<GroupMemberConnection> {
    const pagination = parseInput(paginationArgsSchema, { first, after });
    const connection = await this.groupMembershipService.findMembersPaginated(
      group.id,
      user.id,
      pagination.first,
      pagination.after,
    );
    return toGraphqlGroupMemberConnection(connection);
  }

  @Mutation(() => LeaveGroupPayload, { name: 'leaveGroup' })
  async leaveGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Args('groupId', { type: () => ID }) groupId: string,
  ): Promise<LeaveGroupPayload> {
    const result = await this.groupsService.leaveGroup(groupId, user.id);
    return toLeaveGroupPayload(result);
  }
}
