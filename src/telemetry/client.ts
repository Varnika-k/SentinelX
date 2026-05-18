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
    };

    this.ws.onmessage = (event) => {
      try {
        const envelope: TelemetryEnvelope = JSON.parse(event.data);
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
    // Normalization Layer
    // We Map backend topics to our internal TelemetryTopic enum if they differ
    // For now, they are aligned.
    telemetryBus.publish(envelope.topic, envelope.payload);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const telemetryClient = new TelemetryClient();
