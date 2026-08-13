import { groupNameSchema } from '@/groups/validation/group-name.schema';
import { z } from 'zod';

export const updateGroupSchema = z.object({
  groupId: z.uuid('groupId must be a valid UUID'),
  name: groupNameSchema,
});

export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
