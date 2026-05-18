import { TelemetryTopic, TelemetryEnvelope } from './schemas';

type Handler<T = any> = (envelope: TelemetryEnvelope<T>) => void;

/**
 * Enterprise Telemetry Bus
 * Supports pub/sub architecture for real-time cyber telemetry
 */
class TelemetryBus {
  private handlers: Map<string, Set<Handler>> = new Map();
  private history: TelemetryEnvelope[] = [];
  private readonly MAX_HISTORY = 1000;

  subscribe<T>(topic: TelemetryTopic | '*', handler: Handler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);

    return () => {
      this.handlers.get(topic)?.delete(handler);
    };
  }

  publish<T>(topic: TelemetryTopic, payload: T): void {
    const envelope: TelemetryEnvelope<T> = {
      topic,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      }
    };

    // Store for replay/history
    this.history.push(envelope);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }

    // Direct topic handlers
    this.handlers.get(topic)?.forEach(h => {
      setTimeout(() => h(envelope), 0);
    });
    
    // Wildcard handlers
    this.handlers.get('*')?.forEach(h => {
      setTimeout(() => h(envelope), 0);
    });

    // For debugging/dev
    if (process.env.NODE_ENV !== 'production') {
      // console.log(`[Telemetry] ${topic}:`, payload);
    }
  }

  getHistory(): TelemetryEnvelope[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const telemetryBus = new TelemetryBus();
