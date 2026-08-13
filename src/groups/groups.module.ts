import { AuthModule } from '@/auth/auth.module';
import { GroupsResolver } from '@/groups/graphql/groups.resolver';
import { GroupAccessService } from '@/groups/services/group-access.service';
import { GroupMembershipService } from '@/groups/services/group-membership.service';
import { GroupsService } from '@/groups/services/groups.service';
import { PersonalGroupPolicyService } from '@/groups/services/personal-group-policy.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [AuthModule],
  providers: [GroupsService, GroupAccessService, GroupMembershipService, PersonalGroupPolicyService, GroupsResolver],
  exports: [GroupAccessService, PersonalGroupPolicyService],
})
export class GroupsModule {}
