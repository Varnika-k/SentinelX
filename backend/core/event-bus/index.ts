import { UnifiedOperationalEvent, GraphMutationPayload } from '../types';
import { graphStateRuntime } from '../graph-runtime';
import { replayPersistenceEngine } from '../replay-engine';
import { realtimeBroadcastSystem } from '../realtime';
import { logger } from '../../app/core/logger';
import { AppDataSource } from '../../app/db/data-source';
import { UnifiedOperationalEventEntity } from '../../app/db/entities/UnifiedOperationalEventEntity';
import { aiService } from '../../app/services/ai';

export class UnifiedEventBus {
  private static instance: UnifiedEventBus;
  private currentReplaySequence = 0;
  private isProcessingQueue = false;
  private eventQueue: UnifiedOperationalEvent[] = [];

  private constructor() {
    this.bootSequenceCounter();
  }

  public static getInstance(): UnifiedEventBus {
    if (!UnifiedEventBus.instance) {
      UnifiedEventBus.instance = new UnifiedEventBus();
    }
    return UnifiedEventBus.instance;
  }

  /**
   * Recovers the last logged replay sequence from DB to maintain strict monotonicity
   */
  private async bootSequenceCounter() {
    try {
      // Lazy wait to ensure AppDataSource is up
      setTimeout(async () => {
        try {
          if (AppDataSource && AppDataSource.isInitialized) {
            const repo = AppDataSource.getRepository(UnifiedOperationalEventEntity);
            const latest = await repo.findOne({
              where: {},
              order: { replaySequence: 'DESC' }
            });
            if (latest) {
              this.currentReplaySequence = latest.replaySequence;
              logger.info(`UnifiedEventBus: Sequence counter initialized at #${this.currentReplaySequence}`);
            }
          }
        } catch (err) {
          logger.warn('UnifiedEventBus: Lazy database sequence fetch skipped.');
        }
      }, 5000);
    } catch (error) {
      logger.error('UnifiedEventBus: Failed to recover monotonic sequence.', error);
    }
  }

  /**
   * Ingest and normalize raw threat alerts from Wazuh, Falco, cloud logs, or simulated hacks
   */
  public async ingestEvent(rawEvent: any): Promise<UnifiedOperationalEvent> {
    const id = rawEvent.id || rawEvent.eventId || crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
    const timestamp = rawEvent.timestamp || new Date().toISOString();
    
    // Ingestion + Normalization Phase
    const eventType = this.normalizeEventType(rawEvent);
    const severity = this.normalizeSeverity(rawEvent.severity);
    const source = rawEvent.source || 'ingest-pipeline';
    const message = rawEvent.message || rawEvent.payload?.message || 'Inferred operational signal';
    const nodeId = rawEvent.nodeId || rawEvent.infrastructureContext?.nodeId || rawEvent.targetNode;

    // Incremental sequence assignment to ensure exact determinism during replay
    this.currentReplaySequence++;

    const normalized: UnifiedOperationalEvent = {
      id,
      timestamp,
      eventType,
      source,
      severity,
      nodeId,
      infrastructureZone: rawEvent.infrastructureZone || rawEvent.infrastructureContext?.namespace || 'default-zone',
      attackStage: rawEvent.attackStage || this.inferAttackStage(rawEvent),
      propagationRisk: rawEvent.propagationRisk || (severity === 'critical' ? 0.9 : severity === 'high' ? 0.6 : 0.2),
      trustImpact: rawEvent.trustImpact || this.calculateTrustImpact(severity, eventType),
      replaySequence: this.currentReplaySequence,
      mitigationState: rawEvent.mitigationState || 'triggered',
      correlationId: rawEvent.correlationId || rawEvent.payload?.correlationId || 'correlation-baseline',
      telemetry: {
        message,
        ...rawEvent.telemetry,
        payload: rawEvent.payload
      }
    };

    // Construct Graph Mutations if not explicitly provided
    if (!rawEvent.graphMutation) {
      normalized.graphMutation = this.inferGraphMutation(normalized);
    } else {
      normalized.graphMutation = rawEvent.graphMutation;
    }

    // Insert into deterministic queue to process sequentially and avoid state races
    this.eventQueue.push(normalized);
    this.processQueue();

    return normalized;
  }

