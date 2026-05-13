import axios, { AxiosError } from 'axios';
import * as WebSocket from 'ws';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const MINIMAX_T2A_URL = 'https://api.minimax.io/v1/t2a_v2';
const MINIMAX_WS_URL = 'wss://api.minimax.io/ws/v1/t2a_v2';
const DEFAULT_VOICE_ID = 'male-qn-qingse';
const DEFAULT_MODEL = 'speech-02-turbo';

interface MinimaxVoiceSetting {
  voice_id: string;
  speed: number;
  vol: number;
  pitch: number;
}

interface MinimaxAudioSetting {
  sample_rate: number;
  bitrate: number;
  format: string;
  channel: number;
}

interface MinimaxT2aRequest {
  model: string;
  text: string;
  stream: boolean;
  voice_setting: MinimaxVoiceSetting;
  audio_setting: MinimaxAudioSetting;
  output_format: 'hex' | 'url';
}

interface MinimaxT2aResponse {
  data: { audio: string; status: number } | null;
  trace_id: string;
  base_resp: { status_code: number; status_msg: string };
}

/**
 * MiniMax TTS Adapter — MiniMax T2A v2 HTTP (synthesize) & WebSocket (streamSynthesize).
 * MiniMax does not provide a dedicated TTS SDK; integration is via direct REST/WS API.
 * Docs: https://platform.minimax.io/docs/api-reference/speech-t2a-intro
 */
export class MinimaxTtsAdapter implements ITtsAdapter {
  private readonly model: string;

  constructor(private readonly config: AdapterConfig) {
    this.model = config.model ?? DEFAULT_MODEL;
  }

  // ---------------------------------------------------------------------------
  // synthesize — HTTP POST /v1/t2a_v2, returns hex-decoded audio Buffer
  // ---------------------------------------------------------------------------
  async synthesize(text: string, options?: TtsOptions): Promise<Buffer> {
    const body: MinimaxT2aRequest = {
      model: this.model,
      text,
      stream: false,
      voice_setting: this.buildVoiceSetting(options),
      audio_setting: this.buildAudioSetting(options),
      output_format: 'hex',
    };

    let data: MinimaxT2aResponse;
    try {
      const res = await axios.post<MinimaxT2aResponse>(MINIMAX_T2A_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
      data = res.data;
    } catch (error: unknown) {
      throw this.wrapAxiosError(error);
    }

    if (data.base_resp.status_code !== 0) {
      throw new AdapterError(
        `MINIMAX_${data.base_resp.status_code}`,
        data.base_resp.status_msg,
        'minimax',
      );
    }

    if (!data.data?.audio) {
      throw new AdapterError('EMPTY_AUDIO', 'MiniMax returned empty audio data', 'minimax');
    }

    return Buffer.from(data.data.audio, 'hex');
  }

  // ---------------------------------------------------------------------------
  // streamSynthesize — WebSocket wss://api.minimax.io/ws/v1/t2a_v2
  // Protocol: connected_success → task_start → task_started → task_continue
  //           → task_finish → audio chunks with is_final flag
  // ---------------------------------------------------------------------------
  async *streamSynthesize(text: string, options?: TtsOptions): AsyncIterable<Buffer> {
    const ws = new WebSocket(MINIMAX_WS_URL, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });

    yield* this.runWsStream(ws, text, options);
  }

  private async *runWsStream(
    ws: WebSocket,
    text: string,
    options?: TtsOptions,
  ): AsyncIterable<Buffer> {
    // Simple async queue bridging WS events → async iteration
    const queue: Array<Buffer | Error | null> = [];
    let notify: (() => void) | null = null;

    const enqueue = (item: Buffer | Error | null) => {
      queue.push(item);
      notify?.();
      notify = null;
    };

    const drain = () =>
      new Promise<void>((resolve) => {
        if (queue.length > 0) resolve();
        else notify = resolve;
      });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        const event = msg['event'] as string | undefined;
        console.log('========event_minimax========', event)
        if (event === 'connected_success') {
          // ws.send(
          //   JSON.stringify({
          //     event: 'task_start',
          //     model: this.model,
          //     voice_setting: this.buildVoiceSetting(options),
          //     audio_setting: this.buildAudioSetting(options),
          //   }),
          // );
          return;
        }

        if (event === 'task_started') {
          // ws.send(JSON.stringify({ event: 'task_continue', text }));
          // ws.send(JSON.stringify({ event: 'task_finish' }));
          return;
        }

        if (event === 'task_failed') {
          // enqueue(new AdapterError('TASK_FAILED', JSON.stringify(msg), 'minimax'));
          return;
        }

        const audio = (msg['data'] as Record<string, unknown> | undefined)?.['audio'] as
          | string
          | undefined;
        if (audio) enqueue(Buffer.from(audio, 'hex'));

        if (msg['is_final']) enqueue(null);
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('error', (err: Error) =>
      enqueue(new AdapterError('WS_ERROR', err.message, 'minimax')),
    );

    ws.on('close', () => enqueue(null));

    try {
      while (true) {
        await drain();
        while (queue.length > 0) {
          const item = queue.shift()!;
          if (item === null) return;
          if (item instanceof Error) throw item;
          yield item;
        }
      }
    } finally {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private buildVoiceSetting(options?: TtsOptions): MinimaxVoiceSetting {
    return {
      voice_id: options?.voiceId ?? DEFAULT_VOICE_ID,
      speed: options?.speed ?? 1.0,
      vol: (options?.['volume'] as number) ?? 1.0,
      pitch: options?.pitch ?? 0,
    };
  }

  private buildAudioSetting(options?: TtsOptions): MinimaxAudioSetting {
    return {
      sample_rate: (options?.['sampleRate'] as number) ?? 32000,
      bitrate: (options?.['bitrate'] as number) ?? 128000,
      format: options?.format ?? 'mp3',
      channel: 1,
    };
  }

  private wrapAxiosError(error: unknown): AdapterError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const code = status ? `HTTP_${status}` : 'NETWORK_ERROR';
      const message = (error.response?.data as { message?: string })?.message ?? error.message;
      return new AdapterError(code, message, 'minimax');
    }
    const message = error instanceof Error ? error.message : 'Unknown MiniMax error';
    return new AdapterError('NETWORK_ERROR', message, 'minimax');
  }
}
