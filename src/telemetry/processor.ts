import { SimulationState } from '../types/simulation';
import { TelemetryTopic, TelemetryEnvelope, NodeUpdatePayload, MetricTickPayload, AttackAlertPayload, DefenseActionPayload } from './schemas';
import { TelemetryService } from '../core/telemetry-service';
import { INITIAL_NODES, INITIAL_LINKS, INITIAL_IDENTITIES, INITIAL_ROLES, INITIAL_RELATIONSHIPS, INITIAL_ENVIRONMENTS, INITIAL_KNOWLEDGE_BASE, INITIAL_ORCHESTRATION } from '../lib/simulation-data';
import { incidentManager } from '../core/incident-manager';
import { defenseEngine } from '../core/defense-engine';
import { CorrelationEngine } from '../core/knowledge-engine';
import { AgentOrchestrator } from '../core/agent-orchestrator';

/**
 * TelemetryProcessor
 * Logic for transforming SimulationState based on Telemetry Events.
 * This is a decoupled pure-functional core (mostly).
 */
export class TelemetryProcessor {
  static process(state: SimulationState, envelope: TelemetryEnvelope): SimulationState {
    const { topic, payload } = envelope;

    let newState = state;

    switch (topic) {
      case TelemetryTopic.NODE_UPDATE:
        newState = this.handleNodeUpdate(state, payload);
        break;

      case TelemetryTopic.METRIC_TICK:
        newState = this.handleMetricTick(state, payload);
        break;

      case TelemetryTopic.ATTACK_ALERT:
        newState = this.handleAttackAlert(state, payload);
        break;

      case TelemetryTopic.DEFENSE_ACTION:
        newState = this.handleDefenseAction(state, payload);
        break;

      case TelemetryTopic.UI_ACTION:
        if (payload.action === 'REPLAY_RESET') {
          incidentManager.reset();
          return {
            ...state,
            nodes: INITIAL_NODES,
            links: INITIAL_LINKS,
            identities: INITIAL_IDENTITIES,
            roles: INITIAL_ROLES,
            identityRelationships: INITIAL_RELATIONSHIPS,
            environments: INITIAL_ENVIRONMENTS,
            knowledgeBase: INITIAL_KNOWLEDGE_BASE,
            agentOrchestration: INITIAL_ORCHESTRATION,
            events: [],
            incidents: [],
            threatLevel: 'low',
            spreadVelocity: 1.0,
            metrics: TelemetryService.calculateMetrics(INITIAL_NODES)
          };
        }
        
        if (payload.action === 'INCIDENT_UPDATE_STATUS') {
          incidentManager.updateIncidentStatus(payload.incidentId, payload.status);
          return {
            ...state,
            incidents: incidentManager.getIncidents()
          };
        }

        if (payload.action === 'INCIDENT_ADD_NOTE') {
          incidentManager.addAnalystNote(payload.incidentId, payload.note);
          return {
            ...state,
            incidents: incidentManager.getIncidents()
          };
        }

        if (payload.action === 'DEFENSE_DISMISS') {
          defenseEngine.updateRecommendationStatus(payload.recId, 'dismissed');
          return {
            ...state,
            defenseRecommendations: defenseEngine.analyze(state.nodes, state.links, state.incidents)
          };
        }

        if (payload.action === 'DEFENSE_APPLY') {
          defenseEngine.updateRecommendationStatus(payload.recId, 'applied');
          // Actually apply the defense action
          return state; // The action should be handled by a specific telemetry topic or trigger
        }

        return state;

      case TelemetryTopic.INCIDENT_UPDATE:
        newState = {
          ...state,
          incidents: incidentManager.getIncidents()
        };
        break;

      case TelemetryTopic.DEFENSE_UPDATE:
        newState = {
          ...state,
          defenseRecommendations: defenseEngine.analyze(state.nodes, state.links, state.incidents)
        };
        if (payload.activeModules) {
          newState.activeDefenseModules = payload.activeModules;
        }
        if (payload.spreadVelocity !== undefined) {
          newState.spreadVelocity = payload.spreadVelocity;
        }
        break;

      case TelemetryTopic.INCIDENT_REPORT:
        {
          const incidents = [...state.incidents, payload];
          const campaigns = CorrelationEngine.correlateIncident(payload, state.knowledgeBase);
          newState = {
            ...state,
            incidents,
            knowledgeBase: {
              ...state.knowledgeBase,
              campaigns
            }
          };
        }
        break;

      case TelemetryTopic.IAM_IDENTITY_COMPROMISED:
        newState = {
          ...state,
          identities: state.identities.map(id => 
            id.id === payload.identityId ? { ...id, status: 'compromised', riskScore: 100 } : id
          )
        };
        newState = this.handleGenericLog(newState, envelope);
        break;

      case TelemetryTopic.IAM_PRIVILEGE_CHANGE:
        newState = {
          ...state,
          identities: state.identities.map(id => 
            id.id === payload.identityId 
              ? { ...id, roles: payload.action === 'grant' ? [...id.roles, payload.roleId] : id.roles.filter(r => r !== payload.roleId) } 
              : id
          )
        };
        newState = this.handleGenericLog(newState, envelope);
        break;

      default:
        // By default, if it's a known non-UI topic, we might just add it to the event feed
        if ((topic as TelemetryTopic) !== TelemetryTopic.METRIC_TICK) {
          newState = this.handleGenericLog(state, envelope);
        }
    }

    // After any event that adds to events array, we should potentially correlate incidents
    // But handleAttackAlert/handleGenericLog already create events.
    return newState;
  }

