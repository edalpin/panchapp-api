import { groupNameSchema } from '@/groups/validation/group-name.schema';
import { z } from 'zod';

export const createGroupSchema = z.object({
  name: groupNameSchema,
});

export type CreateGroupDto = z.infer<typeof createGroupSchema>;
