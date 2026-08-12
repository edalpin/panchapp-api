import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_RESPONSE_HEADER = 'X-Correlation-ID';

function readHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (Array.isArray(value) && value[0]) {
    return value[0];
  }
  return undefined;
}

export function resolveCorrelationId(req: IncomingMessage): string {
  return readHeader(req, CORRELATION_ID_HEADER) ?? readHeader(req, REQUEST_ID_HEADER) ?? randomUUID();
}

export function applyCorrelationId(req: IncomingMessage, res: ServerResponse, correlationId: string): void {
  req.headers[CORRELATION_ID_HEADER] = correlationId;
  res.setHeader(CORRELATION_ID_RESPONSE_HEADER, correlationId);
}
