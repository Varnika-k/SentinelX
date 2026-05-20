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

    const newEvent = TelemetryService.createEvent(
      payload.message || `DEFENSE: ${payload.module.replace('_', ' ').toUpperCase()} ${payload.action} on ${payload.targetId || 'global'}`,
      'defense',
      'low',
      'system',
      payload.targetId,
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
