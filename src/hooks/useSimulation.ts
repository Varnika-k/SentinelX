import { useState, useCallback, useEffect, useRef } from 'react';
import { SimulationState, AttackType, ScenarioType, DefenseModule, AttackPayload } from '../types/simulation';
import { NodeStatus, NetworkNode } from '../types/network';
import { INITIAL_NODES, INITIAL_LINKS, INITIAL_IDENTITIES, INITIAL_ROLES, INITIAL_RELATIONSHIPS, INITIAL_ENVIRONMENTS, INITIAL_KNOWLEDGE_BASE, INITIAL_ORCHESTRATION } from '../lib/simulation-data';
import { TelemetryService } from '../core/telemetry-service';
import { SimulationEngine } from '../core/simulation-engine';
import { telemetryBus } from '../telemetry/bus';
import { TelemetryTopic, NodeUpdatePayload, AttackAlertPayload, MetricTickPayload } from '../telemetry/schemas';

import { EnterpriseIngestionManager, ingestionManager } from '../telemetry/ingestion-manager';
import { ReplayEngine } from '../telemetry/replay';

export function useSimulation(telemetryState: SimulationState) {
  const telemetryStateRef = useRef(telemetryState);
  useEffect(() => {
    telemetryStateRef.current = telemetryState;
  }, [telemetryState]);

  useEffect(() => {
    ingestionManager.startIngestion();
    return () => ingestionManager.stopIngestion();
  }, []);

  const state = telemetryState;

  const updateIncidentStatus = useCallback((incidentId: string, status: any) => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'INCIDENT_UPDATE_STATUS',
      incidentId,
      status
    });
  }, []);

  const addIncidentNote = useCallback((incidentId: string, note: string) => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'INCIDENT_ADD_NOTE',
      incidentId,
      note
    });
  }, []);

  const orchestrateDefense = useCallback((action: string, targetId?: string) => {
    telemetryBus.publish(TelemetryTopic.DEFENSE_ACTION, {
      source: 'operator',
      module: 'defense_orchestrator',
      action,
      targetId,
      result: 'success'
    });
  }, []);

  const applyDefenseRecommendation = useCallback((rec: any) => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      source: 'operator',
      action: 'DEFENSE_APPLY',
      recId: rec.id
    });

    orchestrateDefense(rec.action, rec.targetId);
  }, [orchestrateDefense]);

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
    const currentNodes = telemetryStateRef.current.nodes;
    const currentEventsLength = telemetryStateRef.current.events.length;
    const currentThreatLevel = telemetryStateRef.current.threatLevel;

    if (updates.nodes) {
      updates.nodes.forEach((newNode) => {
        const oldNode = currentNodes.find(n => n.id === newNode.id);
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
          threatLevel: updates.metrics.threatLevel || currentThreatLevel,
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

    if (updates.events && updates.events.length > currentEventsLength) {
      const newOnly = updates.events.slice(0, updates.events.length - currentEventsLength);
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
  }, []);

  const cleanupScenarios = useCallback(() => {
    scenarioTimeoutRefs.current.forEach(clearTimeout);
    scenarioTimeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => cleanupScenarios();
  }, [cleanupScenarios]);

  const launchAttack = useCallback((type: AttackType, specificTargetId?: string, intensity: number = 0.8, identityId?: string) => {
    const currentState = telemetryStateRef.current;
    let targetNodeId = specificTargetId || '';
    let targetIdentityId = identityId || '';

    if (!targetNodeId && !targetIdentityId) {
      if (type === 'phishing') {
        const targets = currentState.nodes.filter(n => n.type === 'workstation' && n.status === 'safe');
        if (targets.length > 0) targetNodeId = targets[Math.floor(Math.random() * targets.length)].id;
      } else if (type === 'insider') {
        const targets = currentState.nodes.filter(n => (n.type === 'database' || n.type === 'hr-system') && n.status === 'safe');
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
    
    const updates = SimulationEngine.executeAttack(currentState, payload);
    
    // Emit to bus
    telemetryBus.publish(TelemetryTopic.ATTACK_ALERT, {
      source: 'simulation_coordinator',
      attackType: type,
      targetId: targetNodeId || targetIdentityId,
      severity: 'high',
      origin: payload.origin || 'external_actor'
    } as AttackAlertPayload);

    emitTelemetry(updates);
  }, [emitTelemetry]);

  const updateNodeVulnerability = useCallback((nodeId: string, vulnerability: number) => {
    const currentState = telemetryStateRef.current;
    const newNodes = currentState.nodes.map(n => n.id === nodeId ? { ...n, vulnerability } : n);
    emitTelemetry({ nodes: newNodes });
  }, [emitTelemetry]);

  const updateZoneVulnerability = useCallback((type: string, vulnerability: number) => {
    const currentState = telemetryStateRef.current;
    const newNodes = currentState.nodes.map(n => n.type === type ? { ...n, vulnerability } : n);
    emitTelemetry({ nodes: newNodes });
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
    const currentState = telemetryStateRef.current;
    const compromisedNodes = currentState.nodes.filter(n => n.status === 'compromised');
    if (compromisedNodes.length === 0) return;

    const newNodes = currentState.nodes.map(n => 
      n.status === 'compromised' ? { ...n, status: 'isolated' as NodeStatus, threatScore: 20 } : n
    );

    const defendersEvents = compromisedNodes.map(n => 
      TelemetryService.createEvent(`DEFENDER: Isolated compromised node ${n.id}`, 'defense', 'medium', 'system', n.id)
    );

    const metrics = TelemetryService.calculateMetrics(newNodes);
    
    const updates = {
      nodes: newNodes,
      events: defendersEvents,
      metrics
    };

    emitTelemetry(updates);
  }, [cleanupScenarios, emitTelemetry]);

  const isolateNode = useCallback((nodeId: string) => {
    orchestrateDefense('isolate_node', nodeId);
  }, [orchestrateDefense]);

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
      defenseStrategyMode: 'balanced' as const,
      containmentStability: 96,
      propagationReductionIndex: 45,
      recoveryTrackingRating: 88,
    };
    
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      action: 'REPLAY_RESET',
      source: 'operator'
    });
    
    emitTelemetry(initialState);
  }, [emitTelemetry]);

  const setSpreadVelocity = useCallback((velocity: number) => {
    emitTelemetry({ spreadVelocity: velocity });
    telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
      source: 'operator',
      message: `SIMULATION: Spread velocity set to ${velocity.toFixed(2)}x`,
      severity: 'low'
    });
  }, [emitTelemetry]);

  const setDefenseStrategyMode = useCallback((mode: 'balanced' | 'aggressive' | 'forensics' | 'resilience') => {
    const defaultStability = mode === 'aggressive' ? 98 : mode === 'resilience' ? 92 : mode === 'forensics' ? 24 : 96;
    const defaultReduction = mode === 'aggressive' ? 82 : mode === 'resilience' ? 58 : mode === 'forensics' ? 8 : 45;
    const defaultRecovery = mode === 'resilience' ? 94 : mode === 'aggressive' ? 25 : mode === 'forensics' ? 40 : 78;

    telemetryBus.publish(TelemetryTopic.DEFENSE_UPDATE, {
      source: 'operator',
      defenseStrategyMode: mode,
      containmentStability: defaultStability,
      propagationReductionIndex: defaultReduction,
      recoveryTrackingRating: defaultRecovery
    });

    telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
      source: 'operator',
      message: `STRATEGY OVERRIDE: Active counter-defense protocol set to [${mode.toUpperCase()}]`,
      severity: 'high'
    });
  }, []);

  const setSimulationSpeed = useCallback((speed: number) => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      action: 'SET_SIMULATION_SPEED',
      source: 'operator',
      speed
    });
  }, []);

  const toggleSimulation = useCallback(() => {
    telemetryBus.publish(TelemetryTopic.UI_ACTION, {
      action: 'TOGGLE_SIMULATION',
      source: 'operator'
    });
  }, []);

  const toggleDefenseModule = useCallback((module: DefenseModule) => {
    const currentState = telemetryStateRef.current;
    const active = currentState.activeDefenseModules.includes(module);
    const modules = active 
      ? currentState.activeDefenseModules.filter(m => m !== module)
      : [...currentState.activeDefenseModules, module];
    
    const newEvent = TelemetryService.createEvent(`SYSTEM: Defense module ${module.replace('_', ' ').toUpperCase()} ${active ? 'disabled' : 'enabled'}`, 'system', 'low');
    
    const updates = { 
      activeDefenseModules: modules,
      events: [newEvent]
    };

    emitTelemetry(updates);
  }, [emitTelemetry]);

  useEffect(() => {
    const replayStatus = ReplayEngine.getStatus();
    const isReplayingValue = replayStatus.isPlaying || (replayStatus.totalEvents > 0 && replayStatus.currentIndex < replayStatus.totalEvents);

    if (!telemetryState.isSimulating || isReplayingValue) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const currentState = telemetryStateRef.current;
      
      const innerReplayStatus = ReplayEngine.getStatus();
      const innerReplayingValue = innerReplayStatus.isPlaying || (innerReplayStatus.totalEvents > 0 && innerReplayStatus.currentIndex < innerReplayStatus.totalEvents);
      if (innerReplayingValue) return;

      const defenseUpdates = SimulationEngine.applyAutonomousDefense(currentState);
      if (defenseUpdates) {
        emitTelemetry(defenseUpdates);
        return;
      }

      const spreadUpdates = SimulationEngine.processSpread(currentState);
      if (spreadUpdates) {
        emitTelemetry(spreadUpdates);
      }
    }, telemetryState.simulationSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [telemetryState.isSimulating, telemetryState.simulationSpeed, emitTelemetry]);

  return {
    state,
    launchAttack,
    launchScenario,
    activateDefense,
    isolateNode,
    orchestrateDefense,
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
    setDefenseStrategyMode,
    toggleSimulation
  };
}

