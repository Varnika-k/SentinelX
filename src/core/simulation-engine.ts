import { SimulationState, AttackType, DefenseModule, AttackPayload } from '../types/simulation';
import { NetworkNode, NodeStatus, NetworkLink } from '../types/network';
import { TelemetryService } from './telemetry-service';
import { defenseEngine } from './defense-engine';

export class SimulationEngine {
  static processSpread(state: SimulationState): Partial<SimulationState> | null {
    const compromisedNodes = state.nodes.filter(n => n.status === 'compromised');
    const compromisedIdentities = state.identities.filter(i => i.status === 'compromised');
    
    if (compromisedNodes.length === 0 && compromisedIdentities.length === 0) return null;

    const newNodes = state.nodes.map(n => ({ ...n }));
    const newLinks = state.links.map(l => ({ ...l }));
    const newIdentities = state.identities.map(i => ({ ...i }));
    
    let spreadOccurred = false;
    const newEvents = [];

    // Realistic Defensive Modifiers and Costs/Benefits based on Current Strategy
    const currentMode = state.defenseStrategyMode || 'balanced';
    let strategyMultiplier = 1.0;
    if (currentMode === 'aggressive') {
      strategyMultiplier = 0.25; // Heavily checks propagation
    } else if (currentMode === 'forensics') {
      strategyMultiplier = 1.6;  // More logs/spread allowed to analyze
    } else if (currentMode === 'resilience') {
      strategyMultiplier = 0.5;  // Dynamic healing & rerouting active
    }

    const hasFirewall = state.activeDefenseModules.includes('firewall');
    const hasNeuralIso = state.activeDefenseModules.includes('neural_isolation');
    const hasScrubber = state.activeDefenseModules.includes('traffic_scrubbing');
    const hasQuantum = state.activeDefenseModules.includes('quantum_hardening');
    const hasHeuristic = state.activeDefenseModules.includes('heuristic_scanner');

    // 1. Identity-Based Propagation
    for (const identity of compromisedIdentities) {
      // Locked identities cannot propagate
      if ((identity as any).status === 'locked') continue;

      for (const nodeId of identity.accessibleNodes) {
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) continue;
        const targetNode = newNodes[nodeIndex];

        if (targetNode && targetNode.status === 'safe') {
          // Check if bypassed or credential-stolen bypasses standard firewall
          const detectionChance = hasHeuristic ? 0.4 * strategyMultiplier : 0.1;
          
          if (Math.random() > detectionChance) {
            newNodes[nodeIndex] = { 
              ...targetNode, 
              status: 'compromised', 
              threatScore: 85,
              degradation: 40,
              latency: 35,
              lastAttackType: 'phishing'
            };
            newEvents.push(TelemetryService.createEvent(
              `IDENTITY_BREACH: Stolen credentials of [${identity.name}] used to authenticate against ${targetNode.label} (${targetNode.id}).`,
              'compromise',
              'high',
              identity.id,
              targetNode.id
            ));
            spreadOccurred = true;
          } else {
            newEvents.push(TelemetryService.createEvent(
              `HEURISTIC_PREVENTION: Alerted credential fatigue. Mitigated suspicious access attempt by [${identity.name}] validation on ${targetNode.label}.`,
              'defense',
              'medium',
              'heuristic_scanner',
              targetNode.id
            ));
          }
        }
      }
    }

