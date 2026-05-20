import { telemetryBus } from './bus';
import { TelemetryTopic, TelemetryEnvelope } from './schemas';

export interface ReplayStatus {
  isPlaying: boolean;
  currentIndex: number;
  totalEvents: number;
  speed: number;
}

/**
 * ReplayEngine
 * Allows re-streaming of historical telemetry data with scrub and seek support.
 */
export class ReplayEngine {
  private static isPlaying = false;
  private static timer: NodeJS.Timeout | null = null;
  private static index = 0;
  private static history: TelemetryEnvelope[] = [];
  private static speed = 500;

  static load(history: TelemetryEnvelope[]) {
    const isInitialLoad = this.history.length === 0;
    this.history = history;
    if (isInitialLoad) {
      this.index = 0;
    }
    this.broadcastStatus();
  }

  static start(speed?: number) {
    if (speed) this.speed = speed;
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.broadcastStatus();

    telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
      source: 'replay_engine',
      message: 'REPLAY_MODE: Start.',
      severity: 'low'
    });

    this.run();
  }

  private static run() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      if (this.index >= this.history.length) {
        this.pause();
        telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
          source: 'replay_engine',
          message: 'REPLAY_MODE: End of history.',
          severity: 'low'
        });
        return;
      }

      this.step();
    }, this.speed);
  }

  static step() {
    if (this.index < this.history.length) {
      const env = this.history[this.index];
      // Clone payload and add replay marker to avoid loops
      const replayedPayload = { 
        ...env.payload, 
        _isReplay: true,
        source: 'replay_engine' 
      };
      telemetryBus.publish(env.topic, replayedPayload);
      this.index++;
      this.broadcastStatus();
    }
  }

  static seek(index: number) {
    const wasPlaying = this.isPlaying;
    this.pause();
    
    // To seek correctly in an event-driven system, we MUST reset state 
    // and re-process all events from 0 to N.
    // We signal a reset first.
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      action: 'REPLAY_RESET',
      source: 'replay_engine'
    });

    const targetIndex = Math.max(0, Math.min(index, this.history.length));
    this.index = 0;
    
    // Fast-forward to the target index
    for (let i = 0; i < targetIndex; i++) {
      const env = this.history[i];
      const replayedPayload = { 
        ...env.payload, 
        _isReplay: true,
        source: 'replay_engine' 
      };
      telemetryBus.publish(env.topic, replayedPayload);
      this.index++;
    }

    this.broadcastStatus();
    if (wasPlaying) this.start();
  }

  static pause() {
    if (this.timer) clearInterval(this.timer);
    this.isPlaying = false;
    this.timer = null;
    this.broadcastStatus();
  }

  static setSpeed(speed: number) {
    this.speed = speed;
    if (this.isPlaying) {
      this.run();
    }
    this.broadcastStatus();
  }

  private static broadcastStatus() {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      action: 'REPLAY_STATUS',
      source: 'replay_engine',
      payload: {
        isPlaying: this.isPlaying,
        currentIndex: this.index,
        totalEvents: this.history.length,
        speed: this.speed
      } as ReplayStatus
    });
  }

  static getStatus(): ReplayStatus {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.index,
      totalEvents: this.history.length,
      speed: this.speed
    };
  }
}
