import { Inject, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { ITtsAdapter, namedToken } from '@ai-platform/ai-core';

interface SynthesizeMessage {
  text: string;
  voiceId?: string;
  speed?: number;
  pitch?: number;
  format?: string;
  volume?: number;
  sampleRate?: number;
}

/**
 * TTS Stream Gateway — streams audio chunks to client over WebSocket.
 *
 * Protocol:
 *   Client → { event: 'synthesize', text: '...', voiceId?: '...', ... }
 *   Server → binary Buffer chunks (audio/mpeg)
 *   Server → { event: 'done' }          (stream complete)
 *   Server → { event: 'error', message } (on failure)
 */
@WebSocketGateway({ path: '/tts-stream' })
export class TtsStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TtsStreamGateway.name);

  @WebSocketServer()
  server!: WebSocket.Server;

  constructor(
    @Inject(namedToken('TTS', 'minimax'))
    private readonly minimaxTts: ITtsAdapter,
    @Inject(namedToken('TTS', 'google-tts'))
    private readonly googleTts: ITtsAdapter,
  ) {}

  handleConnection(client: WebSocket): void {
    this.logger.log('TTS client connected');
  }

  handleDisconnect(client: WebSocket): void {
    this.logger.log('TTS client disconnected');
  }

  @SubscribeMessage('synthesize')
  async handleSynthesize(
    @MessageBody() data: SynthesizeMessage,
    @ConnectedSocket() client: WebSocket,
  ): Promise<void> {
    if (!data?.text) {
      client.send(JSON.stringify({ event: 'error', message: 'text is required' }), { binary: false });
      return;
    }

    const options = {
      ...(data.voiceId && { voiceId: data.voiceId }),
      ...(data.speed !== undefined && { speed: data.speed }),
      ...(data.pitch !== undefined && { pitch: data.pitch }),
      ...(data.format && { format: data.format }),
      ...(data.volume !== undefined && { volume: data.volume }),
      ...(data.sampleRate !== undefined && { sampleRate: data.sampleRate }),
    };

    try {
      const adapter = this.minimaxTts; // default to minimax, can be param-driven
      for await (const chunk of adapter.streamSynthesize(data.text, options)) {
        if (client.readyState !== WebSocket.OPEN) break;
        client.send(chunk, { binary: true }); // binary Buffer
      }

      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: 'done' }), { binary: false });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'TTS stream error';
      this.logger.error(`TTS stream error: ${message}`);
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: 'error', message }), { binary: false });
      }
    }
  }
}
