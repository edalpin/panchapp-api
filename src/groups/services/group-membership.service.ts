import { isPersonalGroup } from '@/groups/utils/group.policy';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class GroupMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async addMembership(groupId: string, userId: string): Promise<void> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });

    if (!group) {
      throw new ConflictException('Group not found');
    }

    if (isPersonalGroup(group) && group.personalOwnerId !== userId) {
      throw new ConflictException('Personal groups cannot accept additional memberships');
    }

    await this.prisma.groupMembership.create({
      data: {
        groupId,
        userId,
      },
    });
  }

  async removeMembership(groupId: string, userId: string): Promise<void> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });

    if (!group) {
      throw new ConflictException('Group not found');
    }

    if (isPersonalGroup(group)) {
      throw new ConflictException('Personal groups cannot be left');
    }

    await this.prisma.groupMembership.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }
}
