import { GroupView } from '@/groups/types/group-view.types';
import { toGroupView } from '@/groups/utils/group.mapper';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

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

    if (!membership) {
      throw new NotFoundException('Group not found');
    }

    return toGroupView(membership.group);
  }
}
