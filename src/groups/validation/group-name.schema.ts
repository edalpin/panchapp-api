import { GROUP_NAME_MAX_LENGTH, PERSONAL_GROUP_NAME_SUFFIX } from '@/groups/constants/group-name.constants';
import { z } from 'zod';

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, 'Group name must not be empty')
  .max(GROUP_NAME_MAX_LENGTH, `Group name must be at most ${GROUP_NAME_MAX_LENGTH} characters`);

export function derivePersonalGroupName(displayName: string | null | undefined, email: string): string {
  const trimmedName = displayName?.trim();
  const baseLabel = trimmedName && trimmedName.length > 0 ? trimmedName : (email.split('@')[0] ?? email);
  const maxBaseLength = GROUP_NAME_MAX_LENGTH - PERSONAL_GROUP_NAME_SUFFIX.length;
  const truncatedBase = baseLabel.length > maxBaseLength ? baseLabel.slice(0, maxBaseLength) : baseLabel;

  return `${truncatedBase}${PERSONAL_GROUP_NAME_SUFFIX}`;
}
