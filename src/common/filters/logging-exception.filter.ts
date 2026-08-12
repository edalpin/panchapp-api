import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class LoggingExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  constructor(
    httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(LoggingExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const internalServerError: number = HttpStatus.INTERNAL_SERVER_ERROR;
    const isClientError = status < internalServerError;

    if (isClientError) {
      this.logger.warn({ err: exception }, 'Unhandled exception');
    } else {
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    if (host.getType() === 'http') {
      const response = host.switchToHttp().getResponse<{ err?: unknown }>();
      response.err = exception;
      super.catch(exception, host);
      return;
    }

    throw exception;
  }
}