  private static handleNodeUpdate(state: SimulationState, payload: NodeUpdatePayload): SimulationState {
    const newNodes = state.nodes.map(node => 
      node.id === payload.nodeId 
        ? { ...node, ...payload } 
        : node
    );

    const baselines = CorrelationEngine.updateBaselines([
      TelemetryService.createEvent(`Update for ${payload.nodeId}`, 'system', 'low', 'system', payload.nodeId)
    ], state.knowledgeBase.baselines);

    const agentOrchestration = AgentOrchestrator.processTelemetry(
      TelemetryService.createEvent(`Node update for ${payload.nodeId}`, 'system', 'low', 'system', payload.nodeId),
      state.agentOrchestration,
      newNodes
    );

    return {
      ...state,
      nodes: newNodes,
      knowledgeBase: {
        ...state.knowledgeBase,
        baselines
      },
      agentOrchestration
    };
  }

  private static handleMetricTick(state: SimulationState, payload: MetricTickPayload): SimulationState {
    const agentOrchestration = AgentOrchestrator.processTelemetry(
      TelemetryService.createEvent('Metric tick received', 'system', 'low'),
      state.agentOrchestration,
      state.nodes
    );

    return {
      ...state,
      metrics: { ...state.metrics, ...payload.metrics },
      threatLevel: payload.metrics.threatLevel,
      agentOrchestration
    };
  }

  private static handleAttackAlert(state: SimulationState, payload: AttackAlertPayload): SimulationState {
    const payloadTimestamp = payload.timestamp ? new Date(payload.timestamp) : undefined;

    const newEvent = TelemetryService.createEvent(
      payload.message || `ALERT: ${payload.attackType.toUpperCase()} detected on ${payload.targetId}`,
      'attack',
      payload.severity,
      payload.origin,
      payload.targetId,
      undefined,
      undefined,
      payloadTimestamp
    );

    const newNodes = payload.targetId ? state.nodes.map(node => 
      node.id === payload.targetId 
        ? { ...node, lastAttackType: payload.attackType as any } 
        : node
    ) : state.nodes;

    const incidents = incidentManager.processEvent(newEvent, newNodes, state.links);

    // Correlate last updated incident into campaigns
    const lastIncident = incidents.sort((a,b) => b.lastUpdateTime.getTime() - a.lastUpdateTime.getTime())[0];
    let campaigns = state.knowledgeBase.campaigns;
    if (lastIncident) {
      campaigns = CorrelationEngine.correlateIncident(lastIncident, state.knowledgeBase);
    }

    const agentOrchestration = AgentOrchestrator.processTelemetry(
      newEvent,
      state.agentOrchestration,
      newNodes
    );

    return {
      ...state,
      nodes: newNodes,
      events: [newEvent, ...state.events].slice(0, 100),
      incidents,
      knowledgeBase: {
        ...state.knowledgeBase,
        campaigns
      },
      agentOrchestration
    };
  }

