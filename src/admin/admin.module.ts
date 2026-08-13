import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';
import { PersonalGroupBackfillService } from './personal-group-backfill.service';
import { UserProvisioningService } from './user-provisioning.service';

@Module({
  controllers: [AdminController],
  providers: [UserProvisioningService, PersonalGroupBackfillService, AdminApiKeyGuard],
})
export class AdminModule {}