  /**
   * Stream processes events through the entire ingestion lifecycle sequentially
   */
  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      try {
        // 1. Apply Graph Mutation
        if (event.graphMutation) {
          graphStateRuntime.applyMutation(event.graphMutation);
          // Broadcast incremental state mutations
          realtimeBroadcastSystem.broadcastGraphMutation(event.graphMutation);
        }

        // 2. Persist to Replay Storage (Supabase Postgres or Resilient Fallback)
        await replayPersistenceEngine.saveEvent(event);

        // Capture snapshot every 10 events for lightning-fast timeline reconstruction checkpoints
        if (event.replaySequence % 10 === 0) {
          const snapshot = graphStateRuntime.createSnapshot(event.replaySequence);
          await replayPersistenceEngine.saveSnapshot(snapshot);
        }

        // 3. AI Copilot/Reasoning Handoff under Critical Infiltrations
        if (event.severity === 'critical' || event.severity === 'high') {
          this.triggerAiAssistance(event);
        }

        // 4. WebSocket Broadcast
        realtimeFSystem.broadcastEvent(event);

      } catch (err) {
        logger.error(`UnifiedEventBus: Processing failure for Event ID ${event.id}`, err);
      }
    }

    this.isProcessingQueue = false;
  }

  private normalizeEventType(raw: any): 'telemetry' | 'attack' | 'defense' | 'replay' | 'ai' | 'simulation' {
    const typeStr = String(raw.eventType || raw.type).toLowerCase();
    if (typeStr.includes('attack') || typeStr.includes('compromise') || typeStr.includes('alert') || typeStr.includes('wazuh') || typeStr.includes('falco')) {
      return 'attack';
    }
    if (typeStr.includes('defense') || typeStr.includes('isolate') || typeStr.includes('mitigate') || typeStr.includes('remedy')) {
      return 'defense';
    }
    if (typeStr.includes('replay') || typeStr.includes('restore')) {
      return 'replay';
    }
    if (typeStr.includes('ai') || typeStr.includes('reasoning') || typeStr.includes('prompt')) {
      return 'ai';
    }
    if (typeStr.includes('simulation') || typeStr.includes('twin')) {
      return 'simulation';
    }
    return 'telemetry';
  }

  private normalizeSeverity(sev: any): 'low' | 'medium' | 'high' | 'critical' {
    const s = String(sev).toLowerCase();
    if (s.includes('critical') || s === 'error' || s === '3') return 'critical';
    if (s.includes('high') || s === 'warning' || s === '2') return 'high';
    if (s.includes('medium') || s === 'info' || s === '1') return 'medium';
    return 'low';
  }

  private inferAttackStage(raw: any): 'recon' | 'foothold' | 'lateral' | 'exfiltration' | 'impact' | undefined {
    const msg = String(raw.message || '').toLowerCase();
    if (msg.includes('scan') || msg.includes('nmap') || msg.includes('reconnaissance')) return 'recon';
    if (msg.includes('phish') || msg.includes('exploit') || msg.includes('entry') || msg.includes('foothold')) return 'foothold';
    if (msg.includes('lateral') || msg.includes('ssh') || msg.includes('rpc') || msg.includes('smb')) return 'lateral';
    if (msg.includes('exfiltrat') || msg.includes('upload') || msg.includes('theft') || msg.includes('dns tunnel')) return 'exfiltration';
    if (msg.includes('crypto') || msg.includes('encrypt') || msg.includes('ddos') || msg.includes('ransom') || msg.includes('flood')) return 'impact';
    return undefined;
  }

  private calculateTrustImpact(severity: string, type: string): number {
    if (type === 'defense') return 25; // mitigation restores trust
    
    switch (severity) {
      case 'critical': return -50;
      case 'high': return -25;
      case 'medium': return -10;
      default: return -2;
    }
  }

  /**
   * Resolves raw events dynamically to proper Graph Mutation maps
   */
  private inferGraphMutation(event: UnifiedOperationalEvent): GraphMutationPayload {
    const nodesToUpdate: Array<Partial<any> & { id: string }> = [];
    const edgesToUpdate: Array<Partial<any> & { id: string }> = [];

    if (event.nodeId) {
      const isAttack = event.eventType === 'attack';
      const isDefense = event.eventType === 'defense';
      
      nodesToUpdate.push({
        id: event.nodeId,
        status: isAttack ? 'compromised' : isDefense ? 'isolated' : 'healthy',
        riskScore: isAttack ? 95 : isDefense ? 5 : 10,
        trustScore: isAttack ? 5 : isDefense ? 90 : 95,
        cpuLoad: isAttack ? 85 : isDefense ? 5 : 15,
        latency: isAttack ? 350 : isDefense ? 999 : 8
      });
    }

    return { nodesToUpdate, edgesToUpdate };
  }

  /**
   * Thread-safe background handler to deliver immediate intelligence context via Gemini
   */
  private async triggerAiAssistance(event: UnifiedOperationalEvent) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        logger.warn('UnifiedEventBus: AI Engine dispatch skipped (GEMINI_API_KEY undefined).');
        return;
      }

      logger.info(`UnifiedEventBus: Instructing AI agent reasoning for severity event (${event.id})`);
      const payload = {
        eventDetails: event,
        currentTopology: graphStateRuntime.getNodes()
      };

      const analysis = await aiService.analyze(payload);
      
      // Feed AI prediction back as a dedicated event in the bus
      const aiEvent = await this.ingestEvent({
        eventType: 'ai',
        source: 'sentinelx-ai-core',
        severity: 'medium',
        message: `AI ANALYSIS: Threat mitigation advised. ${analysis.summary || 'Isolate host immediately.'}`,
        telemetry: {
          prediction: analysis.prediction,
          recommendation: analysis.recommendation,
          rawResponse: analysis
        },
        correlationId: event.correlationId
      });
      
      logger.info(`UnifiedEventBus: Registered AI reasoning result #${aiEvent.replaySequence}`);
    } catch (err) {
      logger.error('UnifiedEventBus: AI reasoning pipeline failed.', err);
    }
  }
}

export const unifiedEventBus = UnifiedEventBus.getInstance();
