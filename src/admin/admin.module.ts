import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';
import { AdminController } from './http/admin.controller';
import { PersonalGroupBackfillService } from './services/personal-group-backfill.service';
import { UserProvisioningService } from './services/user-provisioning.service';

@Module({
  imports: [GroupsModule],
  controllers: [AdminController],
  providers: [UserProvisioningService, PersonalGroupBackfillService, AdminApiKeyGuard],
})
export class AdminModule {}
