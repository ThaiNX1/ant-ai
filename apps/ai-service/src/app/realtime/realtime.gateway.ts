import { Inject, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { AdapterFactory, IRealtimeAdapter } from '@ai-platform/ai-core';
import type { NamedAdapterConfig, RealtimeSessionConfig } from '@ai-platform/ai-core';
import { IncomingMessage } from 'http';

export const REALTIME_CONFIGS = 'REALTIME_CONFIGS';

interface ClientSession {
  adapter: IRealtimeAdapter;
  connected: boolean;
}

type WsClient = WebSocket & { id?: string };

@WebSocketGateway({ path: '/realtime' })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly sessions = new Map<string, ClientSession>();

  @WebSocketServer()
  server!: WebSocket.Server;

  constructor(
    @Inject(REALTIME_CONFIGS)
    private readonly realtimeConfigs: NamedAdapterConfig[],
  ) {}

  private getClientId(client: WsClient): string {
    if (!client.id) {
      client.id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    return client.id;
  }

  private getConfig(provider: string): NamedAdapterConfig {
    const config = this.realtimeConfigs.find((c) => c.provider === provider);
    if (!config) {
      const available = this.realtimeConfigs.map((c) => c.provider).join(', ');
      throw new Error(
        `Unknown realtime provider: "${provider}". Available: ${available}`,
      );
    }
    return config;
  }

  async handleConnection(client: WsClient, req: IncomingMessage): Promise<void> {
    const clientId = this.getClientId(client);

    // Parse provider from query string: ws://host/realtime?provider=gemini
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const provider = url.searchParams.get('provider') || 'openai';

    this.logger.log(`Client connected: ${clientId} (provider: ${provider})`);

    try {
      const config = this.getConfig(provider);
      const adapter = AdapterFactory.createRealtime(config);

      const sessionConfig: RealtimeSessionConfig = {
        model: config.model,
      };

      await adapter.connect(sessionConfig);
      this.sessions.set(clientId, { adapter, connected: true });
      this.forwardResponses(clientId, client, adapter);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create session for ${clientId}: ${message}`);
      client.close(1011, 'Failed to create realtime session');
    }
  }

  async handleDisconnect(client: WsClient): Promise<void> {
    const clientId = this.getClientId(client);
    this.logger.log(`Client disconnected: ${clientId}`);
    await this.cleanupSession(clientId);
  }

  @SubscribeMessage('audio')
  handleAudio(
    @MessageBody() data: Buffer,
    @ConnectedSocket() client: WsClient,
  ): void {
    const clientId = this.getClientId(client);
    const session = this.sessions.get(clientId);

    if (!session || !session.connected) {
      this.logger.warn(`No active session for client ${clientId}`);
      return;
    }

    session.adapter.feedAudio(data);
  }

  private async forwardResponses(
    clientId: string,
    client: WsClient,
    adapter: IRealtimeAdapter,
  ): Promise<void> {
    try {
      for await (const response of adapter.getResponseStream()) {
        if (!this.sessions.has(clientId)) break;
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(response));
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error forwarding for ${clientId}: ${msg}`);
      await this.cleanupSession(clientId);
    }
  }

  private async cleanupSession(clientId: string): Promise<void> {
    const session = this.sessions.get(clientId);
    if (session) {
      session.connected = false;
      try {
        await session.adapter.disconnect();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error disconnecting ${clientId}: ${msg}`);
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
