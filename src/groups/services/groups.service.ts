import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupView } from '../types/group-view.types';
import { toGroupView } from '../utils/group.mapper';
import { GroupAccessService } from './group-access.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupAccessService: GroupAccessService,
    @InjectPinoLogger(GroupsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async findMyGroups(userId: string): Promise<GroupView[]> {
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId },
      include: { group: true },
      orderBy: [{ joinedAt: 'asc' }, { groupId: 'asc' }],
    });

    const groups = memberships.map((membership) => toGroupView(membership.group));
    const hasPersonalGroup = groups.some((group) => group.personalOwnerId === userId);

    if (!hasPersonalGroup) {
      this.logger.error({ userId }, 'Active user is missing required personal group');
      throw new InternalServerErrorException('User is missing required personal group');
    }

    return groups;
  }

  async findAccessibleGroup(groupId: string, userId: string): Promise<GroupView> {
    return this.groupAccessService.requireMembership(groupId, userId);
  }
}
