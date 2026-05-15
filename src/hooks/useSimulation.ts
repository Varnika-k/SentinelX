import { useState, useCallback, useEffect, useRef } from 'react';
import { NetworkNode, NetworkLink, SimulationEvent, SimulationState, AttackType, NodeStatus, ScenarioType, DefenseModule } from '../types/simulation';
import { INITIAL_NODES, INITIAL_LINKS, getThreatSeverity, createEvent } from '../lib/simulation-data';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    nodes: INITIAL_NODES,
    links: INITIAL_LINKS,
    events: [createEvent('Sentinel Core Online. Systems nominal.', 'system', 'low')],
    isSimulating: false,
    threatLevel: 'low',
    metrics: { safe: INITIAL_NODES.length, compromised: 0, isolated: 0 },
    simulationSpeed: 3000,
    activeDefenseModules: ['firewall'],
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioTimeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const cleanupScenarios = useCallback(() => {
    scenarioTimeoutRefs.current.forEach(clearTimeout);
    scenarioTimeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => cleanupScenarios();
  }, [cleanupScenarios]);

  const updateMetrics = useCallback((nodes: NetworkNode[]) => {
    const safe = nodes.filter(n => n.status === 'safe').length;
    const compromised = nodes.filter(n => n.status === 'compromised').length;
    const isolated = nodes.filter(n => n.status === 'isolated').length;
    return { safe, compromised, isolated };
  }, []);

  const launchAttack = useCallback((type: AttackType, specificTargetId?: string, intensity: number = 0.8) => {
    setState(prev => {
      let targetNodeId = specificTargetId || '';
      if (!targetNodeId) {
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

      if (!targetNodeId) return prev;

      const newNodes = prev.nodes.map(n => 
        n.id === targetNodeId ? { ...n, status: 'compromised' as NodeStatus, threatScore: Math.floor(intensity * 100) } : n
      );

      const newEvent = createEvent(`CRITICAL: ${type.toUpperCase()} detected on ${targetNodeId} (Intensity: ${Math.floor(intensity * 100)}%)`, 'attack', 'high', targetNodeId);
      
      const metrics = updateMetrics(newNodes);
      return {
        ...prev,
        nodes: newNodes,
        events: [newEvent, ...prev.events],
        isSimulating: true,
        threatLevel: getThreatSeverity(metrics.compromised, prev.nodes.length),
        metrics,
      };
    });
  }, [updateMetrics]);

  const updateNodeVulnerability = useCallback((nodeId: string, vulnerability: number) => {
    setState(prev => {
      const newNodes = prev.nodes.map(n => n.id === nodeId ? { ...n, vulnerability } : n);
      return { ...prev, nodes: newNodes };
    });
  }, []);

  const updateZoneVulnerability = useCallback((type: string, vulnerability: number) => {
    setState(prev => {
      const newNodes = prev.nodes.map(n => n.type === type ? { ...n, vulnerability } : n);
      return { ...prev, nodes: newNodes };
    });
  }, []);

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
        createEvent(`DEFENDER: Isolated compromised node ${n.id}`, 'defense', 'medium', n.id)
      );

      const metrics = updateMetrics(newNodes);
      return {
        ...prev,
        nodes: newNodes,
        events: [...defendersEvents, ...prev.events],
        threatLevel: getThreatSeverity(metrics.compromised, prev.nodes.length),
        metrics,
      };
    });
  }, [updateMetrics]);

  const isolateNode = useCallback((nodeId: string) => {
    setState(prev => {
      const node = prev.nodes.find(n => n.id === nodeId);
      if (!node || node.status === 'isolated') return prev;

      const newNodes = prev.nodes.map(n => 
        n.id === nodeId ? { ...n, status: 'isolated' as NodeStatus, threatScore: 10 } : n
      );

      const newEvent = createEvent(`DEFENDER: Manually isolated node ${node.label}`, 'defense', 'medium', nodeId);
      
      const metrics = updateMetrics(newNodes);
      return {
        ...prev,
        nodes: newNodes,
        events: [newEvent, ...prev.events],
        threatLevel: getThreatSeverity(metrics.compromised, prev.nodes.length),
        metrics,
      };
    });
  }, [updateMetrics]);

  const resetSimulation = useCallback(() => {
    setState({
      nodes: INITIAL_NODES,
      links: INITIAL_LINKS,
      events: [createEvent('System Reset. Network topology cleared.', 'system', 'low')],
      isSimulating: false,
      threatLevel: 'low',
      metrics: { safe: INITIAL_NODES.length, compromised: 0, isolated: 0 },
      simulationSpeed: 3000,
      activeDefenseModules: ['firewall'],
    });
  }, []);

  const setSimulationSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, simulationSpeed: speed }));
  }, []);

  const toggleDefenseModule = useCallback((module: DefenseModule) => {
    setState(prev => {
      const active = prev.activeDefenseModules.includes(module);
      const modules = active 
        ? prev.activeDefenseModules.filter(m => m !== module)
        : [...prev.activeDefenseModules, module];
      
      const newEvent = createEvent(`SYSTEM: Defence module ${module.replace('_', ' ').toUpperCase()} ${active ? 'disabled' : 'enabled'}`, 'system', 'low');
      
      return { 
        ...prev, 
        activeDefenseModules: modules,
        events: [newEvent, ...prev.events]
      };
    });
  }, []);

  // Simulation Loop for propagation
  useEffect(() => {
    if (state.threatLevel === 'low' && !state.nodes.some(n => n.status === 'compromised')) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setState(prev => {
        const compromisedNodes = prev.nodes.filter(n => n.status === 'compromised');
        
        // Auto-containment logic
        if (prev.activeDefenseModules.includes('auto_containment') && compromisedNodes.length > 0) {
           // Small chance or delay for auto-containment could be here, but let's make it direct for feedback
           const newNodes = prev.nodes.map(n => 
             n.status === 'compromised' ? { ...n, status: 'isolated' as NodeStatus, threatScore: 20 } : n
           );
           const containmentEvents = compromisedNodes.map(n => 
             createEvent(`AUTO_SHIELD: Contained ${n.id} via autonomous protocol`, 'defense', 'medium', n.id)
           );
           const metrics = updateMetrics(newNodes);
           return {
             ...prev,
             nodes: newNodes,
             events: [...containmentEvents, ...prev.events],
             threatLevel: getThreatSeverity(metrics.compromised, prev.nodes.length),
             metrics,
           };
        }

        if (compromisedNodes.length === 0) return prev;

        const newNodes = [...prev.nodes];
        let spreadOccured = false;
        const newEvents: SimulationEvent[] = [];

        compromisedNodes.forEach(source => {
          // Check neighbors
          const neighbors = prev.links
            .filter(l => l.source === source.id || l.target === source.id)
            .map(l => l.source === source.id ? l.target : l.source);

          neighbors.forEach(targetId => {
            const nodeIndex = newNodes.findIndex(n => n.id === targetId);
            const targetNode = newNodes[nodeIndex];

            if (targetNode && targetNode.status === 'safe') {
              // Neural isolation reduces spread chance
              const defenseMultiplier = prev.activeDefenseModules.includes('neural_isolation') ? 0.4 : 1.0;
              // Firewall reduces spread chance 
              const firewallMultiplier = prev.activeDefenseModules.includes('firewall') ? 0.7 : 1.0;

              // Probability of spread based on target vulnerability and source intensity
              const intensityFactor = source.threatScore / 100;
              const spreadChance = targetNode.vulnerability * 0.4 * intensityFactor * defenseMultiplier * firewallMultiplier; 
              if (Math.random() < spreadChance) {
                newNodes[nodeIndex] = { ...targetNode, status: 'compromised', threatScore: 70 };
                newEvents.push(createEvent(`ALERT: Breach propagated to ${targetId}`, 'compromise', 'high', targetId));
                spreadOccured = true;
              }
            }
          });
        });

        if (!spreadOccured) return prev;

        const metrics = updateMetrics(newNodes);
        return {
          ...prev,
          nodes: newNodes,
          events: [...newEvents, ...prev.events],
          threatLevel: getThreatSeverity(metrics.compromised, prev.nodes.length),
          metrics,
        };
      });
    }, state.simulationSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.threatLevel, state.nodes, state.simulationSpeed, updateMetrics, state.activeDefenseModules]);

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
    updateZoneVulnerability
  };
}
