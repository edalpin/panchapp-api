import { ConnectionView } from '@/core/pagination/pagination.types';
import { buildConnectionPage } from '@/core/pagination/pagination.util';
import { PrismaService } from '@/core/prisma/prisma.service';
import { GroupStatus, Prisma, User as PrismaUser } from '@/generated/prisma/client.js';
import { GroupAccessService } from '@/groups/services/group-access.service';
import { LeaveGroupResult } from '@/groups/types/leave-group.types';
import { decodeMemberCursor, encodeMemberCursor } from '@/groups/utils/group-cursor.util';
import { isPersonalGroup } from '@/groups/utils/group.policy';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

type LockedGroupRow = {
  id: string;
  personalOwnerId: string | null;
  status: GroupStatus;
};

@Injectable()
export class GroupMembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupAccessService: GroupAccessService,
    @InjectPinoLogger(GroupMembershipService.name)
    private readonly logger: PinoLogger,
  ) {}

  async addMembership(groupId: string, userId: string): Promise<void> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    if (isPersonalGroup(group) && group.personalOwnerId !== userId) {
      throw new BadRequestException('Personal groups cannot accept additional memberships');
    }

    await this.prisma.groupMembership.create({
      data: {
        groupId,
        userId,
      },
    });
  }

  async findMembersPaginated(
    groupId: string,
    userId: string,
    first: number,
    after?: string,
  ): Promise<ConnectionView<PrismaUser>> {
    await this.groupAccessService.requireMembership(groupId, userId);

    const cursor = after ? decodeMemberCursor(after) : undefined;
    const cursorFilter: Prisma.GroupMembershipWhereInput | undefined = cursor
      ? {
          OR: [
            { joinedAt: { gt: cursor.joinedAt } },
            {
              joinedAt: cursor.joinedAt,
              userId: { gt: cursor.userId },
            },
          ],
        }
      : undefined;

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId,
        ...(cursorFilter ?? {}),
      },
      include: { user: true },
      orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }],
      take: first + 1,
    });

    const connection = buildConnectionPage(
      memberships,
      first,
      (membership) => ({
        joinedAt: membership.joinedAt,
        userId: membership.userId,
      }),
      ({ joinedAt, userId: memberUserId }) => encodeMemberCursor(joinedAt, memberUserId),
    );

    return {
      nodes: connection.nodes.map((membership) => membership.user),
      pageInfo: connection.pageInfo,
    };
  }

  async leaveCollaborativeGroup(groupId: string, userId: string): Promise<LeaveGroupResult> {
    return this.prisma.$transaction(async (tx) => {
      const lockedGroups = await tx.$queryRaw<LockedGroupRow[]>`
        SELECT id, "personalOwnerId", status
        FROM "Group"
        WHERE id = ${groupId}::uuid
        FOR UPDATE
      `;

      const group = lockedGroups[0];
      if (!group) {
        return { left: false, archived: false };
      }

      if (isPersonalGroup(group)) {
        this.logger.warn({ groupId, userId }, 'Rejected collaborative leave against personal group');
        throw new BadRequestException('Personal groups cannot be left');
      }

      if (group.status === GroupStatus.ARCHIVED) {
        return { left: false, archived: false };
      }

      const membership = await tx.groupMembership.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        return { left: false, archived: false };
      }

      await tx.groupMembership.delete({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      const remainingCount = await tx.groupMembership.count({
        where: { groupId },
      });

      if (remainingCount > 0) {
        return { left: true, archived: false };
      }

      await tx.group.update({
        where: { id: groupId },
        data: {
          status: GroupStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      });

      return { left: true, archived: true };
    });
  }
}
