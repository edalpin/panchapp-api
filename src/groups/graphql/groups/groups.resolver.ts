import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { PAGINATION_DEFAULT_FIRST } from '@/core/constants/pagination.constants';
import { paginationArgsSchema } from '@/core/validation/pagination.schema';
import { parseInput } from '@/core/validation/parse-input';
import { CreateGroupInput } from '@/groups/graphql/groups/create-group.input';
import { createGroupSchema } from '@/groups/graphql/groups/create-group.schema';
import { GroupConnection } from '@/groups/graphql/groups/group-connection.object';
import '@/groups/graphql/groups/group-status.enum';
import { Group } from '@/groups/graphql/groups/group.object';
import { UpdateGroupInput } from '@/groups/graphql/groups/update-group.input';
import { updateGroupSchema } from '@/groups/graphql/groups/update-group.schema';
import { GroupsService } from '@/groups/services/groups.service';
import { toGraphqlGroup, toGraphqlGroupConnection } from '@/groups/utils/group.mapper';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

@UseGuards(JwtAuthGuard)
@Resolver(() => Group)
export class GroupsResolver {
  constructor(private readonly groupsService: GroupsService) {}

  @Query(() => GroupConnection, { name: 'myGroups' })
  async myGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Args('first', { type: () => Int, nullable: true, defaultValue: PAGINATION_DEFAULT_FIRST }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<GroupConnection> {
    const pagination = parseInput(paginationArgsSchema, { first, after });
    const connection = await this.groupsService.findMyGroupsPaginated(user.id, pagination.first, pagination.after);
    return toGraphqlGroupConnection(connection);
  }

  @Query(() => Group, { name: 'group' })
  async group(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: AuthenticatedUser): Promise<Group> {
    const group = await this.groupsService.findAccessibleGroup(id, user.id);
    return toGraphqlGroup(group);
  }

  @Mutation(() => Group, { name: 'createGroup' })
  async createGroup(@CurrentUser() user: AuthenticatedUser, @Args('input') input: CreateGroupInput): Promise<Group> {
    const { name } = parseInput(createGroupSchema, input);
    const group = await this.groupsService.createCollaborativeGroup(user.id, name);
    return toGraphqlGroup(group);
  }

  @Mutation(() => Group, { name: 'updateGroup' })
  async updateGroup(@CurrentUser() user: AuthenticatedUser, @Args('input') input: UpdateGroupInput): Promise<Group> {
    const { groupId, name } = parseInput(updateGroupSchema, input);
    const group = await this.groupsService.renameGroup(groupId, user.id, name);
    return toGraphqlGroup(group);
  }
}
