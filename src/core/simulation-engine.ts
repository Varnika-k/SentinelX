import { SimulationState, AttackType, DefenseModule, AttackPayload } from '../types/simulation';
import { NetworkNode, NodeStatus } from '../types/network';
import { TelemetryService } from './telemetry-service';

export class SimulationEngine {
  static processSpread(state: SimulationState): Partial<SimulationState> | null {
    const compromisedNodes = state.nodes.filter(n => n.status === 'compromised');
    if (compromisedNodes.length === 0) return null;

    const newNodes = [...state.nodes];
    let spreadOccurred = false;
    const newEvents = [];

    for (const source of compromisedNodes) {
      const neighbors = state.links
        .filter(l => l.source === source.id || l.target === source.id)
        .map(l => l.source === source.id ? l.target : l.source);

      for (const targetId of neighbors) {
        const nodeIndex = newNodes.findIndex(n => n.id === targetId);
        const targetNode = newNodes[nodeIndex];

        if (targetNode && targetNode.status === 'safe') {
          const defenseMultiplier = state.activeDefenseModules.includes('neural_isolation') ? 0.4 : 1.0;
          const firewallMultiplier = state.activeDefenseModules.includes('firewall') ? 0.7 : 1.0;
          
          const intensityFactor = source.threatScore / 100;
          const spreadChance = targetNode.vulnerability * 0.4 * intensityFactor * defenseMultiplier * firewallMultiplier; 
          
          if (Math.random() < spreadChance) {
            newNodes[nodeIndex] = { ...targetNode, status: 'compromised', threatScore: 70 };
            newEvents.push(TelemetryService.createEvent(
               `ALERT: Breach propagated to ${targetId}`, 
               'compromise', 
               'high', 
               source.id, 
               targetId
            ));
            spreadOccurred = true;
          }
        }
      }
    }

    if (!spreadOccurred) return null;

    const metrics = TelemetryService.calculateMetrics(newNodes);
    return {
      nodes: newNodes,
      events: [...newEvents, ...state.events],
      threatLevel: metrics.threatLevel,
      metrics
    };
  }

  static applyAutonomousDefense(state: SimulationState): Partial<SimulationState> | null {
    if (!state.activeDefenseModules.includes('auto_containment')) return null;
    
    const compromisedNodes = state.nodes.filter(n => n.status === 'compromised');
    if (compromisedNodes.length === 0) return null;

    const newNodes = state.nodes.map(n => 
      n.status === 'compromised' ? { ...n, status: 'isolated' as NodeStatus, threatScore: 20 } : n
    );

    const containmentEvents = compromisedNodes.map(n => 
      TelemetryService.createEvent(`AUTO_SHIELD: Contained ${n.id} via autonomous protocol`, 'defense', 'medium', 'system', n.id)
    );

    const metrics = TelemetryService.calculateMetrics(newNodes);
    return {
      nodes: newNodes,
      events: [...containmentEvents, ...state.events],
      threatLevel: metrics.threatLevel,
      metrics
    };
  }

  static executeAttack(state: SimulationState, payload: AttackPayload): Partial<SimulationState> {
    const { type, targetId, intensity } = payload;
    
    const newNodes = state.nodes.map(n => 
      n.id === targetId ? { ...n, status: 'compromised' as NodeStatus, threatScore: Math.floor(intensity * 100) } : n
    );

    const newEvent = TelemetryService.createEvent(
      `CRITICAL: ${type.toUpperCase()} detected on ${targetId} (Intensity: ${Math.floor(intensity * 100)}%)`, 
      'attack', 
      'high', 
      payload.origin || 'external_actor',
      targetId
    );
    
    const metrics = TelemetryService.calculateMetrics(newNodes);
    return {
      nodes: newNodes,
      events: [newEvent, ...state.events],
      isSimulating: true,
      threatLevel: metrics.threatLevel,
      metrics,
    };
  }
}
