import type {
  EncodedGroupCursor,
  EncodedMemberCursor,
  GroupCursor,
  MemberCursor,
} from '@/groups/types/pagination.types';
import { BadRequestException } from '@nestjs/common';

function encodeCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor<T>(cursor: string, label: string): T {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(decoded) as T;
  } catch {
    throw new BadRequestException(`Invalid ${label} cursor`);
  }
}

function parseIsoDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${label} cursor`);
  }
  return date;
}

export function encodeGroupCursor(updatedAt: Date, id: string): string {
  return encodeCursor({
    updatedAt: updatedAt.toISOString(),
    id,
  } satisfies EncodedGroupCursor);
}

export function decodeGroupCursor(cursor: string): GroupCursor {
  const payload = decodeCursor<EncodedGroupCursor>(cursor, 'group');

  if (typeof payload.updatedAt !== 'string' || typeof payload.id !== 'string' || payload.id.length === 0) {
    throw new BadRequestException('Invalid group cursor');
  }

  return {
    updatedAt: parseIsoDate(payload.updatedAt, 'group'),
    id: payload.id,
  };
}

export function encodeMemberCursor(joinedAt: Date, userId: string): string {
  return encodeCursor({
    joinedAt: joinedAt.toISOString(),
    userId,
  } satisfies EncodedMemberCursor);
}

export function decodeMemberCursor(cursor: string): MemberCursor {
  const payload = decodeCursor<EncodedMemberCursor>(cursor, 'member');

  if (typeof payload.joinedAt !== 'string' || typeof payload.userId !== 'string' || payload.userId.length === 0) {
    throw new BadRequestException('Invalid member cursor');
  }

  return {
    joinedAt: parseIsoDate(payload.joinedAt, 'member'),
    userId: payload.userId,
  };
}
