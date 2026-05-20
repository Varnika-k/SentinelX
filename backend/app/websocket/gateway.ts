import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { logger } from '../core/logger';
import { TelemetryEnvelope, TelemetryEvent } from '../schemas/telemetry';
import { eventBus } from '../core/event-bus';

export class WebSocketGateway {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.init();
    this.setupEventSubscriptions();
  }

  private init() {
    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    logger.info('Scalable WebSocket Gateway Initialized');
  }

  private setupEventSubscriptions() {
    // Subscribe to all relevant telemetry topics for real-time fan-out
    const topics = [
      'attack:alert', 
      'node:update', 
      'defense:action', 
      'system:log', 
      'telemetry:alert',
      'telemetry:event:*'
    ];

    topics.forEach(topic => {
      eventBus.subscribe(topic, (payload) => {
        this.broadcast(topic, payload);
      });
    });

    logger.info('Gateway subscribed to distributed event streams');
  }

  private handleConnection(ws: WebSocket) {
    this.clients.add(ws);
    logger.info('New client connected', { totalClients: this.clients.size });

    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info('Client disconnected', { totalClients: this.clients.size });
    });

    ws.on('error', (err) => {
      logger.error('WebSocket client error', err);
    });

    // Send initial handshake
    this.send(ws, 'system:log', {
      source: 'backend:gateway',
      message: 'Connection verified. Streaming telemetry...',
      severity: 'low'
    });
  }

  public broadcast(topic: string, payload: any) {
    const envelope: TelemetryEnvelope = {
      topic,
      payload,
      timestamp: new Date().toISOString()
    };

    const message = JSON.stringify(envelope);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private send(ws: WebSocket, topic: string, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      const envelope: TelemetryEnvelope = {
        topic,
        payload,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(envelope));
    }
  }
}
