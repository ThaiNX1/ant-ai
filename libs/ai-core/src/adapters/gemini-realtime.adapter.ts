import * as WebSocket from 'ws';
import { IRealtimeAdapter } from '../interfaces/realtime.interface';
import {
  RealtimeSessionConfig,
  RealtimeResponse,
} from '../interfaces/realtime-types.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const TAG = '[GeminiRealtimeAdapter]';

/**
 * Gemini Live (Realtime) Adapter — bidirectional audio/text via WebSocket.
 * Docs: https://ai.google.dev/api/multimodal-live
 */
export class GeminiRealtimeAdapter implements IRealtimeAdapter {
  private ws: WebSocket | null = null;
  private responseQueue: RealtimeResponse[] = [];
  private waitResolve: ((value: void) => void) | null = null;
  private closed = false;

  constructor(private readonly config: AdapterConfig) {}

  async connect(sessionConfig: RealtimeSessionConfig): Promise<void> {
    const model = sessionConfig.model ?? this.config.model;
    const url = `${GEMINI_LIVE_URL}?key=${encodeURIComponent(this.config.apiKey)}`;

    console.log(`${TAG} Connecting to Gemini Live, model: models/${model}`);

    return new Promise<void>((resolve, reject) => {
      let resolved = false;
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log(`${TAG} WebSocket opened, sending setup...`);
        const setup = {
          setup: {
            model: `models/${model}`,
            generation_config: {
              response_modalities: ['AUDIO'],
              ...(sessionConfig.voice
                ? { speech_config: { voice_config: { prebuilt_voice_config: { voice_name: sessionConfig.voice } } } }
                : {}),
            },
            ...(sessionConfig.instructions
              ? { system_instruction: { parts: [{ text: sessionConfig.instructions }] } }
              : {}),
          },
        };
        console.log(`${TAG} Setup payload:`, JSON.stringify(setup));
        this.ws!.send(JSON.stringify(setup));
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        const raw = data.toString();
        console.log(`${TAG} Raw message from Gemini:`, raw.slice(0, 300));
        try {
          const parsed = JSON.parse(raw);

          if (parsed['setupComplete'] !== undefined) {
            console.log(`${TAG} setupComplete received — session ready`);
            resolved = true;
            resolve();
          }

          const response = this.mapResponse(parsed);
          if (response) {
            console.log(`${TAG} Queuing response type: ${response.type}`);
            this.responseQueue.push(response);
            if (this.waitResolve) {
              this.waitResolve();
              this.waitResolve = null;
            }
          }
        } catch {
          console.warn(`${TAG} Non-JSON message received:`, raw.slice(0, 100));
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`${TAG} WebSocket closed: code=${code} reason=${reason.toString()}`);
        this.closed = true;
        if (this.waitResolve) {
          this.waitResolve();
          this.waitResolve = null;
        }
        if (!resolved) {
          reject(
            new AdapterError(
              'WS_CLOSED',
              `Gemini Live connection closed before setup: ${code} ${reason.toString()}`,
              'gemini',
            ),
          );
        }
      });

      this.ws.on('error', (err: Error) => {
        console.error(`${TAG} WebSocket error:`, err.message);
        reject(this.wrapError(err));
      });
    });
  }

  feedAudio(audioChunk: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`${TAG} feedAudio: WebSocket not OPEN (state=${this.ws?.readyState}), dropping chunk`);
      return;
    }

    const b64 = audioChunk.toString('base64');
    console.log(`${TAG} feedAudio: sending ${audioChunk.length} bytes (base64 len=${b64.length})`);

    const event = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: b64,
          },
        ],
      },
    };
    this.ws.send(JSON.stringify(event));
    console.log(`${TAG} feedAudio: sent to Gemini`);
  }

  async *getResponseStream(): AsyncIterable<RealtimeResponse> {
    console.log(`${TAG} getResponseStream: starting`);
    while (!this.closed || this.responseQueue.length > 0) {
      if (this.responseQueue.length > 0) {
        const response = this.responseQueue.shift()!;
        console.log(`${TAG} getResponseStream: yielding type=${response.type}`);
        yield response;
      } else {
        await new Promise<void>((resolve) => {
          this.waitResolve = resolve;
        });
      }
    }
    console.log(`${TAG} getResponseStream: ended (closed=${this.closed})`);
  }

  async disconnect(): Promise<void> {
    console.log(`${TAG} disconnect called`);
    if (this.ws) {
      this.closed = true;
      this.ws.close();
      this.ws = null;
    }
  }

  private mapResponse(parsed: Record<string, unknown>): RealtimeResponse | null {
    if (parsed['setupComplete'] !== undefined) {
      return { type: 'session.ready', data: parsed['setupComplete'] };
    }

    if (parsed['serverContent']) {
      const content = parsed['serverContent'] as Record<string, unknown>;

      const parts = (content['modelTurn'] as Record<string, unknown> | undefined)?.['parts'];
      if (Array.isArray(parts)) {
        for (const part of parts) {
          const p = part as Record<string, unknown>;
          if (p['inlineData']) {
            const inline = p['inlineData'] as Record<string, unknown>;
            return { type: 'audio', data: inline['data'] };
          }
          if (p['text']) {
            return { type: 'transcript', data: p['text'] };
          }
        }
      }

      if (content['turnComplete']) {
        return { type: 'turn.complete', data: null };
      }
    }

    if (parsed['toolCall']) {
      return { type: 'tool_call', data: parsed['toolCall'] };
    }

    return { type: 'unknown', data: parsed };
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown Gemini Realtime error';
    const code =
      (error as { code?: string })?.code ?? 'GEMINI_REALTIME_ERROR';
    return new AdapterError(code, message, 'gemini');
  }
}
