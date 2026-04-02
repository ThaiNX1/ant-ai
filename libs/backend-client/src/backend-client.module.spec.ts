import { Test } from '@nestjs/testing';
import { BackendClientModule } from './backend-client.module';
import { BackendClient } from './backend.client';
import { BackendDeviceClient } from './backend-device.client';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: jest.fn().mockReturnValue({
        request: jest.fn(),
        get: jest.fn(),
      }),
    },
    create: jest.fn().mockReturnValue({
      request: jest.fn(),
      get: jest.fn(),
    }),
  };
});

describe('BackendClientModule', () => {
  it('should register and provide BackendClient and BackendDeviceClient', async () => {
    const module = await Test.createTestingModule({
      imports: [
        BackendClientModule.register({
          baseUrl: 'http://test.local',
          timeout: 3000,
        }),
      ],
    }).compile();

    const backendClient = module.get(BackendClient);
    const deviceClient = module.get(BackendDeviceClient);

    expect(backendClient).toBeInstanceOf(BackendClient);
    expect(deviceClient).toBeInstanceOf(BackendDeviceClient);
  });

  it('should inject BACKEND_OPTIONS with provided values', async () => {
    const options = { baseUrl: 'http://api.example.com', timeout: 5000 };

    const module = await Test.createTestingModule({
      imports: [BackendClientModule.register(options)],
    }).compile();

    const injectedOptions = module.get('BACKEND_OPTIONS');
    expect(injectedOptions).toEqual(options);
  });
});