    // 2. Topology-Native Attack Spread and Multi-Type Cascade Logic
    for (const source of compromisedNodes) {
      const attackType = source.lastAttackType || 'ransomware';

      // 1-Hop Neighbors mapped natively using graph links configuration
      const neighbors = newLinks
        .filter(l => l.source === source.id || l.target === source.id)
        .map(l => {
          const neighborId = l.source === source.id ? l.target : l.source;
          return { neighborId, link: l };
        });

      for (const { neighborId, link } of neighbors) {
        const targetIndex = newNodes.findIndex(n => n.id === neighborId);
        if (targetIndex === -1) continue;
        const targetNode = newNodes[targetIndex];

        // Ensure link is not completely severed (isolated routing path)
        if (link.traffic === 0 && link.riskWeight === 0) continue;

        if (targetNode && (targetNode.status === 'safe' || targetNode.status === 'degraded')) {
          
          let spreadChance = 0.3;
          let isBlocked = false;
          let blockMessage = "";

          // DDoS volumetric clog propagation logic
          if (attackType === 'ddos') {
            spreadChance = 0.7 * (source.threatScore / 100) * strategyMultiplier;
            // DDoS easily cascades to neighbors but degrades them rather than full encryption compromise
            if (hasScrubber && Math.random() < 0.65) {
              isBlocked = true;
              blockMessage = `TRAFFIC_SCRUBBER: Filtered DNS amplification flood originating from [${source.id}] targeting [${targetNode.id}]`;
            } else if (hasFirewall && Math.random() < 0.3) {
              isBlocked = true;
              blockMessage = `FIREWALL_BLOCK: Rate-limited packet volume from [${source.id}] to [${targetNode.id}]`;
            }

            if (isBlocked) {
              newEvents.push(TelemetryService.createEvent(blockMessage, 'defense', 'medium', 'system', targetNode.id));
              continue;
            }

            if (Math.random() < spreadChance) {
              // Clog routing paths visually and operationally
              link.traffic = 1.0;
              link.riskWeight = 0.8;
              
              const currentLatency = targetNode.latency || 10;
              newNodes[targetIndex] = {
                ...targetNode,
                status: 'degraded',
                degradation: Math.min(100, (targetNode.degradation || 0) + 40),
                latency: Math.min(1000, currentLatency + 250),
                threatScore: Math.min(100, (targetNode.threatScore || 0) + 30),
                lastAttackType: 'ddos'
              };

              newEvents.push(TelemetryService.createEvent(
                `DDOS_CONGESTION: High-density volumetric transit flooded interface on [${targetNode.label}]. Interface Latency spike: ${newNodes[targetIndex].latency}ms.`,
                'attack',
                'medium',
                source.id,
                targetNode.id
              ));
              spreadOccurred = true;
            }
          }

          // Ransomware brutal spread logic
          else if (attackType === 'ransomware') {
            spreadChance = targetNode.vulnerability * 0.55 * strategyMultiplier;
            
            if (hasNeuralIso && Math.random() < 0.5) {
              isBlocked = true;
              blockMessage = `NEURAL_ISOLATION: Segmented host host-bus adapter to trap ransomware loop from [${source.id}] to [${targetNode.id}]`;
            } else if (hasFirewall && Math.random() < 0.2) {
              isBlocked = true;
              blockMessage = `FIREWALL_ALERT: Blocked standard encrypted command payloads on [${targetNode.id}]`;
            }

            if (isBlocked) {
              newEvents.push(TelemetryService.createEvent(blockMessage, 'defense', 'medium', 'system', targetNode.id));
              continue;
            }

            if (Math.random() < spreadChance) {
              // Encrypt completely! Shifting status to Compromised, high degradation, latency
              link.traffic = 0.95;
              link.riskWeight = 0.95;

              newNodes[targetIndex] = {
                ...targetNode,
                status: 'compromised',
                degradation: 100,
                latency: 180,
                threatScore: 95,
                lastAttackType: 'ransomware'
              };

              newEvents.push(TelemetryService.createEvent(
                `RANSOMWARE_ENCRYPTION: Cryptographic payload activated on [${targetNode.label}]. MBR compromised. Volume encryption complete.`,
                'compromise',
                'high',
                source.id,
                targetNode.id
              ));
              spreadOccurred = true;
            }
          }

          // Phishing propagation
          else if (attackType === 'phishing') {
            // Silently crawl and bridge workstation trust paths
            spreadChance = 0.5 * strategyMultiplier;
            if (hasHeuristic && Math.random() < 0.45) {
              isBlocked = true;
              blockMessage = `HEURISTIC_SHIELD: Identified rogue lateral credential hop targeting [${targetNode.label}]`;
            }

            if (isBlocked) {
              newEvents.push(TelemetryService.createEvent(blockMessage, 'defense', 'low', 'system', targetNode.id));
              continue;
            }

            if (Math.random() < spreadChance) {
              newNodes[targetIndex] = {
                ...targetNode,
                status: 'compromised',
                degradation: 20,
                latency: 20,
                threatScore: 50,
                lastAttackType: 'phishing'
              };
              // Attacker hijacks accessible systems using stealth pathways
              link.traffic = 0.4;
              link.riskWeight = 0.6;

              newEvents.push(TelemetryService.createEvent(
                `STEALTH_PROPAGATION: Threat actor moved laterally into [${targetNode.label}] via hijacked workstation access tunnels. No active alarms triggered early.`,
                'compromise',
                'medium',
                source.id,
                targetNode.id
              ));
              spreadOccurred = true;
            }
          }

          // Zero-day exploit spread logic
          else if (attackType === 'zero-day') {
            // Zero-day bypasses initial defense modules completely for the first few stages!
            spreadChance = 0.75 * strategyMultiplier;
            
            // Check if quantum hardening is enabled (specifically designed for unpatched zero-days)
            if (hasQuantum && Math.random() < 0.6) {
              isBlocked = true;
              blockMessage = `QUANTUM_HARDENING: Zero-day signature bypass neutralized via runtime application self-protection (RASP) on [${targetNode.label}]`;
            }

            if (isBlocked) {
              newEvents.push(TelemetryService.createEvent(blockMessage, 'defense', 'high', 'system', targetNode.id));
              continue;
            }

            if (Math.random() < spreadChance) {
              // Target is hit with sudden high-impact payload
              link.traffic = 0.8;
              link.riskWeight = 0.85;

              newNodes[targetIndex] = {
                ...targetNode,
                status: 'compromised',
                degradation: 70,
                latency: 60,
                threatScore: 99,
                lastAttackType: 'zero-day'
              };

              // Trigger delayed cascade message
              newEvents.push(TelemetryService.createEvent(
                `ZERO_DAY_EXPLOIT: Remote memory overflow exploit invoked on unpatched dependency on [${targetNode.label}]. Root access acquired.`,
                'compromise',
                'critical',
                source.id,
                targetNode.id
              ));
              spreadOccurred = true;
            }
          }

          // APT and Insider Movement
          else if (attackType === 'apt' || attackType === 'insider') {
            spreadChance = 0.45 * strategyMultiplier;
            if (hasHeuristic && Math.random() < 0.5) {
              isBlocked = true;
              blockMessage = `SIEM_DETECTION: High frequency trust queries detected on [${targetNode.label}]. Terminating APT process.`;
            }

            if (isBlocked) {
              newEvents.push(TelemetryService.createEvent(blockMessage, 'defense', 'high', 'system', targetNode.id));
              continue;
            }

            if (Math.random() < spreadChance) {
              link.traffic = 0.3;
              link.riskWeight = 0.7;

              newNodes[targetIndex] = {
                ...targetNode,
                status: 'compromised',
                degradation: 35,
                latency: 25,
                threatScore: 85,
                lastAttackType: attackType
              };

              newEvents.push(TelemetryService.createEvent(
                `APT_BREACH: Threat actor established silent persistence backdoor on [${targetNode.label}]. Initiating sensitive dataset discovery.`,
                'compromise',
                'high',
                source.id,
                targetNode.id
              ));
              spreadOccurred = true;
            }
          }

          // Attacker adaptive tension behavior
          if (spreadOccurred && currentMode === 'aggressive' && Math.random() < 0.35) {
            newEvents.push(TelemetryService.createEvent(
              `WARNING: Adversary encountered aggressive SD-WAN lockups. Re-routing exfiltration conduits around traditional perimeter boundaries.`,
              'attack',
              'medium',
              source.id
            ));
          }
        }
      }
    }

