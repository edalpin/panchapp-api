import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { derivePersonalGroupName, groupNameSchema } from '../../common/validation/group-name.schema';
import { GroupStatus } from '../../generated/prisma/client.js';
import { PersonalGroupPolicyService } from '../../groups/services/personal-group-policy.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { PersonalGroupBackfillReport } from '../types/backfill.types';

@Injectable()
export class PersonalGroupBackfillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personalGroupPolicyService: PersonalGroupPolicyService,
    @InjectPinoLogger(PersonalGroupBackfillService.name)
    private readonly logger: PinoLogger,
  ) {}

  async runBackfill(): Promise<PersonalGroupBackfillReport> {
    const users = await this.prisma.user.findMany({
      include: {
        personalGroup: {
          include: {
            memberships: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const report: PersonalGroupBackfillReport = {
      created: 0,
      skipped: 0,
      contradictions: [],
    };

    const missingUsers = [];

    for (const user of users) {
      const state = this.personalGroupPolicyService.classifyPersonalGroupState(user);

      if (state === 'complete') {
        report.skipped += 1;
        continue;
      }

      if (state === 'contradictory') {
        const contradiction = this.personalGroupPolicyService.describePersonalGroupContradiction(user);
        if (contradiction) {
          report.contradictions.push(contradiction);
        }
        continue;
      }

      missingUsers.push(user);
    }

    if (report.contradictions.length > 0) {
      for (const contradiction of report.contradictions) {
        this.logger.error(contradiction, 'Personal group backfill contradiction detected');
      }

      return report;
    }

    for (const user of missingUsers) {
      const groupName = groupNameSchema.parse(derivePersonalGroupName(user.name, user.email));

      await this.prisma.$transaction(async (tx) => {
        const group = await tx.group.create({
          data: {
            name: groupName,
            status: GroupStatus.ACTIVE,
            personalOwnerId: user.id,
            createdById: user.id,
          },
        });

        await tx.groupMembership.create({
          data: {
            groupId: group.id,
            userId: user.id,
          },
        });
      });

      report.created += 1;
    }

    return report;
  }
}
