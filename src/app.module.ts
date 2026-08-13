import { AdminModule } from '@/admin/admin.module';
import { AppController } from '@/app.controller';
import { AuthModule } from '@/auth/auth.module';
import { CoreModule } from '@/core/core.module';
import { GroupsModule } from '@/groups/groups.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [CoreModule, UsersModule, AuthModule, GroupsModule, AdminModule],
  controllers: [AppController],
})
export class AppModule {}
