import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../db/service';
import { eventBus } from '../core/event-bus';
import { logger } from '../core/logger';
import { TelemetryEventType, TelemetryEvent } from '../schemas/telemetry';
import { digitalTwinEngine } from '../simulation/twin-engine';
import { aiService } from '../services/ai';

export interface CanonicalTelemetryEvent {
  eventId: string;
  timestamp: string;
  source: 'WAZUH' | 'FALCO' | 'SIMULATED_DIGITAL_TWIN' | 'AWS_CLOUDTRAIL' | 'SHODAN' | 'VIRUSTOTAL' | string;
  sourceType: 'endpoint' | 'container' | 'identity' | 'network' | 'infrastructure' | 'orchestration' | 'replay' | 'AI reasoning' | 'simulation';
  targetNode: string;
  eventCategory: 'endpoint' | 'runtime' | 'identity' | 'network' | 'infrastructure' | 'orchestration' | 'replay' | 'AI' | 'simulation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  threatScore: number; // 0 to 100
  correlationId: string;
  replaySequence: number;
  infrastructureContext: {
    nodeId: string;
    environment?: string;
    namespace?: string;
    type?: string;
    ipAddress?: string;
  };
  mutationPayload: {
    riskDelta?: number;
    statusChange?: 'healthy' | 'warning' | 'critical' | 'infected' | 'isolated';
    cpuDelta?: number;
    activeConnectionsDelta?: number;
    blastRadiusDelta?: number;
  };
  mitreDetails?: {
    tactics: string[];
    techniques: string[];
    ids: string[];
  };
  geoDetails?: {
    country: string;
    city: string;
    ip: string;
  };
}

export class TelemetryPipeline {
  private static instance: TelemetryPipeline;
  private replaySequenceCounter = 0;
  private currentSessionId: string = uuidv4();

  private constructor() {}

  public static getInstance(): TelemetryPipeline {
    if (!TelemetryPipeline.instance) {
      TelemetryPipeline.instance = new TelemetryPipeline();
    }
    return TelemetryPipeline.instance;
  }

  /**
   * Universal entry point to ingest raw EDR, SIEM or runtime alarms
   */
  public async ingestWazuhAlert(rawAlert: any): Promise<CanonicalTelemetryEvent> {
    logger.info(`[Pipeline] Ingesting raw Wazuh SIEM Endpoint Alert: ${rawAlert.rule?.id || 'unknown'}`);
    
    // 1. Parse & Normalize
    const timestamp = rawAlert.timestamp || new Date().toISOString();
    const ruleDesc = rawAlert.rule?.description || 'Wazuh EDR security indicator logged';
    const rawLevel = Number(rawAlert.rule?.level || 3);
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (rawLevel >= 12) severity = 'critical';
    else if (rawLevel >= 8) severity = 'high';
    else if (rawLevel >= 5) severity = 'medium';

    // Map Wazuh agent name (or host IP) to active digital twin nodes
    const targetAgentName = rawAlert.agent?.name || 'pc-admin-hq';
    const targetNode = this.resolveTargetNode(targetAgentName);

    const correlationId = rawAlert.correlationId || `corr-wazuh-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate baseline threat score for this rule level
    const threatScore = Math.min(100, rawLevel * 7.5);

    // Initial normalized payload
    const normalized: Partial<CanonicalTelemetryEvent> = {
      eventId: uuidv4(),
      timestamp,
      source: 'WAZUH',
      sourceType: 'endpoint',
      targetNode,
      eventCategory: 'endpoint',
      severity,
      threatScore,
      correlationId,
      infrastructureContext: {
        nodeId: targetNode,
        ipAddress: rawAlert.data?.srcip || '10.45.2.14'
      },
      mutationPayload: {
        riskDelta: severity === 'critical' ? 35 : (severity === 'high' ? 20 : 8),
        statusChange: severity === 'critical' || severity === 'high' ? 'critical' : 'warning',
        cpuDelta: Math.round(Math.random() * 20) + 10
      }
    };

    // 2. Enrich, Mutate, and Correlate
    return await this.processCanonicalFlow(normalized);
  }

  public async ingestFalcoAlert(rawAlert: any): Promise<CanonicalTelemetryEvent> {
    logger.info(`[Pipeline] Ingesting raw Falco Kubernetes Runtime Guard alert: ${rawAlert.rule || 'unknown'}`);

    // 1. Parse & Normalize
    const timestamp = rawAlert.time || new Date().toISOString();
    const priority = rawAlert.priority || 'Medium';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (priority.toLowerCase() === 'critical' || priority.toLowerCase() === 'emergency') severity = 'critical';
    else if (priority.toLowerCase() === 'high') severity = 'high';
    else if (priority.toLowerCase() === 'warning') severity = 'medium';

    const targetPod = rawAlert.k8s?.pod || rawAlert.container || 'k8s-pod-auth-api-559b';
    const targetNode = this.resolveTargetNode(targetPod);

    const correlationId = rawAlert.correlationId || `corr-falco-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const threatScore = severity === 'critical' ? 95 : (severity === 'high' ? 75 : 45);

    const normalized: Partial<CanonicalTelemetryEvent> = {
      eventId: uuidv4(),
      timestamp,
      source: 'FALCO',
      sourceType: 'container',
      targetNode,
      eventCategory: 'runtime',
      severity,
      threatScore,
      correlationId,
      infrastructureContext: {
        nodeId: targetNode,
        namespace: rawAlert.k8s?.ns || 'production',
        type: 'K8S_POD',
        ipAddress: '10.244.18.52'
      },
      mutationPayload: {
        riskDelta: severity === 'critical' ? 40 : (severity === 'high' ? 25 : 12),
        statusChange: severity === 'critical' ? 'infected' : 'warning',
        cpuDelta: Math.round(Math.random() * 30) + 15
      }
    };

    // 2. Enrich, Mutate, and Correlate
    return await this.processCanonicalFlow(normalized);
  }

