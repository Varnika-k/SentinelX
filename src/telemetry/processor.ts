import { SimulationState } from '../types/simulation';
import { TelemetryTopic, TelemetryEnvelope, NodeUpdatePayload, MetricTickPayload, AttackAlertPayload, DefenseActionPayload } from './schemas';
import { TelemetryService } from '../core/telemetry-service';
import { INITIAL_NODES, INITIAL_LINKS } from '../lib/simulation-data';
import { incidentManager } from '../core/incident-manager';
import { defenseEngine } from '../core/defense-engine';

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
          return {
            ...state,
            nodes: INITIAL_NODES,
            links: INITIAL_LINKS,
            events: [],
            incidents: [],
            threatLevel: 'low',
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

    return {
      ...state,
      nodes: newNodes
    };
  }

  private static handleMetricTick(state: SimulationState, payload: MetricTickPayload): SimulationState {
    return {
      ...state,
      metrics: { ...state.metrics, ...payload.metrics },
      threatLevel: payload.metrics.threatLevel
    };
  }

  private static handleAttackAlert(state: SimulationState, payload: AttackAlertPayload): SimulationState {
    const newEvent = TelemetryService.createEvent(
      payload.message || `ALERT: ${payload.attackType.toUpperCase()} detected on ${payload.targetId}`,
      'attack',
      payload.severity,
      payload.origin,
      payload.targetId
    );

    const newNodes = payload.targetId ? state.nodes.map(node => 
      node.id === payload.targetId 
        ? { ...node, lastAttackType: payload.attackType as any } 
        : node
    ) : state.nodes;

    const incidents = incidentManager.processEvent(newEvent, newNodes, state.links);

    return {
      ...state,
      nodes: newNodes,
      events: [newEvent, ...state.events].slice(0, 100),
      incidents
    };
  }

  private static handleDefenseAction(state: SimulationState, payload: DefenseActionPayload): SimulationState {
    const newEvent = TelemetryService.createEvent(
      payload.message || `DEFENSE: ${payload.module.replace('_', ' ').toUpperCase()} ${payload.action} on ${payload.targetId || 'global'}`,
      'defense',
      'low',
      'system',
      payload.targetId
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
    const newEvent = TelemetryService.createEvent(
      payload.message || `System event: ${envelope.topic}`,
      'system',
      payload.severity || 'low',
      payload.source,
      payload.targetId || payload.nodeId
    );

    const incidents = incidentManager.processEvent(newEvent, state.nodes, state.links);

    return {
      ...state,
      events: [newEvent, ...state.events].slice(0, 100),
      incidents
    };
  }
}
