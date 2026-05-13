import { Inject, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { AdapterFactory, configToken } from '@ai-platform/ai-core';
import type { ISttStreamAdapter, SttStreamOptions, NamedAdapterConfig } from '@ai-platform/ai-core';
import { IncomingMessage } from 'http';

type WsClient = WebSocket & { id?: string };

/**
 * WebSocket gateway for streaming STT at path /stt-stream.
 *
 * Client protocol:
 *   → JSON  {"event":"start","data":{"language":"vi","model":"nova-3"}}
 *   → binary PCM audio chunks (16kHz, 16-bit, mono)
 *   ← JSON  {"event":"transcript","data":{type,transcript,confidence,timestamp}}
 *   ← JSON  {"event":"error","data":{"message":"..."}}
 *   ← JSON  {"event":"done","data":{"message":"..."}}
 *   ← JSON  {"event":"ready","data":{"message":"..."}}
 */
@WebSocketGateway({ path: '/stt-stream' })
export class SttStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SttStreamGateway.name);
  private readonly sessions = new Map<string, ISttStreamAdapter>();

  @WebSocketServer()
  server!: WebSocket.Server;

  constructor(
    @Inject(configToken('STT', 'deepgram'))
    private readonly deepgramConfig: NamedAdapterConfig,
  ) {}

  private getClientId(client: WsClient): string {
    if (!client.id) {
      client.id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    return client.id;
  }

  private sendEvent(client: WsClient, event: string, data: unknown): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  }

  async handleConnection(client: WsClient, req: IncomingMessage): Promise<void> {
    const clientId = this.getClientId(client);

    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const provider = url.searchParams.get('provider') || 'deepgram';

    this.logger.log(`Client connected: ${clientId} (provider: ${provider})`);

    try {
      const config = {
        provider,
        model: this.deepgramConfig.model,
        apiKey: this.deepgramConfig.apiKey,
      };

      this.logger.log(`Deepgram connecting with apiKey: ${config.apiKey ? '***' + config.apiKey.slice(-4) : 'EMPTY'}`);

      const adapter = AdapterFactory.createSttStream(config);

      // Register transcript callback — wrap in {event, data} format
      adapter.onTranscript((transcriptEvent) => {
        if (transcriptEvent.type === 'error') {
          this.logger.error(`Adapter error for ${clientId}: ${transcriptEvent.message}`);
          this.sendEvent(client, 'error', {
            message: transcriptEvent.message || 'STT adapter error',
          });
          return;
        }

        this.sendEvent(client, 'transcript', transcriptEvent);
      });

      this.sessions.set(clientId, adapter);

      // Handle all messages (JSON control + binary audio)
      client.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
        if (isBinary) {
          const session = this.sessions.get(clientId);
          if (session) {
            session.sendAudio(Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer));
          }
          return;
        }

        this.handleJsonMessage(clientId, client, data.toString());
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create STT session for ${clientId}: ${message}`);
      this.sendEvent(client, 'error', { message: 'Failed to create STT stream session' });
      client.close(1011, 'Failed to create STT stream session');
    }
  }

  private handleJsonMessage(clientId: string, client: WsClient, raw: string): void {
    try {
      const parsed = JSON.parse(raw);
      const event = parsed.event as string;
      const data = parsed.data as Record<string, unknown> | undefined;

      switch (event) {
        case 'start':
          this.handleStartEvent(clientId, client, data);
          break;
        case 'stop':
          this.handleStopEvent(clientId, client);
          break;
        default:
          this.logger.warn(`Unknown event "${event}" from ${clientId}`);
          break;
      }
    } catch {
      this.logger.warn(`Invalid JSON from ${clientId}: ${raw.slice(0, 100)}`);
    }
  }

  private handleStartEvent(
    clientId: string,
    client: WsClient,
    data?: Record<string, unknown>,
  ): void {
    const adapter = this.sessions.get(clientId);
    if (!adapter) {
      this.sendEvent(client, 'error', { message: 'No adapter session found' });
      return;
    }

    const options: SttStreamOptions = {};
    if (data?.language) options.language = data.language as string;
    if (data?.model) options.model = data.model as string;

    adapter.connect(options).then(() => {
      this.logger.log(`STT adapter connected for ${clientId} (lang=${data?.language}, model=${data?.model})`);
      this.sendEvent(client, 'ready', { message: 'STT stream ready' });
    }).catch((err: Error) => {
      this.logger.error(`Failed to connect adapter for ${clientId}: ${err.message}`);
      this.sendEvent(client, 'error', { message: err.message });
    });
  }

  private handleStopEvent(clientId: string, client: WsClient): void {
    const adapter = this.sessions.get(clientId);
    if (adapter) {
      adapter.close().then(() => {
        this.sendEvent(client, 'done', { message: 'STT stream stopped' });
        this.sessions.delete(clientId);
      }).catch((err: Error) => {
        this.logger.error(`Error stopping adapter for ${clientId}: ${err.message}`);
      });
    }
  }

  async handleDisconnect(client: WsClient): Promise<void> {
    const clientId = this.getClientId(client);
    this.logger.log(`Client disconnected: ${clientId}`);
    await this.cleanupSession(clientId);
  }

  private async cleanupSession(clientId: string): Promise<void> {
    const adapter = this.sessions.get(clientId);
    if (adapter) {
      try {
        await adapter.close();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error closing adapter for ${clientId}: ${msg}`);
      }
      this.sessions.delete(clientId);
    }
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  hasSession(clientId: string): boolean {
    return this.sessions.has(clientId);
  }
}
