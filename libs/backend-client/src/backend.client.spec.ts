import { BackendClient } from './backend.client';
import { BackendHttpError } from './errors/backend-http.error';
import { BackendTimeoutError } from './errors/backend-timeout.error';
import axios, { AxiosError } from 'axios';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: jest.fn(),
    },
    create: jest.fn(),
  };
});

const mockedCreate = axios.create as jest.Mock;

describe('BackendClient', () => {
  let client: BackendClient;
  let mockRequest: jest.Mock;

  beforeEach(() => {
    mockRequest = jest.fn();
    mockedCreate.mockReturnValue({ request: mockRequest });

    client = new BackendClient({ baseUrl: 'http://backend.local', timeout: 5000 });
  });

  describe('getAccountAndDeviceInfo', () => {
    it('should return account and device info for a given ssrc', async () => {
      const data = { accountId: 'acc-1', deviceId: 'dev-1' };
      mockRequest.mockResolvedValue({ data });

      const result = await client.getAccountAndDeviceInfo('ssrc-123');

      expect(result).toEqual(data);
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/account/device-info',
        params: { ssrc: 'ssrc-123' },
      });
    });

    it('should throw BackendHttpError on 4xx response', async () => {
      const error = new AxiosError('Not Found', '404', undefined, undefined, {
        status: 404,
        data: { error: 'Not found' },
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
      });
      mockRequest.mockRejectedValue(error);

      await expect(client.getAccountAndDeviceInfo('bad-ssrc')).rejects.toThrow(
        BackendHttpError,
      );
      await expect(
        client.getAccountAndDeviceInfo('bad-ssrc'),
      ).rejects.toMatchObject({
        statusCode: 404,
        responseBody: { error: 'Not found' },
      });
    });

    it('should throw BackendHttpError on 5xx response', async () => {
      const error = new AxiosError('Internal Server Error', '500', undefined, undefined, {
        status: 500,
        data: 'Server error',
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as never,
      });
      mockRequest.mockRejectedValue(error);

      await expect(client.getAccountAndDeviceInfo('ssrc-1')).rejects.toThrow(
        BackendHttpError,
      );
      await expect(
        client.getAccountAndDeviceInfo('ssrc-1'),
      ).rejects.toMatchObject({
        statusCode: 500,
        responseBody: 'Server error',
      });
    });

    it('should throw BackendTimeoutError on timeout', async () => {
      const error = new AxiosError('timeout', 'ECONNABORTED');
      mockRequest.mockRejectedValue(error);

      await expect(client.getAccountAndDeviceInfo('ssrc-1')).rejects.toThrow(
        BackendTimeoutError,
      );
      await expect(
        client.getAccountAndDeviceInfo('ssrc-1'),
      ).rejects.toMatchObject({
        url: '/account/device-info',
        timeoutMs: 5000,
      });
    });
  });

  describe('getLessonStatus', () => {
    it('should return lesson status for a given lessonId', async () => {
      const data = { lessonId: 'lesson-1', status: 'active' };
      mockRequest.mockResolvedValue({ data });

      const result = await client.getLessonStatus('lesson-1');

      expect(result).toEqual(data);
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/lessons/lesson-1/status',
        params: undefined,
      });
    });

    it('should throw BackendHttpError on error response', async () => {
      const error = new AxiosError('Forbidden', '403', undefined, undefined, {
        status: 403,
        data: { message: 'Forbidden' },
        statusText: 'Forbidden',
        headers: {},
        config: {} as never,
      });
      mockRequest.mockRejectedValue(error);

      await expect(client.getLessonStatus('lesson-1')).rejects.toThrow(
        BackendHttpError,
      );
    });
  });

  describe('default timeout', () => {
    it('should use 10000ms as default timeout', () => {
      mockedCreate.mockReturnValue({ request: jest.fn() });
      new BackendClient({ baseUrl: 'http://localhost' });

      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 10000 }),
      );
    });
  });
});