  /**
   * Central processor for canonicalizing and executing state propagation 
   */
  private async processCanonicalFlow(partialEvent: Partial<CanonicalTelemetryEvent>): Promise<CanonicalTelemetryEvent> {
    this.replaySequenceCounter++;
    
    // Compile basic event structure
    const event: CanonicalTelemetryEvent = {
      eventId: partialEvent.eventId || uuidv4(),
      timestamp: partialEvent.timestamp || new Date().toISOString(),
      source: partialEvent.source || 'SIMULATED_DIGITAL_TWIN',
      sourceType: partialEvent.sourceType || 'endpoint',
      targetNode: partialEvent.targetNode || 'pc-admin-hq',
      eventCategory: partialEvent.eventCategory || 'endpoint',
      severity: partialEvent.severity || 'low',
      threatScore: partialEvent.threatScore || 10,
      correlationId: partialEvent.correlationId || `corr-gen-${uuidv4().substring(0, 8)}`,
      replaySequence: this.replaySequenceCounter,
      infrastructureContext: {
        nodeId: partialEvent.targetNode || 'pc-admin-hq',
        ...partialEvent.infrastructureContext
      },
      mutationPayload: partialEvent.mutationPayload || {}
    };

    // 1. GEO Enrichment System
    const geoMapping: Record<string, { country: string; city: string; ip: string }> = {
      '185.220.101.5': { country: 'North Korea', city: 'Pyongyang', ip: '185.220.101.5' },
      '82.102.23.4': { country: 'Russia', city: 'Saint Petersburg', ip: '82.102.23.4' },
      '45.18.23.90': { country: 'Netherlands', city: 'Amsterdam', ip: '45.18.23.90' },
      '192.168.45.12': { country: 'Internal Workspace', city: 'Remote Access VPN', ip: '192.168.45.12' }
    };
    const incomingIp = event.infrastructureContext.ipAddress || '45.18.23.90';
    event.geoDetails = geoMapping[incomingIp] || { country: 'Unknown Origin', city: 'Proxied Node', ip: incomingIp };

    // 2. MITRE ATT&CK Enrichment
    const messageLower = (event.source === 'WAZUH' ? 'Wazuh Alert' : 'Falco Alert').toLowerCase();
    if (messageLower.includes('login') || messageLower.includes('auth') || messageLower.includes('credentials') || messageLower.includes('force')) {
      event.mitreDetails = {
        tactics: ['Credential Access'],
        techniques: ['Brute Force'],
        ids: ['T1110']
      };
    } else if (messageLower.includes('bash') || messageLower.includes('shell') || messageLower.includes('exec') || messageLower.includes('script')) {
      event.mitreDetails = {
        tactics: ['Execution'],
        techniques: ['Command and Scripting Interpreter'],
        ids: ['T1059']
      };
    } else if (messageLower.includes('escalate') || messageLower.includes('rbac') || messageLower.includes('root') || messageLower.includes('privilege')) {
      event.mitreDetails = {
        tactics: ['Privilege Escalation'],
        techniques: ['Exploitation for Privilege Escalation'],
        ids: ['T1068']
      };
    } else {
      event.mitreDetails = {
        tactics: ['Execution', 'Lateral Movement'],
        techniques: ['Exploitation of Remote Services'],
        ids: ['T1210']
      };
    }

    // Adjust target environment info into context
    const nodeState = digitalTwinEngine.nodes.get(event.targetNode);
    if (nodeState) {
      event.infrastructureContext.environment = nodeState.environment;
      event.infrastructureContext.namespace = nodeState.namespace;
      event.infrastructureContext.type = nodeState.type;
    }

    // 3. GRAPH MUTATION ENGINE - Mutate live digital twin directly!
    this.applyLiveGraphMutation(event);

    // 4. PERSISTENCE - Write canonical event to TypeORM database service layer
    const legacyEvent: TelemetryEvent = {
      id: event.eventId,
      type: event.source === 'WAZUH' ? TelemetryEventType.TELEMETRY_ALERT : TelemetryEventType.K8S_AUDIT_LOG_ENTRY,
      severity: event.severity,
      source: event.source,
      message: `${event.source === 'WAZUH' ? '[Wazuh SIEM]' : '[Falco Runtime]'} alert on [${event.targetNode}]. Impact level ${event.severity.toUpperCase()}. Details: ${event.mitreDetails.tactics[0]} threat mapped ${event.mitreDetails.ids[0]} from location ${event.geoDetails.country}.`,
      timestamp: event.timestamp,
      nodeId: event.targetNode,
      payload: {
        canonical_id: event.eventId,
        source_type: event.sourceType,
        threat_score: event.threatScore,
        correlation_id: event.correlationId,
        replay_sequence: event.replaySequence,
        context: event.infrastructureContext,
        mutation: event.mutationPayload,
        mitre: event.mitreDetails,
        geo: event.geoDetails
      }
    };
    
    // Buffer/Save in DB
    await DatabaseService.saveTelemetry(legacyEvent);

    // 5. INCIDENT RECONCILIATION CORRELATION
    await this.correlateIncidentAndAlert(event, legacyEvent);

    // 6. REAL-TIME INTERACTIVE BROADCAST (Fan-out over WebSockets)
    // Send both legacy mapped format and canonical event wrapper for rich display
    eventBus.publish('telemetry:event:*', legacyEvent);
    eventBus.publish('attack:alert', {
      attackType: event.mitreDetails.techniques[0] || 'Malicious Tactic',
      targetId: event.targetNode,
      severity: event.severity,
      origin: event.geoDetails.country,
      vector: event.mitreDetails.ids[0],
      message: legacyEvent.message,
      timestamp: event.timestamp
    });

    // 7. AI OPERATIONS TRIGGER
    if (event.severity === 'high' || event.severity === 'critical') {
      this.triggerAIOperationalAnalysis(event);
    }

    return event;
  }

