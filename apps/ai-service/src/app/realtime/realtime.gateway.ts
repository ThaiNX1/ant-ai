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
import {
  RealtimeVoiceService,
  AdapterFactory,
} from '@ai-platform/ai-core';
import type { AdapterConfig, RealtimeSessionConfig } from '@ai-platform/ai-core';

interface ClientSession {
  service: RealtimeVoiceService;
  connected: boolean;
}

export const REALTIME_CONFIG = Symbol('REALTIME_CONFIG');

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
    @Inject(REALTIME_CONFIG)
    private readonly realtimeConfig: AdapterConfig,
  ) {}

  private getClientId(client: WsClient): string {
    if (!client.id) {
      client.id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    return client.id;
  }

  async handleConnection(client: WsClient): Promise<void> {
    const clientId = this.getClientId(client);
    this.logger.log(`Client connected: ${clientId}`);

    try {
      const adapter = AdapterFactory.createRealtime(this.realtimeConfig);
      const service = new RealtimeVoiceService(adapter);

      const sessionConfig: RealtimeSessionConfig = {
        model: this.realtimeConfig.model,
      };

      await service.connect(sessionConfig);

      this.sessions.set(clientId, { service, connected: true });

      this.forwardResponses(clientId, client, service);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to create session for client ${clientId}: ${message}`,
      );
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

    session.service.feedAudio(data);
  }

  private async forwardResponses(
    clientId: string,
    client: WsClient,
    service: RealtimeVoiceService,
  ): Promise<void> {
    try {
      for await (const response of service.getResponseStream()) {
        if (!this.sessions.has(clientId)) break;

        const payload = JSON.stringify(response);
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error forwarding responses for client ${clientId}: ${msg}`,
      );
      await this.cleanupSession(clientId);
    }
  }

  private async cleanupSession(clientId: string): Promise<void> {
    const session = this.sessions.get(clientId);
    if (session) {
      session.connected = false;
      try {
        await session.service.disconnect();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Error disconnecting session for client ${clientId}: ${msg}`,
        );
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
