import { ConnectionView } from '@/core/pagination/pagination.types';
import { buildConnectionPage } from '@/core/pagination/pagination.util';
import { PrismaService } from '@/core/prisma/prisma.service';
import { GroupStatus, Prisma } from '@/generated/prisma/client.js';
import { GroupAccessService } from '@/groups/services/group-access.service';
import { GroupMembershipService } from '@/groups/services/group-membership.service';
import { GroupView } from '@/groups/types/group-view.types';
import { LeaveGroupResult } from '@/groups/types/leave-group.types';
import { decodeGroupCursor, encodeGroupCursor } from '@/groups/utils/group-cursor.util';
import { toGroupView } from '@/groups/utils/group.mapper';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupAccessService: GroupAccessService,
    private readonly groupMembershipService: GroupMembershipService,
    @InjectPinoLogger(GroupsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async findMyGroupsPaginated(userId: string, first: number, after?: string): Promise<ConnectionView<GroupView>> {
    const cursor = after ? decodeGroupCursor(after) : undefined;
    const cursorFilter: Prisma.GroupWhereInput | undefined = cursor
      ? {
          OR: [
            { updatedAt: { lt: cursor.updatedAt } },
            {
              updatedAt: cursor.updatedAt,
              id: { lt: cursor.id },
            },
          ],
        }
      : undefined;

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        userId,
        group: {
          status: GroupStatus.ACTIVE,
          ...(cursorFilter ?? {}),
        },
      },
      include: { group: true },
      orderBy: [{ group: { updatedAt: 'desc' } }, { groupId: 'desc' }],
      take: first + 1,
    });

    if (!after) {
      const personalMembership = await this.prisma.groupMembership.findFirst({
        where: {
          userId,
          group: {
            personalOwnerId: userId,
            status: GroupStatus.ACTIVE,
          },
        },
        select: { groupId: true },
      });

      if (!personalMembership) {
        this.logger.error({ userId }, 'Active user is missing required personal group');
        throw new InternalServerErrorException('User is missing required personal group');
      }
    }

    const groups = memberships.map((membership) => toGroupView(membership.group));

    return buildConnectionPage(
      groups,
      first,
      (group) => ({ updatedAt: group.updatedAt, id: group.id }),
      ({ updatedAt, id }) => encodeGroupCursor(updatedAt, id),
    );
  }

  async findAccessibleGroup(groupId: string, userId: string): Promise<GroupView> {
    return this.groupAccessService.requireMembership(groupId, userId);
  }

  async createCollaborativeGroup(userId: string, name: string): Promise<GroupView> {
    const group = await this.prisma.$transaction(async (tx) => {
      const createdGroup = await tx.group.create({
        data: {
          name,
          status: GroupStatus.ACTIVE,
          personalOwnerId: null,
          createdById: userId,
        },
      });

      await tx.groupMembership.create({
        data: {
          groupId: createdGroup.id,
          userId,
        },
      });

      return createdGroup;
    });

    this.logger.info({ groupId: group.id, userId }, 'Collaborative group created');

    return toGroupView(group);
  }

  async renameGroup(groupId: string, userId: string, name: string): Promise<GroupView> {
    await this.groupAccessService.requireActiveCollaborativeMembership(groupId, userId);

    const updatedGroup = await this.prisma.$transaction(async (tx) => {
      const result = await tx.group.updateMany({
        where: {
          id: groupId,
          status: GroupStatus.ACTIVE,
          personalOwnerId: null,
        },
        data: { name },
      });

      if (result.count === 0) {
        throw new BadRequestException('Archived groups cannot be modified');
      }

      return tx.group.findUniqueOrThrow({ where: { id: groupId } });
    });

    this.logger.info({ groupId, userId }, 'Collaborative group renamed');

    return toGroupView(updatedGroup);
  }

  async leaveGroup(groupId: string, userId: string): Promise<LeaveGroupResult> {
    return this.groupMembershipService.leaveCollaborativeGroup(groupId, userId);
  }
}
