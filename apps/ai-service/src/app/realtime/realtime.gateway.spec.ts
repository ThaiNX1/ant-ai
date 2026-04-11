import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeGateway, REALTIME_CONFIG } from './realtime.gateway';
import { AdapterFactory } from '@ai-platform/ai-core';
import * as WebSocket from 'ws';

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

function createMockAdapter() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    feedAudio: jest.fn(),
    getResponseStream: jest.fn().mockReturnValue((async function* () {})()),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  const mockConfig = {
    provider: 'openai',
    model: 'gpt-4o-realtime-preview',
    apiKey: 'test-key',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: REALTIME_CONFIG, useValue: mockConfig },
        RealtimeGateway,
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  describe('handleConnection', () => {
    it('should create a session for a new client', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient();
      await gateway.handleConnection(client);

      expect(AdapterFactory.createRealtime).toHaveBeenCalledWith(mockConfig);
      expect(mockAdapter.connect).toHaveBeenCalledWith({
        model: 'gpt-4o-realtime-preview',
      });
      expect(gateway.getSessionCount()).toBe(1);
    });

    it('should assign a unique client ID if not present', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient();
      await gateway.handleConnection(client);

      expect(client.id).toBeDefined();
      expect(client.id).toMatch(/^client_/);
    });

    it('should close client on connection failure', async () => {
      (AdapterFactory.createRealtime as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const client = createMockClient();
      await gateway.handleConnection(client);

      expect(client.close).toHaveBeenCalledWith(
        1011,
        'Failed to create realtime session',
      );
      expect(gateway.getSessionCount()).toBe(0);
    });
  });

  describe('handleDisconnect', () => {
    it('should cleanup session on disconnect', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('test-client');
      await gateway.handleConnection(client);
      expect(gateway.getSessionCount()).toBe(1);

      await gateway.handleDisconnect(client);

      expect(mockAdapter.disconnect).toHaveBeenCalled();
      expect(gateway.getSessionCount()).toBe(0);
    });

    it('should handle disconnect for unknown client gracefully', async () => {
      const client = createMockClient('unknown-client');
      await expect(gateway.handleDisconnect(client)).resolves.not.toThrow();
      expect(gateway.getSessionCount()).toBe(0);
    });
  });

  describe('handleAudio', () => {
    it('should feed audio to the session adapter', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('audio-client');
      await gateway.handleConnection(client);

      const audioData = Buffer.from([0x01, 0x02, 0x03]);
      gateway.handleAudio(audioData, client);

      expect(mockAdapter.feedAudio).toHaveBeenCalledWith(audioData);
    });

    it('should not feed audio if no session exists', async () => {
      const client = createMockClient('no-session');
      const audioData = Buffer.from([0x01]);

      expect(() => gateway.handleAudio(audioData, client)).not.toThrow();
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
        (async function* () {
          for (const r of responses) yield r;
        })(),
      );
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('forward-client');
      await gateway.handleConnection(client);

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

      await gateway.handleConnection(client1);
      expect(gateway.getSessionCount()).toBe(1);

      await gateway.handleConnection(client2);
      expect(gateway.getSessionCount()).toBe(2);

      await gateway.handleDisconnect(client1);
      expect(gateway.getSessionCount()).toBe(1);
    });

    it('should report hasSession correctly', async () => {
      const mockAdapter = createMockAdapter();
      (AdapterFactory.createRealtime as jest.Mock).mockReturnValue(mockAdapter);

      const client = createMockClient('check-client');
      expect(gateway.hasSession('check-client')).toBe(false);

      await gateway.handleConnection(client);
      expect(gateway.hasSession('check-client')).toBe(true);

      await gateway.handleDisconnect(client);
      expect(gateway.hasSession('check-client')).toBe(false);
    });
  });
});
