import type { ProvisionUserRequest } from '@/admin/http/provision-user.schema';
import type { ProvisionedUser } from '@/admin/types/provision-user.types';
import { derivePersonalGroupName, groupNameSchema } from '@/common/validation/group-name.schema';
import { GroupStatus } from '@/generated/prisma/client.js';
import { PersonalGroupPolicyService } from '@/groups/services/personal-group-policy.service';
import type { UserWithPersonalGroup } from '@/groups/types/personal-group-policy.types';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class UserProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personalGroupPolicyService: PersonalGroupPolicyService,
    @InjectPinoLogger(UserProvisioningService.name)
    private readonly logger: PinoLogger,
  ) {}

  async provisionUser(input: ProvisionUserRequest): Promise<ProvisionedUser> {
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

  private assertCompletePersonalGroup(user: UserWithPersonalGroup, email: string): void {
    const state = this.personalGroupPolicyService.classifyPersonalGroupState(user);

    if (state === 'complete') {
      return;
    }

    const contradiction = this.personalGroupPolicyService.describePersonalGroupContradiction(user);
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
