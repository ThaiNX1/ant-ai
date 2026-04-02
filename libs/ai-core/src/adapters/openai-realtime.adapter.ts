import * as WebSocket from 'ws';
import { IRealtimeAdapter } from '../interfaces/realtime.interface';
import {
  RealtimeSessionConfig,
  RealtimeResponse,
} from '../interfaces/realtime-types.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';

/**
 * OpenAI Realtime Adapter — uses ws WebSocket to connect to OpenAI Realtime API.
 */
export class OpenAiRealtimeAdapter implements IRealtimeAdapter {
  private ws: WebSocket | null = null;
  private responseQueue: RealtimeResponse[] = [];
  private waitResolve: ((value: void) => void) | null = null;
  private closed = false;

  constructor(private readonly config: AdapterConfig) {}

  async connect(sessionConfig: RealtimeSessionConfig): Promise<void> {
    const model = sessionConfig.model ?? this.config.model;
    const url = `${OPENAI_REALTIME_URL}?model=${encodeURIComponent(model)}`;

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      this.ws.on('open', () => {
        // Send session.update with config
        const sessionUpdate = {
          type: 'session.update',
          session: {
            voice: sessionConfig.voice,
            instructions: sessionConfig.instructions,
          },
        };
        this.ws!.send(JSON.stringify(sessionUpdate));
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.responseQueue.push({
            type: parsed.type ?? 'unknown',
            data: parsed,
          });
          if (this.waitResolve) {
            this.waitResolve();
            this.waitResolve = null;
          }
        } catch {
          // ignore non-JSON messages
        }
      });

      this.ws.on('close', () => {
        this.closed = true;
        if (this.waitResolve) {
          this.waitResolve();
          this.waitResolve = null;
        }
      });

      this.ws.on('error', (err: Error) => {
        const adapterErr = this.wrapError(err);
        reject(adapterErr);
      });
    });
  }

  feedAudio(audioChunk: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new AdapterError(
        'WS_NOT_CONNECTED',
        'WebSocket is not connected',
        'openai',
      );
    }

    const event = {
      type: 'input_audio_buffer.append',
      audio: audioChunk.toString('base64'),
    };
    this.ws.send(JSON.stringify(event));
  }

  async *getResponseStream(): AsyncIterable<RealtimeResponse> {
    while (!this.closed || this.responseQueue.length > 0) {
      if (this.responseQueue.length > 0) {
        yield this.responseQueue.shift()!;
      } else {
        await new Promise<void>((resolve) => {
          this.waitResolve = resolve;
        });
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.closed = true;
      this.ws.close();
      this.ws = null;
    }
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown OpenAI Realtime error';
    const code =
      (error as { code?: string })?.code ?? 'OPENAI_REALTIME_ERROR';
    return new AdapterError(code, message, 'openai');
  }
}
