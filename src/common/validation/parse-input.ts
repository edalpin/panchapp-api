import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException(result.error.issues[0]?.message ?? 'Invalid input');
  }
  return result.data;
}