  /**
   * Direct in-memory graph mutations
   */
  private applyLiveGraphMutation(event: CanonicalTelemetryEvent) {
    const node = digitalTwinEngine.nodes.get(event.targetNode);
    if (!node) return;

    if (node.status === 'isolated') {
      logger.info(`[Pipeline] Cannot mutate isolated node ${event.targetNode}`);
      return;
    }

    // Trigger risk scoring & state upgrades/degradations
    const riskDelta = event.mutationPayload.riskDelta || 5;
    node.riskScore = Math.max(0, Math.min(100, node.riskScore + riskDelta));
    
    if (node.riskScore >= 75) {
      node.status = event.mutationPayload.statusChange || 'infected';
    } else if (node.riskScore >= 40) {
      node.status = 'warning';
    }

    if (event.mutationPayload.cpuDelta) {
      node.cpuLoad = Math.max(10, Math.min(100, node.cpuLoad + event.mutationPayload.cpuDelta));
    }

    // Push node updates dynamically so visual graphs react!
    eventBus.publish('node:update', {
      source: 'telemetry_pipeline',
      nodeId: event.targetNode,
      status: node.status,
      threatScore: node.riskScore,
      vulnerability: node.riskScore / 100,
      lastAction: `${event.source}_ALARM`
    });

    logger.info(`[Pipeline] Node [${event.targetNode}] Mutated: Status=${node.status}, RiskScore=${node.riskScore}`);
  }

