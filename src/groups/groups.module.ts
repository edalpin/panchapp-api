import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroupsResolver } from './graphql/groups.resolver';
import { GroupMembershipService } from './group-membership.service';
import { GroupAccessService, GroupsService } from './groups.service';

@Module({
  imports: [AuthModule],
  providers: [GroupsService, GroupAccessService, GroupMembershipService, GroupsResolver],
  exports: [GroupsService, GroupAccessService, GroupMembershipService],
})
export class GroupsModule {}
