import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { logger } from '../core/logger';
import { TelemetryEnvelope, TelemetryEvent } from '../schemas/telemetry';
import { eventBus } from '../core/event-bus';
import { DatabaseService } from '../db/service';

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

    ws.on('message', async (data) => {
      try {
        const rawJson = data.toString();
        const msg = JSON.parse(rawJson);
        if (msg.action === 'sync' && msg.since) {
          const sinceDate = new Date(msg.since);
          if (!isNaN(sinceDate.getTime())) {
            logger.info(`Client requested telemetry sync since: ${msg.since}`);
            // Fetch missed events via database service with a safe maximum limit of 80
            const missed = await DatabaseService.getEventsInRange(sinceDate, new Date(), 80);
            logger.info(`Found ${missed.length} missed events for client synchronization`);
            for (const ev of missed) {
              const envelope: TelemetryEnvelope = {
                topic: ev.type,
                payload: {
                  _isSync: true,
                  id: ev.id,
                  nodeId: ev.nodeId,
                  message: ev.message,
                  severity: ev.severity,
                  timestamp: ev.timestamp,
                  payload: ev.payload
                },
                timestamp: ev.timestamp ? ev.timestamp.toISOString() : new Date().toISOString()
              };
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(envelope));
              }
            }
          }
        }
      } catch (err) {
        logger.error('Error handling client message in websocket gateway', err);
      }
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
        // High frequency system logs backpressure mitigation
        if (client.bufferedAmount > 1024 * 1024) { // 1MB buffer full
          if (topic === 'system:log') {
            // Drop low-urgency system logs under congested buffers to safeguard state channel
            return;
          }
        }
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
