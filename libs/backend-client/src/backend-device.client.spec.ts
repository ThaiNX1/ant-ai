import { BackendDeviceClient } from './backend-device.client';
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

describe('BackendDeviceClient', () => {
  let client: BackendDeviceClient;
  let mockGet: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    mockedCreate.mockReturnValue({ get: mockGet });

    client = new BackendDeviceClient({
      baseUrl: 'http://backend.local',
      timeout: 15000,
    });
  });

  describe('streamFileFromCache', () => {
    it('should return a readable stream', async () => {
      const mockStream = { pipe: jest.fn() };
      mockGet.mockResolvedValue({ data: mockStream });

      const result = await client.streamFileFromCache('dev-1', 'http://file.url/img.png');

      expect(result).toBe(mockStream);
      expect(mockGet).toHaveBeenCalledWith('/devices/dev-1/cache/stream', {
        params: { fileUrl: 'http://file.url/img.png' },
        responseType: 'stream',
      });
    });

    it('should throw BackendHttpError on 4xx/5xx', async () => {
      const error = new AxiosError('Not Found', '404', undefined, undefined, {
        status: 404,
        data: 'File not found',
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
      });
      mockGet.mockRejectedValue(error);

      await expect(
        client.streamFileFromCache('dev-1', 'http://file.url/missing.png'),
      ).rejects.toThrow(BackendHttpError);
    });

    it('should throw BackendTimeoutError on timeout', async () => {
      const error = new AxiosError('timeout', 'ECONNABORTED');
      mockGet.mockRejectedValue(error);

      await expect(
        client.streamFileFromCache('dev-1', 'http://file.url/slow.png'),
      ).rejects.toThrow(BackendTimeoutError);
    });
  });

  describe('default timeout', () => {
    it('should use 30000ms as default timeout', () => {
      mockedCreate.mockReturnValue({ get: jest.fn() });
      new BackendDeviceClient({ baseUrl: 'http://localhost' });

      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 30000 }),
      );
    });
  });
});
