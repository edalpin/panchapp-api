import type { PersonalGroupContradiction } from '../../groups/types/personal-group-policy.types';

export type PersonalGroupBackfillResponse = {
  created: number;
  skipped: number;
  contradictions: PersonalGroupContradiction[];
};
