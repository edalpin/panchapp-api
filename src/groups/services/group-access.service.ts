import { PrismaService } from '@/core/prisma/prisma.service';
import { GroupView } from '@/groups/types/group-view.types';
import { toGroupView } from '@/groups/utils/group.mapper';
import { isArchivedGroup, isPersonalGroup } from '@/groups/utils/group.policy';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GroupAccessService {
  constructor(private readonly prisma: PrismaService) {}

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

    if (!membership || isArchivedGroup(membership.group)) {
      throw new NotFoundException('Group not found');
    }

    return toGroupView(membership.group);
  }

  async requireActiveCollaborativeMembership(groupId: string, userId: string): Promise<GroupView> {
    const groupView = await this.requireMembership(groupId, userId);

    if (isPersonalGroup(groupView)) {
      throw new BadRequestException('Personal groups cannot use collaborative group operations');
    }

    if (isArchivedGroup(groupView)) {
      throw new BadRequestException('Archived groups cannot be modified');
    }

    return groupView;
  }
}
