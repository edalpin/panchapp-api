import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { GroupView, toGroupView } from './types/group.types';

@Injectable()
export class GroupAccessService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(GroupAccessService.name)
    private readonly logger: PinoLogger,
  ) {}

  async requireMembership(groupId: string, userId: string): Promise<GroupView> {
    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        group: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Group not found');
    }

    return toGroupView(membership.group);
  }
}

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
