import { eventBus } from '../core/event-bus';
import { DatabaseService } from '../db/service';
import { logger } from '../core/logger';
import { TelemetryEvent } from '../schemas/telemetry';

/**
 * TelemetryWorker
 * Background worker for processing high-volume telemetry.
 * Handles persistence, enrichment, and replay indexing.
 */
export class TelemetryWorker {
  private static isRunning = false;

  public static async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('SentinelX Telemetry Worker Initialized');

    // Listen to all telemetry events for asynchronous enrichment and persistence
    // In a real distributed system, this would be a separate process consuming from Redis Streams
    await eventBus.subscribe('telemetry:event:*', (payload) => this.processEvent(payload));
    
    // Explicitly handle specific topics if needed
    const criticalTopics = ['attack:alert', 'node:update', 'defense:action', 'telemetry:alert'];
    for (const topic of criticalTopics) {
      await eventBus.subscribe(topic, (payload) => this.processEvent(payload, topic));
    }
  }

  private static async processEvent(payload: any, topic?: string) {
    try {
      const event = payload as TelemetryEvent;
      
      // 1. Normalization & Enrichment
      const enrichedEvent = this.enrichEvent(event);

      // 2. Persistence (Offloaded to worker to keep API/WS threads fast)
      if (enrichedEvent.type !== 'SYSTEM_LOG') {
        await DatabaseService.saveTelemetry(enrichedEvent);
      }

      // 3. Replay Indexing (Concept)
      if (enrichedEvent.severity === 'critical') {
        logger.info(`Indexing critical event for replay: ${enrichedEvent.id}`);
      }

      // 4. Infrastructure & Risk Intelligence
      await this.processInfrastructureIntelligence(enrichedEvent);

      // 5. Incident Correlation Trigger (Concept)
      if (enrichedEvent.type === 'NODE_COMPROMISED' || enrichedEvent.severity === 'critical') {
        this.triggerIncidentReconciliation(enrichedEvent);
      }

    } catch (error) {
      logger.error('Worker failed to process telemetry event', error);
    }
  }

  private static enrichEvent(event: TelemetryEvent): TelemetryEvent {
    // Add operational metadata or cross-reference data
    return {
      ...event,
      payload: {
        ...(event.payload || {}),
        _processed_at: new Date().toISOString(),
        _worker_id: 'sentinel-worker-01'
      }
    };
  }

  private static async processInfrastructureIntelligence(event: TelemetryEvent) {
    if (!event.nodeId) return;

    // 1. Risk Scoring logic
    let riskDelta = 0;
    if (event.severity === 'critical') riskDelta = 30;
    else if (event.severity === 'high') riskDelta = 15;
    else if (event.severity === 'medium') riskDelta = 5;

    if (riskDelta > 0) {
      await DatabaseService.updateNodeRisk(event.nodeId, riskDelta);
    }

    // 2. Dynamic Infrastructure Discovery (Auto-create infrastructure nodes if they don't exist)
    if (event.type.toString().startsWith('K8S_') || event.nodeId.startsWith('k8s-')) {
      await DatabaseService.saveInfrastructureNode({
        name: event.nodeId,
        type: 'K8S_POD' as any,
        status: event.severity === 'critical' ? 'critical' : 'healthy',
        namespace: event.payload?.namespace || 'default',
        metadata: {
          last_event_type: event.type,
          last_event_time: event.timestamp
        }
      });
    }
  }

  private static async triggerIncidentReconciliation(event: TelemetryEvent) {
    logger.info(`Triggering incident reconciliation for ${event.nodeId}`);
    // Future: Call IncidentManager logic here
  }
}
