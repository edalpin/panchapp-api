import { GroupStatus } from '@/generated/prisma/client.js';
import type {
  PersonalGroupContradiction,
  PersonalGroupState,
  UserWithPersonalGroup,
} from '@/groups/types/personal-group-policy.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PersonalGroupPolicyService {
  classifyPersonalGroupState(user: UserWithPersonalGroup): PersonalGroupState {
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
}
