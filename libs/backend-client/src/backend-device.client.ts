import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { BackendClientOptions } from './interfaces/backend-client-options.interface';
import { BackendHttpError } from './errors/backend-http.error';
import { BackendTimeoutError } from './errors/backend-timeout.error';

@Injectable()
export class BackendDeviceClient {
  private readonly http: AxiosInstance;

  constructor(
    @Inject('BACKEND_OPTIONS')
    private readonly options: BackendClientOptions,
  ) {
    this.http = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout ?? 30000,
    });
  }

  async streamFileFromCache(
    deviceId: string,
    fileUrl: string,
  ): Promise<NodeJS.ReadableStream> {
    try {
      const response = await this.http.get(
        `/devices/${deviceId}/cache/stream`,
        {
          params: { fileUrl },
          responseType: 'stream',
        },
      );
      return response.data as NodeJS.ReadableStream;
    } catch (error) {
      this.handleError(error, `/devices/${deviceId}/cache/stream`);
    }
  }

  private handleError(error: unknown, url: string): never {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new BackendTimeoutError(
          url,
          this.options.timeout ?? 30000,
        );
      }
      if (error.response) {
        throw new BackendHttpError(
          error.response.status,
          error.response.data,
        );
      }
    }
    throw error;
  }
}
