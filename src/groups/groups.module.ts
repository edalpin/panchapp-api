import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroupsResolver } from './graphql/groups.resolver';
import { GroupAccessService } from './services/group-access.service';
import { GroupMembershipService } from './services/group-membership.service';
import { GroupsService } from './services/groups.service';
import { PersonalGroupPolicyService } from './services/personal-group-policy.service';

@Module({
  imports: [AuthModule],
  providers: [GroupsService, GroupAccessService, GroupMembershipService, PersonalGroupPolicyService, GroupsResolver],
  exports: [GroupAccessService, PersonalGroupPolicyService],
})
export class GroupsModule {}
