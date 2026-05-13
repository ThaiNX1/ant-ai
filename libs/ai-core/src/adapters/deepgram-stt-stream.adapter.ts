import * as WebSocket from 'ws';
import { ISttStreamAdapter, SttStreamOptions, TranscriptCallback, TranscriptEvent } from '../interfaces/stt-stream.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

/**
 * Deepgram Streaming STT Adapter — real-time transcription via WebSocket API.
 * Connects to Deepgram's WSS endpoint and streams PCM audio for live transcription.
 */
export class DeepgramSttStreamAdapter implements ISttStreamAdapter {
  private ws: WebSocket | null = null;
  private callback: TranscriptCallback | null = null;

  constructor(private readonly config: AdapterConfig) { }

  async connect(options?: SttStreamOptions): Promise<void> {
    const url = this.buildUrl(options);

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Token ${this.config.apiKey}`,
        },
      });
      this.ws.on('open', () => {
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (err: Error) => {
        const adapterError = new AdapterError(
          'WS_ERROR',
          err.message,
          'deepgram',
        );
        reject(adapterError);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        if (code !== 1000) {
          this.callback?.({
            type: 'error',
            transcript: '',
            confidence: 0,
            timestamp: new Date().toISOString(),
            message: `WebSocket closed unexpectedly: code=${code} reason=${reason.toString()}`,
          });
        }
        this.ws = null;
      });
    });
  }

  sendAudio(chunk: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }
    this.ws.send(chunk);
  }

  onTranscript(callback: TranscriptCallback): void {
    this.callback = callback;
  }

  async close(): Promise<void> {
    if (!this.ws) {
      return;
    }

    return new Promise<void>((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'CloseStream' }));
        this.ws.once('close', () => {
          this.ws = null;
          resolve();
        });
        this.ws.close();
      } else {
        this.ws = null;
        resolve();
      }
    });
  }

  private buildUrl(options?: SttStreamOptions): string {
    const url = new URL(DEEPGRAM_WS_URL);
    url.searchParams.set('model', options?.model || this.config.model || 'nova-3');
    url.searchParams.set('encoding', options?.encoding || 'linear16');
    url.searchParams.set('sample_rate', String(options?.sampleRate ?? 16000));
    url.searchParams.set('interim_results', String(options?.interimResults ?? true));
    url.searchParams.set('punctuate', String(options?.punctuate ?? true));

    if (options?.endpointing !== undefined) {
      url.searchParams.set('endpointing', String(options.endpointing));
    } else {
      url.searchParams.set('endpointing', '10');
    }

    if (options?.language) {
      url.searchParams.set('language', options.language);
    }

    return url.toString();
  }

  private handleMessage(data: WebSocket.RawData): void {
    if (!this.callback) return;

    try {
      const message = JSON.parse(data.toString());
      console.log('handleMessage', message);

      if (message.type === 'Results') {
        const transcript = message.channel?.alternatives?.[0]?.transcript ?? '';
        const confidence = message.channel?.alternatives?.[0]?.confidence ?? 0;

        const event: TranscriptEvent = {
          type: this.mapEventType(message.is_final, message.speech_final),
          transcript,
          confidence,
          timestamp: new Date().toISOString(),
        };

        this.callback(event);
      }
    } catch {
      this.callback({
        type: 'error',
        transcript: '',
        confidence: 0,
        timestamp: new Date().toISOString(),
        message: 'Failed to parse Deepgram message',
      });
    }
  }

  private mapEventType(isFinal: boolean, speechFinal: boolean): TranscriptEvent['type'] {
    if (!isFinal) return 'partial';
    if (speechFinal) return 'speech_final';
    return 'final';
  }
}
