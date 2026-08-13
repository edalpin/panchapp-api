import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/jwt.types';
import { GroupsService } from '../services/groups.service';
import { toGraphqlGroup } from '../utils/group.mapper';
import './group-status.enum';
import { Group } from './group.object';

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