  /**
   * Match incoming alerts into long-lived Incidents/Campaigns
   */
  private async correlateIncidentAndAlert(event: CanonicalTelemetryEvent, legacyEvent: any) {
    try {
      const activeIncidents = await DatabaseService.getIncidents();
      // Match active incident targeting the same workspace / node category in the last 60 seconds
      const oneMinuteAgo = Date.now() - 60000;
      
      const matchingIncident = activeIncidents.find(inc => 
        inc.status === 'open' && 
        inc.description?.includes(event.targetNode) && 
        new Date(inc.startTime).getTime() > oneMinuteAgo
      );

      if (matchingIncident) {
        logger.info(`[Pipeline] Correlating alert into existing Active Incident: ${matchingIncident.id}`);
        matchingIncident.description = `${matchingIncident.description || ''} | Mapped MITRE ${event.mitreDetails?.ids[0]} on ${event.targetNode}`;
        if (!matchingIncident.timeline) {
          matchingIncident.timeline = [];
        }
        matchingIncident.timeline.push({
          time: event.timestamp,
          event: `Enriched alert: ${event.source} captured threat ${event.mitreDetails?.ids[0]} on ${event.targetNode}.`
        });
        await DatabaseService.createIncident(matchingIncident);
      } else {
        logger.info(`[Pipeline] Creating new high-level operational Incident correlation boundary`);
        const title = `${event.source === 'WAZUH' ? 'Credential/Endpoint' : 'Container Runtime'} Breach Chain [${event.mitreDetails?.ids[0] || 'Unknown'}]`;
        await DatabaseService.createIncident({
          title,
          type: event.source === 'WAZUH' ? 'endpoint' : 'runtime',
          severity: event.severity,
          status: 'open',
          startTime: new Date(event.timestamp),
          description: `Unified campaign detected on workstation ${event.targetNode} with indicators: ${event.mitreDetails?.tactics[0]} (${event.mitreDetails?.ids[0]}) originating from IP ${event.geoDetails?.ip} (${event.geoDetails?.country}). Target context: ${event.targetNode}`,
          timeline: [
            {
              time: event.timestamp,
              event: `Initial infection alert captured by ${event.source} pipeline.`
            }
          ]
        });
      }
    } catch (err) {
      logger.error('[Pipeline] Incident correlation failed', err);
    }
  }

  /**
   * Triggers background AI reasoning over enriched operational intelligence
   */
  private async triggerAIOperationalAnalysis(event: CanonicalTelemetryEvent) {
    try {
      logger.info(`[Pipeline] Launching AI reasoning model on canonical dataset for ${event.targetNode}...`);
      
      const response = await aiService.analyze({
        type: 'threat',
        context: {
          targetNode: {
            id: event.targetNode,
            type: event.infrastructureContext.type,
            status: 'infected',
            threatScore: event.threatScore,
            vulnerability: event.threatScore / 100,
            lastAttackType: event.mitreDetails?.techniques[0]
          },
          recentActivity: [
            {
              source: event.source,
              message: `MITRE Tactic: ${event.mitreDetails?.tactics[0]}, Threat Origin: ${event.geoDetails?.country}`,
              severity: event.severity,
              time: event.timestamp
            }
          ]
        }
      });

      logger.info(`[Pipeline] AI Cognitive Inference completed. AI summary of spread prediction: ${response.summary}`);

      // Feed recommendation with full descriptive structures to frontend
      const recommendationId = `REC-AI-${uuidv4().substring(0, 4).toUpperCase()}`;
      
      eventBus.publish('defense:action', {
        source: 'AI_COGNITIVE_REASONING',
        module: 'autonomous_orchestrator',
        action: 'recommendation_broadcast',
        targetId: event.targetNode,
        result: 'success',
        metadata: {
          recommendation: {
            id: recommendationId,
            action: event.source === 'WAZUH' ? 'rotate_credentials' : 'quarantine_workload',
            title: event.source === 'WAZUH' ? 'ROTATE_SECRETS' : 'QUARANTINE_NODE',
            targetId: event.targetNode,
            priority: event.severity,
            confidence: response.confidence || 0.89,
            reasoning: response.summary,
            rationale: `AI Operational Intelligence validated risk on adjacent workspaces during attack. Mitigating immediately restores environment reliability.`,
            predictedImpact: `Nullifies lateral spread with low operational latency overhead (${event.source === 'WAZUH' ? 'Rotate IAM Secrets' : 'eBPF sandbox containment'}).`,
            mitigationProbability: 0.94,
            operationalCost: event.source === 'WAZUH' ? 'Low' : 'Medium',
            affectedInfrastructure: `${event.targetNode} interfaces`,
            urgency: event.severity === 'critical' ? 'Critical' : 'High',
            impactScore: 0.85,
            timestamp: Date.now(),
            status: 'pending'
          }
        }
      });
    } catch (err) {
      logger.error('[Pipeline] AI background analysis call failed', err);
    }
  }

  private resolveTargetNode(name: string): string {
    const list = Array.from(digitalTwinEngine.nodes.keys());
    const matched = list.find(n => n.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(n.toLowerCase()));
    return matched || 'pc-admin-hq';
  }
}

export const telemetryPipeline = TelemetryPipeline.getInstance();
