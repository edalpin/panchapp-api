import { PAGINATION_DEFAULT_FIRST, PAGINATION_MAX_FIRST } from '@/core/constants/pagination.constants';
import { z } from 'zod';

export const paginationArgsSchema = z.object({
  first: z
    .number()
    .int('first must be an integer')
    .min(1, 'first must be at least 1')
    .max(PAGINATION_MAX_FIRST, `first must be at most ${PAGINATION_MAX_FIRST}`)
    .optional()
    .default(PAGINATION_DEFAULT_FIRST),
  after: z.string().trim().min(1, 'after must not be empty').optional(),
});

export type PaginationArgs = z.infer<typeof paginationArgsSchema>;
