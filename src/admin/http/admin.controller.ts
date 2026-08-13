import { AdminApiKeyGuard } from '@/admin/guards/admin-api-key.guard';
import type { PersonalGroupBackfillResponse } from '@/admin/http/backfill.response';
import type { ProvisionUserResponse } from '@/admin/http/provision-user.response';
import { provisionUserSchema } from '@/admin/http/provision-user.schema';
import { PersonalGroupBackfillService } from '@/admin/services/personal-group-backfill.service';
import { UserProvisioningService } from '@/admin/services/user-provisioning.service';
import { parseInput } from '@/common/validation/parse-input';
import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

@Controller('admin')
@UseGuards(AdminApiKeyGuard)
export class AdminController {
  constructor(
    private readonly userProvisioningService: UserProvisioningService,
    private readonly personalGroupBackfillService: PersonalGroupBackfillService,
  ) {}

  @Post('users')
  async provisionUser(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProvisionUserResponse> {
    const input = parseInput(provisionUserSchema, body);
    const result = await this.userProvisioningService.provisionUser(input);

    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);

    return {
      created: result.created,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        status: result.user.status,
      },
    };
  }

  @Post('personal-groups/backfill')
  @HttpCode(HttpStatus.OK)
  async backfillPersonalGroups(@Res({ passthrough: true }) res: Response): Promise<PersonalGroupBackfillResponse> {
    const report = await this.personalGroupBackfillService.runBackfill();

    if (report.contradictions.length > 0) {
      res.status(HttpStatus.CONFLICT);
    }

    return report;
  }
}