  private static handleDefenseAction(state: SimulationState, payload: DefenseActionPayload): SimulationState {
    const payloadTimestamp = payload.timestamp ? new Date(payload.timestamp) : undefined;
    const action = payload.action;
    const targetId = payload.targetId;

    let updatedNodes = [...state.nodes];
    let updatedLinks = [...state.links];
    let updatedIdentities = [...state.identities];
    let updatedActiveModules = [...state.activeDefenseModules];
    let updatedSpreadVelocity = state.spreadVelocity;

    let displayMessage = payload.message || `DEFENSE COUNTERMEASURE: ${action.replace('_', ' ').toUpperCase()} initiated on ${targetId || 'global'}`;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    switch (action) {
      case 'isolate_node': {
        if (targetId) {
          updatedNodes = updatedNodes.map(n =>
            n.id === targetId ? { ...n, status: 'isolated' as const, threatScore: 10, degradation: 100, latency: 999 } : n
          );
          // Block links connected to isolated node
          updatedLinks = updatedLinks.map(l =>
            l.source === targetId || l.target === targetId ? { ...l, traffic: 0, riskWeight: 0 } : l
          );
          displayMessage = `DEFENSE CODES ACTIVE: Node [${targetId}] isolated from core network routing table. All physical ingress/egress links severed.`;
          severity = 'high';
        }
        break;
      }
      
      case 'quarantine_workload': {
        if (targetId) {
          updatedNodes = updatedNodes.map(n =>
            n.id === targetId ? { ...n, status: 'quarantined' as any, threatScore: 15, vulnerability: 0.1, degradation: 80, latency: 150 } : n
          );
          updatedLinks = updatedLinks.map(l =>
            l.source === targetId || l.target === targetId ? { ...l, traffic: 0.1, riskWeight: 0.05 } : l
          );
          displayMessage = `CONTAINMENT ACTIVE: Workload [${targetId}] placed in secure hypervisor sandbox. Direct API permissions revoked.`;
          severity = 'high';
        }
        break;
      }

      case 'disable_account': {
        if (targetId) {
          updatedIdentities = updatedIdentities.map(id =>
            id.id === targetId ? { ...id, status: 'locked' as any, riskScore: 0 } : id
          );
          displayMessage = `IAM OVERRIDE: Revoked credentials and killed active SAML/OAuth sessions for identity [${targetId}].`;
          severity = 'high';
        }
        break;
      }

      case 'block_traffic': {
        if (targetId) {
          updatedLinks = updatedLinks.map(l =>
            l.source === targetId || l.target === targetId ? { ...l, traffic: 0, riskWeight: 0 } : l
          );
          displayMessage = `TRAFFIC ENFORCEMENT: Segmented all link pathways interacting with perimeter waypoint [${targetId}].`;
          severity = 'medium';
        }
        break;
      }

      case 'rotate_credentials': {
        if (targetId) {
          updatedNodes = updatedNodes.map(n =>
            n.id === targetId ? { ...n, credentialsRotated: true, vulnerability: Math.max(0.05, n.vulnerability * 0.3) } : n
          );
          updatedIdentities = updatedIdentities.map(id =>
            id.accessibleNodes.includes(targetId) ? { ...id, riskScore: Math.max(5, id.riskScore * 0.2) } : id
          );
          displayMessage = `SECRET ROTATION: Successfully rolled and synchronized master certs/secrets on [${targetId}]. Vulnerability minimized.`;
          severity = 'medium';
        }
        break;
      }

      case 'enable_containment_mode': {
        if (!updatedActiveModules.includes('auto_containment')) {
          updatedActiveModules.push('auto_containment');
        }
        if (!updatedActiveModules.includes('neural_isolation')) {
          updatedActiveModules.push('neural_isolation');
        }
        updatedSpreadVelocity = 0.15;
        displayMessage = `SHIELD ACTIVE: Global Containment engaged. Autonomous policy and neural isolation filters active at maximum speed.`;
        severity = 'critical';
        break;
      }

      case 'increase_monitoring': {
        if (targetId) {
          updatedNodes = updatedNodes.map(n =>
            n.id === targetId ? { ...n, monitoringLevel: 100, vulnerability: Math.max(0.1, n.vulnerability * 0.7) } : n
          );
          displayMessage = `DEEP TELEMETRY: Hardened eBPF diagnostics and carbon tracers deployed on [${targetId}]. Audit levels raised to maximum.`;
          severity = 'low';
        }
        break;
      }

      case 'terminate_process': {
        if (targetId) {
          updatedNodes = updatedNodes.map(n =>
            n.id === targetId ? { ...n, status: n.status === 'compromised' ? 'degraded' as any : 'safe' as any, threatScore: 0, degradation: n.status === 'compromised' ? 40 : 10, latency: 15 } : n
          );
          displayMessage = `PROCESS TERMINATION: Malicious task binaries killed on [${targetId}]. Node restored to clean degraded state.`;
          severity = 'high';
        }
        break;
      }

      case 'reroute_traffic': {
        if (targetId) {
          updatedLinks = updatedLinks.map(l =>
            l.source === targetId || l.target === targetId ? { ...l, traffic: 0.05, riskWeight: 0.02 } : l
          );
          updatedLinks = updatedLinks.map(l =>
            l.source !== targetId && l.target !== targetId ? { ...l, traffic: Math.min(1.0, l.traffic + 0.2) } : l
          );
          displayMessage = `DYNAMIC ROUTING: Rerouted high-priority enterprise transactions to bypass logical path boundary [${targetId}].`;
          severity = 'medium';
        }
        break;
      }

      case 'segment_network_zone': {
        updatedLinks = updatedLinks.map(l => {
          const sNode = state.nodes.find(n => n.id === l.source);
          const tNode = state.nodes.find(n => n.id === l.target);
          if (sNode && tNode && sNode.environmentId !== tNode.environmentId) {
            return { ...l, traffic: 0, riskWeight: 0 };
          }
          return l;
        });
        displayMessage = `ZONE ISOLATION: Logical zoning enforced. All cross-environment border links severed. Prod zone in total air-gap lock.`;
        severity = 'critical';
        break;
      }

      default:
        break;
    }

    const newEvent = TelemetryService.createEvent(
      displayMessage,
      'defense',
      severity,
      payload.source || 'orchestrator_core',
      targetId,
      undefined,
      undefined,
      payloadTimestamp
    );

    const incidents = incidentManager.processEvent(newEvent, updatedNodes, updatedLinks);
    const metrics = TelemetryService.calculateMetrics(updatedNodes);

    return {
      ...state,
      nodes: updatedNodes,
      links: updatedLinks,
      identities: updatedIdentities,
      activeDefenseModules: updatedActiveModules,
      spreadVelocity: updatedSpreadVelocity,
      events: [newEvent, ...state.events].slice(0, 100),
      incidents,
      threatLevel: metrics.threatLevel,
      metrics
    };
  }

  private static handleGenericLog(state: SimulationState, envelope: TelemetryEnvelope): SimulationState {
    const payload = envelope.payload;
    const payloadTimestamp = payload.timestamp ? new Date(payload.timestamp) : undefined;

    const newEvent = TelemetryService.createEvent(
      payload.message || `System event: ${envelope.topic}`,
      'system',
      payload.severity || 'low',
      payload.source,
      payload.targetId || payload.nodeId,
      undefined,
      undefined,
      payloadTimestamp
    );

    const incidents = incidentManager.processEvent(newEvent, state.nodes, state.links);

    return {
      ...state,
      events: [newEvent, ...state.events].slice(0, 100),
      incidents
    };
  }
}
