import { OpenAiRealtimeAdapter } from './openai-realtime.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

// Mock ws
jest.mock('ws', () => {
  const EventEmitter = require('events');

  class MockWebSocket extends EventEmitter {
    static OPEN = 1;
    readyState = 1; // OPEN
    send = jest.fn();
    close = jest.fn();

    constructor() {
      super();
      // Simulate async open
      setTimeout(() => this.emit('open'), 0);
    }
  }

  return { __esModule: true, default: MockWebSocket, ...MockWebSocket };
});

describe('OpenAiRealtimeAdapter', () => {
  const config: AdapterConfig = {
    provider: 'openai',
    model: 'gpt-4o-realtime-preview',
    apiKey: 'test-key',
  };

  describe('feedAudio', () => {
    it('should throw AdapterError when not connected', () => {
      const adapter = new OpenAiRealtimeAdapter(config);
      expect(() => adapter.feedAudio(Buffer.from('audio'))).toThrow(
        AdapterError,
      );
      expect(() => adapter.feedAudio(Buffer.from('audio'))).toThrow(
        'WebSocket is not connected',
      );
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when not connected', async () => {
      const adapter = new OpenAiRealtimeAdapter(config);
      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });
  });
});
