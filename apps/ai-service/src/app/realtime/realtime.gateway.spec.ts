import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeGateway, REALTIME_CONFIGS } from './realtime.gateway';
import { AdapterFactory } from '@ai-platform/ai-core';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

jest.mock('@ai-platform/ai-core', () => {
  const actual = jest.requireActual('@ai-platform/ai-core');
  return {
    ...actual,
    AdapterFactory: {
      ...actual.AdapterFactory,
      createRealtime: jest.fn(),
    },
  };
});

type WsClient = WebSocket & { id?: string };

function createMockClient(id?: string): WsClient {
  return {
    id,
    readyState: WebSocket.OPEN,
    send: jest.fn(),
    close: jest.fn(),
  } as unknown as WsClient;
}

function createMockRequest(provider = 'openai'): IncomingMessage {
  return {
    url: `/realtime?provider=${provider}`,
    headers: { host: 'localhost:8081' },
  } as unknown as IncomingMessage;
}

function createMockAdapter() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    feedAudio: jest.fn(),
    getResponseStream: jest.fn().mockReturnValue((async function* () {})()),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

const mockConfigs = [
  { name: 'openai', provider: 'openai', model: 'gpt-4o-realtime-preview', apiKey: 'test-openai-key' },
  { name: 'gemini', provider: 'gemini', model: 'gemini-2.0-flash-live-001', apiKey: 'test-gemini-key' },
];

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: REALTIME_CONFIGS, useValue: mockConfigs },
        RealtimeGateway,
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  describe('handleConnection', () => {
    it('should create a session with openai provider', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient();
      await gateway.handleConnection(client, createMockRequest('openai'));

      expect(AdapterFactory.createRealtime).toHaveBeenCalledWith(mockConfigs[0]);
      expect(mockAdapter.connect).toHaveBeenCalledWith({ model: 'gpt-4o-realtime-preview' });
      expect(gateway.getSessionCount()).toBe(1);
    });

    it('should create a session with gemini provider', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient();
      await gateway.handleConnection(client, createMockRequest('gemini'));

      expect(AdapterFactory.createRealtime).toHaveBeenCalledWith(mockConfigs[1]);
      expect(mockAdapter.connect).toHaveBeenCalledWith({ model: 'gemini-2.0-flash-live-001' });
      expect(gateway.getSessionCount()).toBe(1);
    });

    it('should default to openai when no provider query param', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient();
      const req = { url: '/realtime', headers: { host: 'localhost' } } as unknown as IncomingMessage;
      await gateway.handleConnection(client, req);

      expect(AdapterFactory.createRealtime).toHaveBeenCalledWith(mockConfigs[0]);
    });

    it('should assign a unique client ID if not present', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient();
      await gateway.handleConnection(client, createMockRequest());

      expect(client.id).toBeDefined();
      expect(client.id).toMatch(/^client_/);
    });

    it('should close client on unknown provider', async () => {
      const client = createMockClient();
      await gateway.handleConnection(client, createMockRequest('unknown-provider'));

      expect(client.close).toHaveBeenCalledWith(1011, 'Failed to create realtime session');
      expect(gateway.getSessionCount()).toBe(0);
    });

    it('should close client on connection failure', async () => {
      (AdapterFactory.createRealtime as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const client = createMockClient();
      await gateway.handleConnection(client, createMockRequest());

      expect(client.close).toHaveBeenCalledWith(1011, 'Failed to create realtime session');
      expect(gateway.getSessionCount()).toBe(0);
    });
  });

  describe('handleDisconnect', () => {
    it('should cleanup session on disconnect', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('test-client');
      await gateway.handleConnection(client, createMockRequest());
      expect(gateway.getSessionCount()).toBe(1);

      await gateway.handleDisconnect(client);

      expect(mockAdapter.disconnect).toHaveBeenCalled();
      expect(gateway.getSessionCount()).toBe(0);
    });

    it('should handle disconnect for unknown client gracefully', async () => {
      const client = createMockClient('unknown-client');
      await expect(gateway.handleDisconnect(client)).resolves.not.toThrow();
    });
  });

  describe('handleAudio', () => {
    it('should feed audio to the session adapter', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('audio-client');
      await gateway.handleConnection(client, createMockRequest());

      const audioData = Buffer.from([0x01, 0x02, 0x03]);
      gateway.handleAudio(audioData, client);

      expect(mockAdapter.feedAudio).toHaveBeenCalledWith(audioData);
    });

    it('should not feed audio if no session exists', async () => {
      const client = createMockClient('no-session');
      expect(() => gateway.handleAudio(Buffer.from([0x01]), client)).not.toThrow();
    });
  });

  describe('forwardResponses', () => {
    it('should forward responses from adapter to client', async () => {
      const responses = [
        { type: 'transcript', data: 'hello' },
        { type: 'audio', data: 'base64audio' },
      ];

      const mockAdapter = createMockAdapter();
      mockAdapter.getResponseStream.mockReturnValue(
        (async function* () { for (const r of responses) yield r; })(),
      );
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('forward-client');
      await gateway.handleConnection(client, createMockRequest());

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(client.send).toHaveBeenCalledWith(JSON.stringify(responses[0]));
      expect(client.send).toHaveBeenCalledWith(JSON.stringify(responses[1]));
    });
  });

  describe('session management', () => {
    it('should track session count correctly', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      expect(gateway.getSessionCount()).toBe(0);

      const client1 = createMockClient('c1');
      const client2 = createMockClient('c2');

      await gateway.handleConnection(client1, createMockRequest('openai'));
      expect(gateway.getSessionCount()).toBe(1);

      await gateway.handleConnection(client2, createMockRequest('gemini'));
      expect(gateway.getSessionCount()).toBe(2);

      await gateway.handleDisconnect(client1);
      expect(gateway.getSessionCount()).toBe(1);
    });

    it('should report hasSession correctly', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('check-client');
      expect(gateway.hasSession('check-client')).toBe(false);

      await gateway.handleConnection(client, createMockRequest());
      expect(gateway.hasSession('check-client')).toBe(true);

      await gateway.handleDisconnect(client);
      expect(gateway.hasSession('check-client')).toBe(false);
    });
  });
});
