import { telemetryBus } from './bus';
import { TelemetryTopic, TelemetryEnvelope } from './schemas';
import { SimulationState } from '../types/simulation';
import { TelemetryProcessor } from './processor';
import { incidentManager } from '../core/incident-manager';
import { defenseEngine } from '../core/defense-engine';

export interface ReplayStatus {
  isPlaying: boolean;
  currentIndex: number;
  totalEvents: number;
  speed: number;
}

/**
 * Enterprise Historical Operational Reconstruction Engine
 * Implements a hybrid snapshot checkpointing and delta reconstruction pipeline.
 * Guarantees forensic-grade state replication and absolute determinism.
 */
export class ReplayEngine {
  private static isPlaying = false;
  private static timer: NodeJS.Timeout | null = null;
  private static index = 0;
  private static history: TelemetryEnvelope[] = [];
  private static speed = 500;

  // PERIODIC SNAPSHOT CHECKPOINT REGISTER
  // Stores the complete state of the network at key indices (0-based)
  private static snapshots: Map<number, SimulationState> = new Map();
  private static initialStateSnapshot: SimulationState | null = null;

  /**
   * Captures the initial clean state on login/boot.
   */
  static setInitialState(state: SimulationState) {
    if (!this.initialStateSnapshot) {
      this.initialStateSnapshot = JSON.parse(JSON.stringify(state));
    }
  }

  /**
   * Checks if historical review/stepping is currently in lock.
   */
  static isHistoricalMode(): boolean {
    const status = this.getStatus();
    return status.isPlaying || (status.totalEvents > 0 && status.currentIndex < status.totalEvents);
  }

  /**
   * Registers a state checkpoint. Called during live update periods.
   */
  static recordState(index: number, state: SimulationState, envelope: TelemetryEnvelope) {
    // Prevent recursion loops
    if (envelope.payload?._isReplay) return;

    // Check if index is a checkpoint (e.g. every 5th event, initial state, or latest update)
    const isCheckpoint = index === 0 || index % 5 === 0;
    if (isCheckpoint) {
      this.snapshots.set(index, JSON.parse(JSON.stringify(state)));
    }
  }

  /**
   * Safe checkpoint handler associating precise snapshots with their envelopes.
   */
  static recordSnapshotForEnvelope(envelope: TelemetryEnvelope, state: SimulationState) {
    if (envelope.payload?._isReplay) return;

    const idx = this.history.findIndex(h => 
      h === envelope || 
      (h.payload?.eventId && envelope.payload?.eventId && h.payload.eventId === envelope.payload.eventId)
    );
    
    if (idx !== -1) {
      // Checkpoint alignment (for instance: first, multiple of 5, or final state)
      const isCheckpoint = idx === 0 || idx % 5 === 0;
      if (isCheckpoint) {
        this.snapshots.set(idx, JSON.parse(JSON.stringify(state)));
      }
    }
  }

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
      message: 'REPLAY_RECONSTRUCTION: Playback activated.',
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
          message: 'REPLAY_RECONSTRUCTION: End of recorded timeline.',
          severity: 'low'
        });
        return;
      }

      this.step();
    }, this.speed);
  }

  static step() {
    if (this.index < this.history.length) {
      this.seek(this.index + 1);
    }
  }

  static stepBack() {
    if (this.index > 0) {
      this.seek(this.index - 1);
    }
  }

  static seek(index: number) {
    const wasPlaying = this.isPlaying;
    this.pause();
    
    const targetIndex = Math.max(0, Math.min(index, this.history.length));
    this.index = targetIndex;

    let reconstructedState: SimulationState | null = null;

    if (targetIndex === 0) {
      // 1. Root Checkpoint
      if (this.initialStateSnapshot) {
        reconstructedState = JSON.parse(JSON.stringify(this.initialStateSnapshot));
      }
    } else {
      // 2. Scan for nearest pre-computed periodic checkpoint <= targetIndex - 1
      const lastStateIndex = targetIndex - 1;
      let checkpointIndex = -1;
      
      for (let i = lastStateIndex; i >= 0; i--) {
        if (this.snapshots.has(i)) {
          checkpointIndex = i;
          break;
        }
      }

      if (checkpointIndex !== -1) {
        // Checkpoint Hit: Restore full snapshot to bypass slow replay of previous ticks
        const baseSnapshot = this.snapshots.get(checkpointIndex)!;
        reconstructedState = JSON.parse(JSON.stringify(baseSnapshot));

        // Reapply incremental event deltas to reconstruct precise transition state
        for (let i = checkpointIndex + 1; i <= lastStateIndex; i++) {
          const deltaEnv = this.history[i];
          const replayedPayload = { 
            ...deltaEnv.payload, 
            _isReplay: true,
            source: 'replay_engine' 
          };
          
          reconstructedState = TelemetryProcessor.process(reconstructedState!, {
            topic: deltaEnv.topic,
            payload: replayedPayload
          });
        }
      } else {
        // Fallback: Full sequential replay if no checkpoint is available
        if (this.initialStateSnapshot) {
          reconstructedState = JSON.parse(JSON.stringify(this.initialStateSnapshot));
        }

        for (let i = 0; i <= lastStateIndex; i++) {
          const deltaEnv = this.history[i];
          const replayedPayload = { 
            ...deltaEnv.payload, 
            _isReplay: true,
            source: 'replay_engine' 
          };
          if (reconstructedState) {
            reconstructedState = TelemetryProcessor.process(reconstructedState, {
              topic: deltaEnv.topic,
              payload: replayedPayload
            });
          }
        }
      }
    }

    if (reconstructedState) {
      // Propagate the reconstructed state to singletons to prevent logical drift
      incidentManager.restoreState(reconstructedState.incidents);
      defenseEngine.restoreState(reconstructedState.defenseRecommendations);

      // Publish snapshot state onto the bus
      telemetryBus.publish(TelemetryTopic.UI_ACTION, {
        action: 'REPLAY_STATE_RESTORE',
        source: 'replay_engine',
        state: reconstructedState
      });
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

  static clearHistory() {
    this.pause();
    this.history = [];
    this.snapshots.clear();
    this.index = 0;
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
