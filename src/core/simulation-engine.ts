import { SimulationState, AttackType, DefenseModule, AttackPayload } from '../types/simulation';
import { NetworkNode, NodeStatus } from '../types/network';
import { TelemetryService } from './telemetry-service';

export class SimulationEngine {
  static processSpread(state: SimulationState): Partial<SimulationState> | null {
    const compromisedNodes = state.nodes.filter(n => n.status === 'compromised');
    const compromisedIdentities = state.identities.filter(i => i.status === 'compromised');
    
    if (compromisedNodes.length === 0 && compromisedIdentities.length === 0) return null;

    const newNodes = [...state.nodes];
    const newIdentities = [...state.identities];
    let spreadOccurred = false;
    const newEvents = [];

    // 1. Identity Propagation: Compromised identities compromise their accessible nodes
    for (const identity of compromisedIdentities) {
      for (const nodeId of identity.accessibleNodes) {
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        const targetNode = newNodes[nodeIndex];
        
        if (targetNode && targetNode.status === 'safe') {
          // Access via valid (but stolen) credentials is hard to block
          const detectionChance = state.activeDefenseModules.includes('heuristic_scanner') ? 0.3 : 0.1;
          
          if (Math.random() > detectionChance) {
            newNodes[nodeIndex] = { ...targetNode, status: 'compromised', threatScore: 90 };
            newEvents.push(TelemetryService.createEvent(
              `IAM_BREACH: ${identity.name} credentials used to compromise ${targetNode.label}`,
              'compromise',
              'high',
              identity.id,
              targetNode.id
            ));
            spreadOccurred = true;
          } else {
            newEvents.push(TelemetryService.createEvent(
              `IAM_PREVENTION: Suspicious access attempt by ${identity.name} blocked on ${targetNode.label}`,
              'defense',
              'medium',
              'heuristic_scanner',
              targetNode.id
            ));
          }
        }
      }
    }

    // 2. Network-based Spread (existing logic)
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
          const scrubberMultiplier = state.activeDefenseModules.includes('traffic_scrubbing') ? 0.6 : 1.0;
          const quantumMultiplier = state.activeDefenseModules.includes('quantum_hardening') ? 0.5 : 1.0;
          
          const intensityFactor = (source.threatScore || 50) / 100;
          const velocityFactor = state.spreadVelocity || 1.0;
          const spreadChance = targetNode.vulnerability * 0.4 * intensityFactor * defenseMultiplier * firewallMultiplier * scrubberMultiplier * quantumMultiplier * velocityFactor; 
          
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
      identities: newIdentities,
      events: [...newEvents, ...state.events].slice(0, 50),
      threatLevel: metrics.threatLevel,
      metrics
    };
  }

  static applyAutonomousDefense(state: SimulationState): Partial<SimulationState> | null {
    if (!state.activeDefenseModules.includes('auto_containment')) return null;
    
    const compromisedNodes = state.nodes.filter(n => n.status === 'compromised');
    const compromisedIdentities = state.identities.filter(i => i.status === 'compromised');
    
    if (compromisedNodes.length === 0 && compromisedIdentities.length === 0) return null;

    const newNodes = state.nodes.map(n => 
      n.status === 'compromised' ? { ...n, status: 'isolated' as NodeStatus, threatScore: 20 } : n
    );

    const newIdentities = state.identities.map(i => 
      i.status === 'compromised' ? { ...i, status: 'locked' as any } : i
    );

    const containmentEvents = [
      ...compromisedNodes.map(n => 
        TelemetryService.createEvent(`AUTO_SHIELD: Contained ${n.id} via autonomous protocol`, 'defense', 'medium', 'system', n.id)
      ),
      ...compromisedIdentities.map(i => 
        TelemetryService.createEvent(`IAM_SHIELD: Revoked access for compromised identity ${i.name}`, 'defense', 'high', 'system', i.id)
      )
    ];

    const metrics = TelemetryService.calculateMetrics(newNodes);
    return {
      nodes: newNodes,
      identities: newIdentities,
      events: [...containmentEvents, ...state.events].slice(0, 50),
      threatLevel: metrics.threatLevel,
      metrics
    };
  }

  static executeAttack(state: SimulationState, payload: AttackPayload): Partial<SimulationState> {
    const { type, targetId, identityId, intensity } = payload;
    
    let newEvents = [];
    let newNodes = [...state.nodes];
    let newIdentities = [...state.identities];

    // Handle Identity-Centric Attack
    if (identityId) {
      const idIdx = newIdentities.findIndex(i => i.id === identityId);
      if (idIdx !== -1) {
        newIdentities[idIdx] = { 
          ...newIdentities[idIdx], 
          status: 'compromised' as any, 
          riskScore: 95 
        };
        newEvents.push(TelemetryService.createEvent(
          `IDENTITY_ALERT: Account ${newIdentities[idIdx].name} hijacked via ${type.toUpperCase()}`,
          'attack',
          'high',
          payload.origin || 'external_identity_broker',
          identityId
        ));
      }
    }

    // Handle Infrastructure Attack
    if (targetId) {
      // Check if attack is blocked by active defenses
      let isBlocked = false;
      let blockMessage = "";

      if (type === 'ddos' && state.activeDefenseModules.includes('traffic_scrubbing')) {
        if (Math.random() < 0.6) {
          isBlocked = true;
          blockMessage = "TRAFFIC_SCRUBBER: DDoS attack neutralized at edge";
        }
      } else if (type === 'zeroday' && state.activeDefenseModules.includes('quantum_hardening')) {
        if (Math.random() < 0.4) {
          isBlocked = true;
          blockMessage = "QUANTUM_SHIELD: Zero-day exploit signature mismatch";
        }
      }

      if (isBlocked) {
        const blockEvent = TelemetryService.createEvent(blockMessage, 'defense', 'high', 'system', targetId);
        return {
          events: [blockEvent, ...state.events],
        };
      }

      const nodeIdx = newNodes.findIndex(n => n.id === targetId);
      if (nodeIdx !== -1) {
        newNodes[nodeIdx] = { 
          ...newNodes[nodeIdx], 
          status: 'compromised' as NodeStatus, 
          threatScore: Math.floor(intensity * 100) 
        };
        newEvents.push(TelemetryService.createEvent(
          `CRITICAL: ${type.toUpperCase()} detected on ${targetId} (Intensity: ${Math.floor(intensity * 100)}%)`, 
          'attack', 
          'high', 
          payload.origin || 'external_actor',
          targetId
        ));
      }
    }
    
    const metrics = TelemetryService.calculateMetrics(newNodes);
    return {
      nodes: newNodes,
      identities: newIdentities,
      events: [...newEvents, ...state.events].slice(0, 50),
      isSimulating: true,
      threatLevel: metrics.threatLevel,
      metrics,
    };
  }
}
