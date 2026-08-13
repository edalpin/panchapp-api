import { AdminApiKeyGuard } from '@/admin/guards/admin-api-key.guard';
import { AdminController } from '@/admin/http/admin.controller';
import { PersonalGroupBackfillService } from '@/admin/services/personal-group-backfill.service';
import { UserProvisioningService } from '@/admin/services/user-provisioning.service';
import { GroupsModule } from '@/groups/groups.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [GroupsModule],
  controllers: [AdminController],
  providers: [UserProvisioningService, PersonalGroupBackfillService, AdminApiKeyGuard],
})
export class AdminModule {}
