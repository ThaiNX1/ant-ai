import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AdapterError } from '@ai-platform/ai-core';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode: number;
    let body: Record<string, unknown>;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      body =
        typeof exceptionResponse === 'string'
          ? { statusCode, message: exceptionResponse }
          : { statusCode, ...(exceptionResponse as Record<string, unknown>) };
    } else if (exception instanceof AdapterError) {
      statusCode = 502;
      body = {
        statusCode: 502,
        message: `AI provider error: ${exception.message}`,
        provider: exception.provider,
        code: exception.code,
      };
      this.logger.error(
        `AdapterError [${exception.provider}] ${exception.code}: ${exception.message}`,
        exception.stack,
      );
    } else {
      statusCode = 500;
      body = {
        statusCode: 500,
        message: 'Internal server error',
      };
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`Unhandled exception: ${err.message}`, err.stack);
    }

    response.status(statusCode).send(body);
  }
}
