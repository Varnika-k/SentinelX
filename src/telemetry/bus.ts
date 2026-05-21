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

  private sequenceCounter = 0;

  publish<T>(topic: TelemetryTopic, payload: T): void {
    const seqId = this.sequenceCounter++;
    const pl = payload as any;

    const {
      eventId, timestamp, source, target, eventType,
      correlationId, replayVersion, deterministicSequenceId,
      ...extraPayload
    } = pl;

    const enrichedPayload = {
      ...pl,
      eventId: eventId || `evt-${Math.random().toString(36).substr(2, 9)}-${seqId}`,
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'system',
      target: target || pl.targetId || pl.nodeId || 'global',
      eventType: eventType || topic,
      mutationPayload: extraPayload,
      correlationId: correlationId || eventId || `corr-${Math.random().toString(36).substr(2, 6)}`,
      replayVersion: replayVersion || '1.1',
      deterministicSequenceId: deterministicSequenceId !== undefined ? deterministicSequenceId : seqId
    };

    const envelope: TelemetryEnvelope<any> = {
      topic,
      payload: enrichedPayload
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
    const safeEnv = typeof process !== 'undefined' && typeof process.env !== 'undefined' ? process.env : {} as Record<string, string>;
    if (safeEnv.NODE_ENV !== 'production') {
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
