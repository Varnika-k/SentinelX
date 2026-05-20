import { redisManager } from './redis';
import { logger } from './logger';
import { TelemetryEnvelope } from '../schemas/telemetry';
import { EventEmitter } from 'events';

export type EventCallback = (payload: any) => void | Promise<void>;

class EventBus extends EventEmitter {
  private static instance: EventBus;
  private subscriptions: Map<string, Set<EventCallback>> = new Map();

  private constructor() {
    super();
    this.initSubscriber();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  private initSubscriber() {
    const sub = redisManager.getSubscriber();
    if (sub) {
      sub.on('message', (channel, message) => {
        try {
          const envelope: TelemetryEnvelope = JSON.parse(message);
          this.localDispatch(channel, envelope.payload);
        } catch (error) {
          logger.error(`Failed to parse Redis message on channel ${channel}`, error);
        }
      });
    }
  }

  private localDispatch(topic: string, payload: any) {
    const callbacks = this.subscriptions.get(topic);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          logger.error(`Error in event callback for topic ${topic}`, err);
        }
      });
    }
  }

  public async publish(topic: string, payload: any) {
    const client = redisManager.getClient();
    const envelope: TelemetryEnvelope = {
      topic,
      payload,
      timestamp: new Date().toISOString()
    };

    if (redisManager.getIsMock() || !client) {
      // Direct local dispatch if Redis is down/mock
      this.localDispatch(topic, payload);
      return;
    }

    try {
      await client.publish(topic, JSON.stringify(envelope));
    } catch (error) {
      logger.error(`Redis publish failed for topic ${topic}`, error);
      // Fallback to local dispatch
      this.localDispatch(topic, payload);
    }
  }

  public async subscribe(topic: string, callback: EventCallback) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      
      const sub = redisManager.getSubscriber();
      if (sub && !redisManager.getIsMock()) {
        try {
          await sub.subscribe(topic);
          logger.info(`Subscribed to global Redis channel: ${topic}`);
        } catch (error) {
          logger.error(`Redis subscribe failed for topic ${topic}`, error);
        }
      }
    }
    
    this.subscriptions.get(topic)!.add(callback);
  }

  public async unsubscribe(topic: string, callback: EventCallback) {
    const callbacks = this.subscriptions.get(topic);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(topic);
        const sub = redisManager.getSubscriber();
        if (sub && !redisManager.getIsMock()) {
          await sub.unsubscribe(topic);
        }
      }
    }
  }

  /**
   * Distributed Queue Support using Redis Lists (simplified)
   */
  public async enqueue(queueName: string, data: any) {
    const client = redisManager.getClient();
    if (!client || redisManager.getIsMock()) {
      // Fallback to background immediate processing
      setImmediate(() => this.emit(`queue:${queueName}`, data));
      return;
    }

    try {
      await client.lpush(`queue:${queueName}`, JSON.stringify(data));
    } catch (error) {
      logger.error(`Queue enqueue failed for ${queueName}`, error);
    }
  }
}

export const eventBus = EventBus.getInstance();
