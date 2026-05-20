import { useState, useCallback, useEffect, useRef } from 'react';
import { SimulationState, AttackType, ScenarioType, DefenseModule, AttackPayload } from '../types/simulation';
import { NodeStatus, NetworkNode } from '../types/network';
import { INITIAL_NODES, INITIAL_LINKS, INITIAL_IDENTITIES, INITIAL_ROLES, INITIAL_RELATIONSHIPS, INITIAL_ENVIRONMENTS, INITIAL_KNOWLEDGE_BASE, INITIAL_ORCHESTRATION } from '../lib/simulation-data';
import { TelemetryService } from '../core/telemetry-service';
import { SimulationEngine } from '../core/simulation-engine';
import { telemetryBus } from '../telemetry/bus';
import { TelemetryTopic, NodeUpdatePayload, AttackAlertPayload, MetricTickPayload } from '../telemetry/schemas';

import { EnterpriseIngestionManager, ingestionManager } from '../telemetry/ingestion-manager';

export function useSimulation() {
  useEffect(() => {
    ingestionManager.startIngestion();
    return () => ingestionManager.stopIngestion();
  }, []);

  const [state, setState] = useState<SimulationState>({
    nodes: INITIAL_NODES,
    links: INITIAL_LINKS,
    identities: INITIAL_IDENTITIES,
    roles: INITIAL_ROLES,
    identityRelationships: INITIAL_RELATIONSHIPS,
    environments: INITIAL_ENVIRONMENTS,
    knowledgeBase: INITIAL_KNOWLEDGE_BASE,
    agentOrchestration: INITIAL_ORCHESTRATION,
    events: [TelemetryService.createEvent('Sentinel Core Online. Systems nominal.', 'system', 'low')],
    incidents: [],
    defenseRecommendations: [],
    isSimulating: false,
    threatLevel: 'low',
    metrics: TelemetryService.calculateMetrics(INITIAL_NODES),
    simulationSpeed: 3000,
    spreadVelocity: 1.0,
    activeDefenseModules: ['firewall'],
  });

  const updateIncidentStatus = useCallback((incidentId: string, status: any) => {
    // In a real app, this would be an API call
    // Here, we'll manually update the local simulation state AND emit a telemetry event so other stores sync
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'INCIDENT_UPDATE_STATUS',
      incidentId,
      status
    });

    // We also need to trigger the processor to sync its internal manager if it's separate
    // In this singleton implementation, the processor will handle it if we define the logic there.
  }, []);

  const addIncidentNote = useCallback((incidentId: string, note: string) => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'INCIDENT_ADD_NOTE',
      incidentId,
      note
    });
  }, []);

  const applyDefenseRecommendation = useCallback((rec: any) => {
    // 1. Mark as applied in defense engine
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'DEFENSE_APPLY',
      recId: rec.id
    });

    // 2. Perform the actual action
    if (rec.action === 'isolate_node') {
      isolateNode(rec.targetId);
    } else if (rec.action === 'escalate_incident') {
      updateIncidentStatus(rec.targetId, 'escalated');
    }
  }, []);

  const dismissDefenseRecommendation = useCallback((recId: string) => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'DEFENSE_DISMISS',
      recId
    });
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioTimeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Telemetry Emission Helper
  const emitTelemetry = useCallback((updates: Partial<SimulationState>) => {
    if (updates.nodes) {
      // Find diffs and emit NODE_UPDATE for each changed node
      // This mimics real granular telemetry
      updates.nodes.forEach((newNode, i) => {
        const oldNode = state.nodes[i];
        if (oldNode && (oldNode.status !== newNode.status || oldNode.threatScore !== newNode.threatScore)) {
          telemetryBus.publish(TelemetryTopic.NODE_UPDATE, {
            source: 'simulation_engine',
            nodeId: newNode.id,
            status: newNode.status,
            threatScore: newNode.threatScore,
            vulnerability: newNode.vulnerability
          } as NodeUpdatePayload);
        }
      });
    }

    if (updates.metrics) {
      const metricPayload: MetricTickPayload = {
        source: 'simulation_engine',
        metrics: {
          safe: updates.metrics.safe,
          compromised: updates.metrics.compromised,
          isolated: updates.metrics.isolated,
          total: updates.metrics.total,
          threatLevel: updates.metrics.threatLevel || state.threatLevel,
          systemHealth: updates.metrics.systemHealth
        }
      };
      telemetryBus.publish(TelemetryTopic.METRIC_TICK, metricPayload);
    }

    if (updates.activeDefenseModules || updates.spreadVelocity !== undefined) {
      telemetryBus.publish(TelemetryTopic.DEFENSE_UPDATE, {
        source: 'simulation_engine',
        activeModules: updates.activeDefenseModules,
        spreadVelocity: updates.spreadVelocity
      });
    }

    // We can also publish generic system logs
    if (updates.events && updates.events.length > state.events.length) {
      const newOnly = updates.events.slice(0, updates.events.length - state.events.length);
      newOnly.forEach(ev => {
        telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
          source: ev.origin || 'system',
          target: ev.target,
          message: ev.message,
          severity: ev.severity,
          nodeId: ev.target
        });
      });
    }
  }, [state.nodes, state.events.length, state.threatLevel]);

  const cleanupScenarios = useCallback(() => {
    scenarioTimeoutRefs.current.forEach(clearTimeout);
    scenarioTimeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => cleanupScenarios();
  }, [cleanupScenarios]);

  const launchAttack = useCallback((type: AttackType, specificTargetId?: string, intensity: number = 0.8, identityId?: string) => {
    setState(prev => {
      let targetNodeId = specificTargetId || '';
      let targetIdentityId = identityId || '';

      if (!targetNodeId && !targetIdentityId) {
        if (type === 'phishing') {
          const targets = prev.nodes.filter(n => n.type === 'workstation' && n.status === 'safe');
          if (targets.length > 0) targetNodeId = targets[Math.floor(Math.random() * targets.length)].id;
        } else if (type === 'insider') {
          const targets = prev.nodes.filter(n => (n.type === 'database' || n.type === 'hr-system') && n.status === 'safe');
          if (targets.length > 0) targetNodeId = targets[Math.floor(Math.random() * targets.length)].id;
        } else {
          targetNodeId = 'gw-1';
        }
      }

      const payload: AttackPayload = { 
        type, 
        targetId: targetNodeId || undefined, 
        identityId: targetIdentityId || undefined,
        intensity 
      };
      
      const updates = SimulationEngine.executeAttack(prev, payload);
      
      // Emit to bus
      telemetryBus.publish(TelemetryTopic.ATTACK_ALERT, {
        source: 'simulation_coordinator',
        attackType: type,
        targetId: targetNodeId || targetIdentityId,
        severity: 'high',
        origin: payload.origin || 'external_actor'
      } as AttackAlertPayload);

      emitTelemetry(updates);
      
      return { ...prev, ...updates };
    });
  }, [emitTelemetry]);

  const updateNodeVulnerability = useCallback((nodeId: string, vulnerability: number) => {
    setState(prev => {
      const newNodes = prev.nodes.map(n => n.id === nodeId ? { ...n, vulnerability } : n);
      emitTelemetry({ nodes: newNodes });
      return {
        ...prev,
        nodes: newNodes
      };
    });
  }, [emitTelemetry]);

  const updateZoneVulnerability = useCallback((type: string, vulnerability: number) => {
    setState(prev => {
      const newNodes = prev.nodes.map(n => n.type === type ? { ...n, vulnerability } : n);
      emitTelemetry({ nodes: newNodes });
      return {
        ...prev,
        nodes: newNodes
      };
    });
  }, [emitTelemetry]);

  const launchScenario = useCallback((scenario: ScenarioType) => {
    cleanupScenarios();
    
    const trigger = (type: AttackType, targetId: string, delay: number) => {
      const timeout = setTimeout(() => {
        launchAttack(type, targetId);
      }, delay);
      scenarioTimeoutRefs.current.push(timeout);
    };

    switch (scenario) {
      case 'corporate_espionage':
        trigger('phishing', 'pc-2', 0);
        trigger('insider', 'db-1', 1500);
        trigger('apt', 'srv-1', 3000);
        break;
      case 'critical_infrastructure':
        trigger('zeroday', 'fw-1', 0);
        trigger('ddos', 'gw-1', 1000);
        trigger('ransomware', 'srv-1', 2000);
        break;
      case 'ransomware_storm':
        trigger('ransomware', 'pc-1', 0);
        trigger('ransomware', 'pc-2', 500);
        trigger('ransomware', 'hr-1', 1000);
        trigger('ransomware', 'srv-1', 2000);
        break;
      case 'ransomware_outbreak':
        trigger('ransomware', 'gw-1', 0);
        trigger('ransomware', 'srv-1', 1500);
        trigger('ransomware', 'pc-1', 3000);
        break;
      case 'data_exfiltration':
        trigger('phishing', 'pc-1', 0);
        trigger('insider', 'db-1', 2000);
        trigger('apt', 'hr-1', 4000);
        break;
      case 'supply_chain':
        trigger('insider', 'fw-1', 0);
        trigger('ransomware', 'srv-1', 2000);
        trigger('ddos', 'gw-1', 4000);
        break;
      case 'zero_day':
        trigger('zeroday', 'fw-1', 0);
        trigger('phishing', 'pc-2', 1000);
        trigger('insider', 'hr-1', 2000);
        break;
    }
  }, [cleanupScenarios, launchAttack]);

  const activateDefense = useCallback(() => {
    cleanupScenarios();
    setState(prev => {
      const compromisedNodes = prev.nodes.filter(n => n.status === 'compromised');
      if (compromisedNodes.length === 0) return prev;

      const newNodes = prev.nodes.map(n => 
        n.status === 'compromised' ? { ...n, status: 'isolated' as NodeStatus, threatScore: 20 } : n
      );

      const defendersEvents = compromisedNodes.map(n => 
        TelemetryService.createEvent(`DEFENDER: Isolated compromised node ${n.id}`, 'defense', 'medium', 'system', n.id)
      );

      const metrics = TelemetryService.calculateMetrics(newNodes);
      return {
        ...prev,
        nodes: newNodes,
        events: [...defendersEvents, ...prev.events],
        threatLevel: metrics.threatLevel,
        metrics,
      };
    });
  }, []);

  const isolateNode = useCallback((nodeId: string) => {
    setState(prev => {
      const node = prev.nodes.find(n => n.id === nodeId);
      if (!node || node.status === 'isolated') return prev;

      const newNodes = prev.nodes.map(n => 
        n.id === nodeId ? { ...n, status: 'isolated' as NodeStatus, threatScore: 10 } : n
      );

      const newEvent = TelemetryService.createEvent(`DEFENDER: Manually isolated node ${node.label}`, 'defense', 'medium', 'operator', nodeId);
      
      const metrics = TelemetryService.calculateMetrics(newNodes);
      const updates = {
        nodes: newNodes,
        events: [newEvent, ...prev.events],
        threatLevel: metrics.threatLevel,
        metrics,
      };

      emitTelemetry(updates);
      return { ...prev, ...updates };
    });
  }, [emitTelemetry]);

  const resetSimulation = useCallback(() => {
    const initialState = {
      nodes: INITIAL_NODES,
      links: INITIAL_LINKS,
      identities: INITIAL_IDENTITIES,
      roles: INITIAL_ROLES,
      identityRelationships: INITIAL_RELATIONSHIPS,
      environments: INITIAL_ENVIRONMENTS,
      knowledgeBase: INITIAL_KNOWLEDGE_BASE,
      agentOrchestration: INITIAL_ORCHESTRATION,
      events: [TelemetryService.createEvent('System Reset. Network topology cleared.', 'system', 'low')],
      incidents: [],
      defenseRecommendations: [],
      isSimulating: false,
      threatLevel: 'low' as const,
      metrics: TelemetryService.calculateMetrics(INITIAL_NODES),
      simulationSpeed: 3000,
      spreadVelocity: 1.0,
      activeDefenseModules: ['firewall'] as DefenseModule[],
    };
    
    setState(initialState);
    emitTelemetry(initialState);
  }, [emitTelemetry]);

  const setSpreadVelocity = useCallback((velocity: number) => {
    setState(prev => {
      emitTelemetry({ spreadVelocity: velocity });
      return { ...prev, spreadVelocity: velocity };
    });
    telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
      source: 'operator',
      message: `SIMULATION: Spread velocity set to ${velocity.toFixed(2)}x`,
      severity: 'low'
    });
  }, []);

  const setSimulationSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, simulationSpeed: speed }));
    telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
      source: 'operator',
      message: `SIMULATION: Speed adjusted to ${speed}ms`,
      severity: 'low'
    });
  }, []);

  const toggleSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isSimulating: !prev.isSimulating }));
    telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
      source: 'operator',
      message: `SIMULATION: State toggled`,
      severity: 'low'
    });
  }, []);

  const toggleDefenseModule = useCallback((module: DefenseModule) => {
    setState(prev => {
      const active = prev.activeDefenseModules.includes(module);
      const modules = active 
        ? prev.activeDefenseModules.filter(m => m !== module)
        : [...prev.activeDefenseModules, module];
      
      const newEvent = TelemetryService.createEvent(`SYSTEM: Defense module ${module.replace('_', ' ').toUpperCase()} ${active ? 'disabled' : 'enabled'}`, 'system', 'low');
      
      const updates = { 
        activeDefenseModules: modules,
        events: [newEvent, ...prev.events]
      };

      emitTelemetry(updates);
      return { ...prev, ...updates };
    });
  }, [emitTelemetry]);

  useEffect(() => {
    if (!state.isSimulating) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setState(prev => {
        // 1. Check Autonomous Defense
        const defenseUpdates = SimulationEngine.applyAutonomousDefense(prev);
        if (defenseUpdates) {
          emitTelemetry(defenseUpdates);
          return { ...prev, ...defenseUpdates };
        }

        // 2. Process Spread
        const spreadUpdates = SimulationEngine.processSpread(prev);
        if (spreadUpdates) {
          emitTelemetry(spreadUpdates);
          return { ...prev, ...spreadUpdates };
        }

        return prev;
      });
    }, state.simulationSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isSimulating, state.threatLevel, state.nodes, state.simulationSpeed, state.activeDefenseModules, emitTelemetry]);

  return {
    state,
    launchAttack,
    launchScenario,
    activateDefense,
    isolateNode,
    resetSimulation,
    setSimulationSpeed,
    toggleDefenseModule,
    updateNodeVulnerability,
    updateZoneVulnerability,
    updateIncidentStatus,
    addIncidentNote,
    applyDefenseRecommendation,
    dismissDefenseRecommendation,
    setSpreadVelocity,
    toggleSimulation
  };
}
