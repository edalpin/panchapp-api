import { GROUP_NAME_MAX_LENGTH } from '@/groups/constants/group-name.constants';
import { z } from 'zod';

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, 'Group name must not be empty')
  .max(GROUP_NAME_MAX_LENGTH, `Group name must be at most ${GROUP_NAME_MAX_LENGTH} characters`);
