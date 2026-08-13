import { GROUP_NAME_MAX_LENGTH, PERSONAL_GROUP_NAME_SUFFIX } from '@/groups/constants/group-name.constants';

export function derivePersonalGroupName(displayName: string | null | undefined, email: string): string {
  const trimmedName = displayName?.trim();
  const baseLabel = trimmedName && trimmedName.length > 0 ? trimmedName : (email.split('@')[0] ?? email);
  const maxBaseLength = GROUP_NAME_MAX_LENGTH - PERSONAL_GROUP_NAME_SUFFIX.length;
  const truncatedBase = baseLabel.length > maxBaseLength ? baseLabel.slice(0, maxBaseLength) : baseLabel;

  return `${truncatedBase}${PERSONAL_GROUP_NAME_SUFFIX}`;
}
