import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { derivePersonalGroupName, groupNameSchema } from '../common/validation/group-name.schema';
import {
  GroupStatus,
  Group as PrismaGroup,
  GroupMembership as PrismaGroupMembership,
  User as PrismaUser,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import type { PersonalGroupContradiction, ProvisionUserInput, ProvisionedUser } from './types/provisioning.types';

type UserWithPersonalGroup = PrismaUser & {
  personalGroup: (PrismaGroup & { memberships: PrismaGroupMembership[] }) | null;
};

@Injectable()
export class UserProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(UserProvisioningService.name)
    private readonly logger: PinoLogger,
  ) {}

  async provisionUser(input: ProvisionUserInput): Promise<ProvisionedUser> {
    const email = input.email.trim().toLowerCase();
    const name = input.name?.trim() || null;
    const groupName = groupNameSchema.parse(derivePersonalGroupName(name, email));

    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: {
        personalGroup: {
          include: {
            memberships: true,
          },
        },
      },
    });

    if (existing) {
      this.assertCompletePersonalGroup(existing, email);
      return { user: existing, created: false };
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name,
        },
      });

      const group = await tx.group.create({
        data: {
          name: groupName,
          status: GroupStatus.ACTIVE,
          personalOwnerId: createdUser.id,
          createdById: createdUser.id,
        },
      });

      await tx.groupMembership.create({
        data: {
          groupId: group.id,
          userId: createdUser.id,
        },
      });

      return createdUser;
    });

    return { user, created: true };
  }

  classifyPersonalGroupState(user: UserWithPersonalGroup): 'complete' | 'missing' | 'contradictory' {
    const personalGroup = user.personalGroup;

    if (!personalGroup) {
      return 'missing';
    }

    const contradiction = this.describePersonalGroupContradiction(user);
    return contradiction ? 'contradictory' : 'complete';
  }

  describePersonalGroupContradiction(user: UserWithPersonalGroup): PersonalGroupContradiction | null {
    const personalGroup = user.personalGroup;

    if (!personalGroup) {
      return null;
    }

    if (personalGroup.personalOwnerId !== user.id) {
      return {
        userId: user.id,
        email: user.email,
        reason: 'Personal group owner does not match user',
      };
    }

    if (personalGroup.status !== GroupStatus.ACTIVE || personalGroup.archivedAt !== null) {
      return {
        userId: user.id,
        email: user.email,
        reason: 'Personal group is not active',
      };
    }

    if (personalGroup.memberships.length !== 1) {
      return {
        userId: user.id,
        email: user.email,
        reason: `Personal group must have exactly one membership, found ${personalGroup.memberships.length}`,
      };
    }

    const membership = personalGroup.memberships[0];
    if (membership.userId !== user.id) {
      return {
        userId: user.id,
        email: user.email,
        reason: 'Personal group membership does not belong to owner',
      };
    }

    return null;
  }

  private assertCompletePersonalGroup(user: UserWithPersonalGroup, email: string): void {
    const state = this.classifyPersonalGroupState(user);

    if (state === 'complete') {
      return;
    }

    const contradiction = this.describePersonalGroupContradiction(user);
    this.logger.error(
      {
        userId: user.id,
        email,
        reason: contradiction?.reason ?? 'Missing personal group',
      },
      'User provisioning integrity fault',
    );

    if (state === 'missing') {
      throw new InternalServerErrorException('User is missing required personal group');
    }

    throw new ConflictException('User personal group data is contradictory');
  }
}
