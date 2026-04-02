import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { AdapterError } from '@ai-platform/ai-core';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; send: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  describe('HttpException handling', () => {
    it('should return the correct status and message for HttpException', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not Found',
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: ['field is required'], error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: ['field is required'],
          error: 'Bad Request',
        }),
      );
    });
  });

  describe('AdapterError handling', () => {
    it('should return 502 with provider info for AdapterError', () => {
      const exception = new AdapterError(
        'API_RATE_LIMIT',
        'Rate limit exceeded',
        'gemini',
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(502);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: 502,
        message: 'AI provider error: Rate limit exceeded',
        provider: 'gemini',
        code: 'API_RATE_LIMIT',
      });
    });
  });

  describe('Unknown error handling', () => {
    it('should return 500 with generic message for unknown errors', () => {
      const exception = new Error('Something broke internally');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
    });

    it('should not expose stack traces for unknown errors', () => {
      const exception = new Error('secret internal detail');

      filter.catch(exception, mockHost);

      const sentBody = mockResponse.send.mock.calls[0][0];
      expect(sentBody).not.toHaveProperty('stack');
      expect(JSON.stringify(sentBody)).not.toContain('secret internal detail');
    });

    it('should handle non-Error thrown values', () => {
      filter.catch('string error', mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
    });
  });
});
