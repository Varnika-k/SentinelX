import { eventBus } from '../../app/core/event-bus';
import { logger } from '../../app/core/logger';
import { UnifiedOperationalEvent, GraphSnapshot } from '../types';

export class RealtimeBroadcastSystem {
  private static instance: RealtimeBroadcastSystem;

  private constructor() {}

  public static getInstance(): RealtimeBroadcastSystem {
    if (!RealtimeBroadcastSystem.instance) {
      RealtimeBroadcastSystem.instance = new RealtimeBroadcastSystem();
    }
    return RealtimeBroadcastSystem.instance;
  }

  /**
   * Broadcast a Unified Operational Event to all connected sockets
   */
  public broadcastEvent(event: UnifiedOperationalEvent) {
    logger.info(`RealtimeBroadcastSystem: Dispatching operational event #${event.replaySequence} (${event.eventType})`);
    
    // Publish to multiple standard topics to support both specific and general listeners
    eventBus.publish('operational:event', event);
    eventBus.publish(`telemetry:event:${event.eventType}`, event);

    // Fallbacks to match legacy client expectations
    if (event.eventType === 'attack') {
      eventBus.publish('attack:alert', {
        id: event.id,
        nodeId: event.nodeId,
        message: event.telemetry?.message || 'Attack vector active',
        severity: event.severity,
        timestamp: event.timestamp,
        attackerId: event.source
      });
    } else if (event.eventType === 'defense') {
      eventBus.publish('defense:action', {
        id: event.id,
        nodeId: event.nodeId,
        action: event.telemetry?.action || 'mitigation_triggered',
        message: event.telemetry?.message || 'Defense countermeasures active',
        severity: event.severity,
        timestamp: event.timestamp
      });
    }
  }

  /**
   * Broadcast a live layout/schema mutation payload
   */
  public broadcastGraphMutation(mutation: any) {
    logger.info('RealtimeBroadcastSystem: Broadcasting incremental graph mutation.');
    eventBus.publish('node:update', mutation);
    eventBus.publish('graph:mutation', mutation);
  }

  /**
   * Broadcast a complete topology snapshot synchronization
   */
  public broadcastTopologySync(snapshot: GraphSnapshot) {
    logger.info(`RealtimeBroadcastSystem: Synchronizing topology baseline logic at sequence #${snapshot.replaySequence}`);
    eventBus.publish('topology:sync', snapshot);
  }

  /**
   * Broadcast AI analysis stream chunks
   */
  public broadcastAiStream(chunk: string, correlationId?: string) {
    eventBus.publish('ai:stream', { chunk, correlationId, timestamp: new Date().toISOString() });
  }

  /**
   * Broadcast replay timeline state updates (play, pause, step)
   */
  public broadcastReplaySync(state: { status: string; currentSequence: number; totalSequence: number }) {
    logger.info(`RealtimeBroadcastSystem: Syncing play timeline (Step: ${state.currentSequence}/${state.totalSequence})`);
    eventBus.publish('replay:sync', state);
  }
}

export const realtimeBroadcastSystem = RealtimeBroadcastSystem.getInstance();
