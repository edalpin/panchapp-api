import { BadRequestException, HttpStatus } from '@nestjs/common';
import { z } from 'zod';

export type ValidationIssue = {
  path: string;
  message: string;
};

function isMissingBody(value: unknown): boolean {
  return value === null || value === undefined;
}

function formatIssuePath(path: PropertyKey[]): string {
  return path.map(String).join('.');
}

function formatIssueMessage(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_type' && issue.message.includes('received undefined')) {
    return 'Required';
  }
  return issue.message;
}

function toValidationIssues(issues: z.core.$ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: formatIssuePath(issue.path),
    message: formatIssueMessage(issue),
  }));
}

export function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const parseValue = isMissingBody(value) && schema instanceof z.ZodObject ? {} : value;
  const result = schema.safeParse(parseValue);

  if (!result.success) {
    const issues = toValidationIssues(result.error.issues);
    const message = isMissingBody(value) ? 'Request body is required' : 'Validation failed';

    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message,
      issues,
    });
  }

  return result.data;
}
