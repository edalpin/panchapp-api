import type { PersonalGroupContradiction } from '@/groups/types/personal-group-policy.types';

export type PersonalGroupBackfillReport = {
  created: number;
  skipped: number;
  contradictions: PersonalGroupContradiction[];
};
