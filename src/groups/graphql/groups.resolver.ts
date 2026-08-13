import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { Group } from '@/groups/graphql/group.object';
import { GroupsService } from '@/groups/services/groups.service';
import { toGraphqlGroup } from '@/groups/utils/group.mapper';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import './group-status.enum';

@Resolver(() => Group)
export class GroupsResolver {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [Group], { name: 'myGroups' })
  async myGroups(@CurrentUser() user: AuthenticatedUser): Promise<Group[]> {
    const groups = await this.groupsService.findMyGroups(user.id);
    return groups.map(toGraphqlGroup);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Group, { name: 'group' })
  async group(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: AuthenticatedUser): Promise<Group> {
    const group = await this.groupsService.findAccessibleGroup(id, user.id);
    return toGraphqlGroup(group);
  }
}
