import { GroupStatus } from '@/generated/prisma/client.js';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(GroupStatus, {
  name: 'GroupStatus',
});

export { GroupStatus };
