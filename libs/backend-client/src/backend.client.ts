import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { BackendClientOptions } from './interfaces/backend-client-options.interface';
import {
  AccountDeviceInfo,
  LessonStatus,
} from './interfaces/backend-responses.interface';
import { BackendHttpError } from './errors/backend-http.error';
import { BackendTimeoutError } from './errors/backend-timeout.error';

@Injectable()
export class BackendClient {
  private readonly http: AxiosInstance;

  constructor(
    @Inject('BACKEND_OPTIONS')
    private readonly options: BackendClientOptions,
  ) {
    this.http = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout ?? 10000,
    });
  }

  async getAccountAndDeviceInfo(ssrc: string): Promise<AccountDeviceInfo> {
    return this.request<AccountDeviceInfo>('GET', `/account/device-info`, {
      params: { ssrc },
    });
  }

  async getLessonStatus(lessonId: string): Promise<LessonStatus> {
    return this.request<LessonStatus>('GET', `/lessons/${lessonId}/status`);
  }

  private async request<T>(
    method: string,
    url: string,
    config?: { params?: Record<string, string> },
  ): Promise<T> {
    try {
      const response = await this.http.request<T>({
        method,
        url,
        params: config?.params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error, url);
    }
  }

  private handleError(error: unknown, url: string): never {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new BackendTimeoutError(
          url,
          this.options.timeout ?? 10000,
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
