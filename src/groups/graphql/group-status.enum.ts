import { registerEnumType } from '@nestjs/graphql';
import { GroupStatus } from '../../generated/prisma/client.js';

registerEnumType(GroupStatus, {
  name: 'GroupStatus',
});

export { GroupStatus };
