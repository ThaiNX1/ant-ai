import { DynamicModule, Module } from '@nestjs/common';
import { BackendClientOptions } from './interfaces/backend-client-options.interface';
import { BackendClient } from './backend.client';
import { BackendDeviceClient } from './backend-device.client';

@Module({})
export class BackendClientModule {
  static register(options: BackendClientOptions): DynamicModule {
    return {
      module: BackendClientModule,
      providers: [
        { provide: 'BACKEND_OPTIONS', useValue: options },
        BackendClient,
        BackendDeviceClient,
      ],
      exports: [BackendClient, BackendDeviceClient],
    };
  }
}
