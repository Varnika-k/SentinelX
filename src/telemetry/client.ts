import { telemetryBus } from './bus';
import { TelemetryTopic, TelemetryEnvelope } from './schemas';

/**
 * TelemetryClient
 * Manages WebSocket connection to the SentinelX backend.
 * Normalizes incoming network events and pushes them to the local Telemetry Bus.
 */
class TelemetryClient {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private maxRetries: number = 10;
  private currentRetries: number = 0;
  private url: string;
  private lastReceivedTimestamp: string | null = null;
  private processedIds: Set<string> = new Set();
  private sendQueue: string[] = [];

  constructor() {
    // Determine WS URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}`;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    console.log(`[TelemetryClient] Connecting to ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[TelemetryClient] Connected to backend telemetry stream.');
      this.currentRetries = 0;
      telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
        source: 'telemetry_client',
        message: 'REAL_TIME_STREAM: Connection active.',
        severity: 'low'
      });

      // Reconnect Synchronization Recovery: ask backend for missing event deltas
      if (this.lastReceivedTimestamp && this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log(`[TelemetryClient] Reconnection detected. Triggering sync since: ${this.lastReceivedTimestamp}`);
        this.ws.send(JSON.stringify({
          action: 'sync',
          since: this.lastReceivedTimestamp
        }));
      }

      // Flush buffered messages queued during outage
      while (this.sendQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const msg = this.sendQueue.shift();
        if (msg) this.ws.send(msg);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const envelope: TelemetryEnvelope = JSON.parse(event.data);
        const envAny = envelope as any;
        if (envAny.timestamp) {
          this.lastReceivedTimestamp = envAny.timestamp;
        } else {
          this.lastReceivedTimestamp = new Date().toISOString();
        }
        this.processEvent(envelope);
      } catch (err) {
        console.error('[TelemetryClient] Failed to parse telemetry frame:', err);
      }
    };

    this.ws.onclose = () => {
      console.warn('[TelemetryClient] Connection closed.');
      this.handleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[TelemetryClient] WebSocket error:', err);
    };
  }

  private handleReconnect() {
    if (this.currentRetries < this.maxRetries) {
      this.currentRetries++;
      console.log(`[TelemetryClient] Attempting reconnect ${this.currentRetries}/${this.maxRetries} in ${this.reconnectInterval}ms...`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
        source: 'telemetry_client',
        message: 'REAL_TIME_STREAM: Max retries reached. Persistent connection failure.',
        severity: 'high'
      });
    }
  }

  private processEvent(envelope: TelemetryEnvelope) {
    // Deduplicate high-frequency events or double sync triggers
    const envAny = envelope as any;
    const evId = envAny.payload?.id || `${envelope.topic}-${envAny.timestamp || ''}-${JSON.stringify(envelope.payload).length}`;
    if (this.processedIds.has(evId)) {
      return; // Suppress duplicate triggers
    }
    this.processedIds.add(evId);
    if (this.processedIds.size > 1000) {
      const first = this.processedIds.values().next().value;
      if (first !== undefined) this.processedIds.delete(first);
    }

    telemetryBus.publish(envelope.topic, envelope.payload);
  }

  send(message: any) {
    const raw = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(raw);
    } else {
      console.warn('[TelemetryClient] Connection offline. Queueing message for transmission...');
      this.sendQueue.push(raw);
      if (this.sendQueue.length > 100) {
        this.sendQueue.shift(); // Safeguard memory limits by pruning oldest
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const telemetryClient = new TelemetryClient();