    // 3. Autonomous Healing and Recovery Protocols under RESILIENCE mode
    if (currentMode === 'resilience') {
      newNodes.forEach((node, idx) => {
        if ((node.status === 'compromised' || node.status === 'degraded') && Math.random() < 0.3) {
          newNodes[idx] = { 
            ...node, 
            status: 'safe', 
            threatScore: 8,
            degradation: Math.max(0, (node.degradation || 0) - 80),
            latency: 12
          };
          newEvents.push(TelemetryService.createEvent(
            `RESILIENCE_RECOVERY: Autonomous micro-reboot and code reverting cleansed compromised host [${node.label}]. Warm registry re-initialized.`,
            'defense',
            'medium',
            'system',
            node.id
          ));
          spreadOccurred = true;
        }
      });
    }

    if (!spreadOccurred) return null;

    const metrics = TelemetryService.calculateMetrics(newNodes);
    
    // Auto rebuild defense recommendation matrices on the fly
    const nextRecs = defenseEngine.analyze(newNodes, newLinks, state.incidents);

    return {
      nodes: newNodes,
      links: newLinks,
      identities: newIdentities,
      events: [...newEvents, ...state.events].slice(0, 75),
      threatLevel: metrics.threatLevel,
      metrics,
      defenseRecommendations: nextRecs
    };
  }

  static applyAutonomousDefense(state: SimulationState): Partial<SimulationState> | null {
    if (!state.activeDefenseModules.includes('auto_containment')) return null;
    
    const compromisedNodes = state.nodes.filter(n => n.status === 'compromised');
    const compromisedIdentities = state.identities.filter(i => i.status === 'compromised');
    
    if (compromisedNodes.length === 0 && compromisedIdentities.length === 0) return null;

    const newNodes = state.nodes.map(n => 
      n.status === 'compromised' 
        ? { ...n, status: 'isolated' as NodeStatus, threatScore: 10, degradation: 100, latency: 999 } 
        : n
    );

    const newLinks = state.links.map(l => {
      const isConnectedToCompromised = compromisedNodes.some(cn => cn.id === l.source || cn.id === l.target);
      return isConnectedToCompromised ? { ...l, traffic: 0, riskWeight: 0 } : l;
    });

    const newIdentities = state.identities.map(i => 
      i.status === 'compromised' ? { ...i, status: 'locked' as any } : i
    );

    const containmentEvents = [
      ...compromisedNodes.map(n => 
        TelemetryService.createEvent(`AUTO_SHIELD_ISOLATION: Sensed encryption anomaly. Severed routing links connecting [${n.label}].`, 'defense', 'high', 'system', n.id)
      ),
      ...compromisedIdentities.map(i => 
        TelemetryService.createEvent(`AUTO_IAM_SHIELD: Revoked OAuth access keys and locked compromised profile [${i.name}].`, 'defense', 'high', 'system', i.id)
      )
    ];

    const metrics = TelemetryService.calculateMetrics(newNodes);
    const nextRecs = defenseEngine.analyze(newNodes, newLinks, state.incidents);

    return {
      nodes: newNodes,
      links: newLinks,
      identities: newIdentities,
      events: [...containmentEvents, ...state.events].slice(0, 75),
      threatLevel: metrics.threatLevel,
      metrics,
      defenseRecommendations: nextRecs
    };
  }

  static executeAttack(state: SimulationState, payload: AttackPayload): Partial<SimulationState> {
    const { type, targetId, identityId, intensity } = payload;
    
    let newEvents = [];
    let newNodes = state.nodes.map(n => ({ ...n }));
    let newLinks = state.links.map(l => ({ ...l }));
    let newIdentities = state.identities.map(i => ({ ...i }));

    // Acknowledge strategy parameters
    const currentMode = state.defenseStrategyMode || 'balanced';

    // 1. Target Identity Compromise (Phishing & Insiders)
    if (identityId) {
      const idIdx = newIdentities.findIndex(i => i.id === identityId);
      if (idIdx !== -1) {
        newIdentities[idIdx] = { 
          ...newIdentities[idIdx], 
          status: 'compromised' as any, 
          riskScore: 99
        };

        // Phishing can escalate privileges and award highly permissive IAM roles
        if (type === 'phishing') {
          newIdentities[idIdx].roles = [...newIdentities[idIdx].roles, 'role-admin', 'role-database-read'];
          newEvents.push(TelemetryService.createEvent(
            `IDENTITY_EXPLOITATION: Account [${newIdentities[idIdx].name}] compromised via targeted spear phishing. Dynamic IDP roles updated with admin privileges.`,
            'attack',
            'high',
            payload.origin || 'external_broker',
            identityId
          ));
        } else {
          newEvents.push(TelemetryService.createEvent(
            `MALICIOUS_INSIDER: Active credentials for administrator [${newIdentities[idIdx].name}] hijacking detected. Rogue access tokens propagated.`,
            'attack',
            'high',
            payload.origin || 'internal_anomaly',
            identityId
          ));
        }
      }
    }

    // 2. Target Infrastructure Compromise
    if (targetId) {
      let isBlocked = false;
      let blockMessage = "";

      const hasScrubber = state.activeDefenseModules.includes('traffic_scrubbing');
      const hasQuantum = state.activeDefenseModules.includes('quantum_hardening');

      if (type === 'ddos' && hasScrubber) {
        if (Math.random() < 0.72) {
          isBlocked = true;
          blockMessage = "TRAFFIC_SCRUBBER: Successfully diverted 850,000 bots volumetric SYN flood at the edge cluster.";
        }
      } else if (type === 'zeroday' && hasQuantum) {
        if (Math.random() < 0.45) {
          isBlocked = true;
          blockMessage = "QUANTUM_SHIELD: Zero-day polymorphic binary load blocked due to secure boot certificate validation failure.";
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
        const node = newNodes[nodeIdx];
        
        // Behavioral configuration set per Attack Type
        if (type === 'ddos') {
          // DDoS: high latency, moderate degradation, Visually flood connected paths
          newNodes[nodeIdx] = { 
            ...node, 
            status: 'compromised' as NodeStatus, 
            threatScore: 95,
            degradation: 85,
            latency: 680,
            lastAttackType: 'ddos'
          };

          // Heavy link load visual effect
          newLinks = newLinks.map(l => 
            l.source === targetId || l.target === targetId ? { ...l, traffic: 1.0, riskWeight: 0.8 } : l
          );

          newEvents.push(TelemetryService.createEvent(
            `ALERT: High Volume Volumetric DDoS attack peaking on [${node.label}]. Queue size overflow. Ingress latency critical.`, 
            'attack', 
            'high', 
            payload.origin || 'external_botnet',
            targetId
          ));
        } 
        else if (type === 'ransomware') {
          // Ransomware: full system encryption
          newNodes[nodeIdx] = { 
            ...node, 
            status: 'compromised' as NodeStatus, 
            threatScore: 90,
            degradation: 100,
            latency: 120,
            lastAttackType: 'ransomware'
          };

          newEvents.push(TelemetryService.createEvent(
            `ALERT: Ransomware strain '.LOCKOUT_V2' detected on [${node.label}]. Direct shadow copy deletion complete. Ransom demand published.`, 
            'attack', 
            'critical', 
            payload.origin || 'external_cyber_actor',
            targetId
          ));
        } 
        else if (type === 'zeroday') {
          // Zero-Day: silence early, then collapse. Bypasses metrics
          newNodes[nodeIdx] = { 
            ...node, 
            status: 'compromised' as NodeStatus, 
            threatScore: 99,
            degradation: 60,
            latency: 45,
            lastAttackType: 'zero-day'
          };

          newEvents.push(TelemetryService.createEvent(
            `ALERT: Zero-day RCE bypass triggered on [${node.label}]. Host interface memory mapping hijacked. Executing shellcode.`, 
            'attack', 
            'critical', 
            payload.origin || 'advanced_nation_state',
            targetId
          ));
        }
        else {
          // Phishing, APT, Insider
          newNodes[nodeIdx] = { 
            ...node, 
            status: 'compromised' as NodeStatus, 
            threatScore: Math.floor(intensity * 100),
            degradation: 30,
            latency: 20,
            lastAttackType: type
          };

          newEvents.push(TelemetryService.createEvent(
            `ALERT: Persistent infiltration via [${type.toUpperCase()}] established foothold on [${node.label}] (Vulnerability index: ${node.vulnerability}).`, 
            'attack', 
            'high', 
            payload.origin || 'external_actor',
            targetId
          ));
        }
      }
    }
    
    const metrics = TelemetryService.calculateMetrics(newNodes);
    const nextRecs = defenseEngine.analyze(newNodes, newLinks, state.incidents);

    return {
      nodes: newNodes,
      links: newLinks,
      identities: newIdentities,
      events: [...newEvents, ...state.events].slice(0, 75),
      isSimulating: true,
      threatLevel: metrics.threatLevel,
      metrics,
      defenseRecommendations: nextRecs
    };
  }
}
