import { UnifiedOperationalEvent, GraphMutationPayload, RuntimeNodeState, RuntimeEdgeState } from '../../core/types';
import { graphStateRuntime, GraphStateRuntime } from '../../core/graph-runtime';
import { unifiedEventBus } from '../../core/event-bus';
import { logger } from '../../app/core/logger';
import { telemetryGenerator } from '../telemetry-generator';

export type AttackScenarioType = 'ransomware' | 'ddos' | 'phishing' | 'insider' | 'zeroday' | 'lateral' | 'credential_compromise';

export class LiveAttackExecutionEngine {
  private static instance: LiveAttackExecutionEngine;
  private activeScenarios: Map<string, {
    type: AttackScenarioType;
    originId: string;
    correlationId: string;
    stage: 'recon' | 'foothold' | 'lateral' | 'exfiltration' | 'impact';
    step: number;
    timeline: any[];
  }> = new Map();

  private constructor() {}

  public static getInstance(): LiveAttackExecutionEngine {
    if (!LiveAttackExecutionEngine.instance) {
      LiveAttackExecutionEngine.instance = new LiveAttackExecutionEngine();
    }
    return LiveAttackExecutionEngine.instance;
  }

  /**
   * Triggers a live attack lifecycle campaign with dynamic propagation logic
   */
  public async launchAttack(
    type: AttackScenarioType, 
    targetNodeId?: string, 
    correlationId?: string
  ): Promise<string> {
    const corrId = correlationId || `campaign-${type}-${Date.now().toString().slice(-4)}`;
    const actualTargetId = targetNodeId || this.findReasonableTarget(type);
    
    logger.info(`[AttackEngine] Spawning Attack Vector type: ${type.toUpperCase()} on Target Node: ${actualTargetId}. CorrelationId: ${corrId}`);

    // Create the scenario record
    this.activeScenarios.set(corrId, {
      type,
      originId: actualTargetId,
      correlationId: corrId,
      stage: 'foothold',
      step: 1,
      timeline: []
    });

    // Execute first phase (Foothold / Initial Intrusion)
    await this.executeScenarioStep(corrId);

    return corrId;
  }

  /**
   * Solves reasonable target mapping based on attack vector type if unspecified
   */
  private findReasonableTarget(type: AttackScenarioType): string {
    const nodes = graphStateRuntime.getNodes();
    if (type === 'phishing' || type === 'credential_compromise') {
      // Find office or admin endpoint to run phishing spear on
      const matched = nodes.find(n => n.namespace === 'hq' || n.name.includes('pc') || n.name.includes('admin'));
      return matched ? matched.id : '7'; // Fallback admin workstation
    }
    if (type === 'ddos') {
      // Direct load to Edge/Ingress services
      const matched = nodes.find(n => n.name.includes('ingress') || n.name.includes('nginx') || n.name.includes('gw'));
      return matched ? matched.id : '1';
    }
    if (type === 'insider' || type === 'ransomware') {
      // Targeting high-criticality central nodes
      const matched = nodes.find(n => n.operationalCriticality >= 90 && n.status === 'healthy');
      return matched ? matched.id : '4'; // core db master
    }
    // Zero-day targeting random vulnerable edge service
    return '9'; // azure connector
  }

  /**
   * Executes a specific step of the attack campaign, then schedules successive stages
   */
  public async executeScenarioStep(correlationId: string) {
    const scenario = this.activeScenarios.get(correlationId);
    if (!scenario) return;

    const runtimeNodes = graphStateRuntime.getNodes();
    const targetNode = graphStateRuntime.getNode(scenario.originId);
    if (!targetNode) {
      this.activeScenarios.delete(correlationId);
      return;
    }

    if (targetNode.status === 'isolated') {
      logger.info(`[AttackEngine] Squelched attack execution on [${targetNode.name}] because it has been ISOLATED by operators!`);
      await unifiedEventBus.ingestEvent({
        eventType: 'simulation',
        source: 'attack-engine-monitors',
        severity: 'low',
        nodeId: targetNode.id,
        correlationId,
        message: `ATTACK SQUELCHED: Threat actor execution failed on isolated container node [${targetNode.name}]. Kill chain severed.`
      });
      this.activeScenarios.delete(correlationId);
      return;
    }

    // Step Processing logic based on Scenario Type and Step Number
    switch (scenario.type) {
      case 'ransomware':
        await this.handleRansomwareStep(scenario, targetNode);
        break;
      case 'ddos':
        await this.handleDdosStep(scenario, targetNode);
        break;
      case 'phishing':
        await this.handlePhishingStep(scenario, targetNode);
        break;
      case 'insider':
        await this.handleInsiderStep(scenario, targetNode);
        break;
      case 'zeroday':
        await this.handleZeroDayStep(scenario, targetNode);
        break;
      case 'lateral':
        await this.handleLateralStep(scenario, targetNode);
        break;
      case 'credential_compromise':
        await this.handleCredCompromiseStep(scenario, targetNode);
        break;
    }

    scenario.step++;
    
    // Auto-propagate to subsequent stages if scenario remains active
    if (scenario.step <= 3 && this.activeScenarios.has(correlationId)) {
      setTimeout(() => {
        this.executeScenarioStep(correlationId).catch(err => {
          logger.error(`Failed to propagate scenario step async for: ${correlationId}`, err);
        });
      }, 5000);
    } else {
      this.activeScenarios.delete(correlationId);
      logger.info(`[AttackEngine] Campaign finished for correlation: ${correlationId}`);
    }
  }

  // --- Ransomware Outbreak Lifecycle ---
  private async handleRansomwareStep(scenario: any, target: RuntimeNodeState) {
    if (scenario.step === 1) {
      scenario.stage = 'foothold';
      const eventMsg = `MALICIOUS_EXECUTION: Suspicious macros triggered from office attachment on Workstation [${target.name}]. Starting credential collection.`;
      
      const rawTelemetry = telemetryGenerator.generateSyslogDump(target, 'Wazuh Alert: T1204.002 - User Execution of Malicious File');
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'unauthenticated_hackers',
        severity: 'high',
        nodeId: target.id,
        attackStage: 'foothold',
        correlationId: scenario.correlationId,
        message: eventMsg,
        telemetry: { syslog: rawTelemetry },
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'degraded',
            riskScore: 65,
            trustScore: 40,
            cpuLoad: 25,
            latency: 18
          }]
        }
      });
    } else if (scenario.step === 2) {
      // Propagate ransomware laterally
      scenario.stage = 'lateral';
      const vulnerableNeighborId = this.findUnisolatedNeighborId(target.id);
      
      if (vulnerableNeighborId) {
        const neighbor = graphStateRuntime.getNode(vulnerableNeighborId)!;
        const eventMsg = `LATERAL_MOVEMENT: Threat actor used intercepted auth cookies on workstation [${target.name}] to login to container [${neighbor.name}] via unauthorized RPC call.`;
        
        const rawTelemetry = telemetryGenerator.generateFalcoContainerAnomaly(neighbor, 'Falco Security Indicator: Unauthorized container connection shell');
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'lateral_actor_agent',
          severity: 'high',
          nodeId: neighbor.id,
          attackStage: 'lateral',
          correlationId: scenario.correlationId,
          message: eventMsg,
          telemetry: { falco: rawTelemetry },
          graphMutation: {
            nodesToUpdate: [{
              id: neighbor.id,
              status: 'degraded',
              riskScore: 78,
              trustScore: 20,
              cpuLoad: 45,
              latency: 35
            }],
            edgesToUpdate: this.compromiseConnectedEdges(target.id, neighbor.id)
          }
        });
        // Mutate target scenario origin recursively to spread laterally
        scenario.originId = neighbor.id;
      }
    } else if (scenario.step === 3) {
      // Complete Ransomware payload impact
      scenario.stage = 'impact';
      const eventMsg = `RANSOMWARE_ENCRYPTION: Cryptographic payload triggered on Node [${target.name}]. Local file vaults encrypted. Security integrity score annihilated. Syslog disk space filled.`;
      
      const rawTelemetry = telemetryGenerator.generateSuricataAlert(target, 'Suricata IDS: Massive lateral data encryption transfer');
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'system-ransom-agent',
        severity: 'critical',
        nodeId: target.id,
        attackStage: 'impact',
        correlationId: scenario.correlationId,
        message: eventMsg,
        telemetry: { networkSnort: rawTelemetry },
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'compromised',
            riskScore: 100,
            trustScore: 0,
            cpuLoad: 98,
            latency: 280
          }]
        }
      });
    }
  }

  // --- DDoS Volumetric Congestion Lifecycle ---
  private async handleDdosStep(scenario: any, target: RuntimeNodeState) {
    if (scenario.step === 1) {
      scenario.stage = 'foothold';
      const eventMsg = `DDOS_CONGESTION: Multi-tier botnet traffic flood hitting edge IP of [${target.name}]. Active connection count climbing steeply.`;
      
      const rawTelemetry = telemetryGenerator.generateSuricataAlert(target, 'Suricata Warning: Excessive TCP SYN flood targeting service endpoints');
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'global_mirai_botnet',
        severity: 'high',
        nodeId: target.id,
        attackStage: 'foothold',
        correlationId: scenario.correlationId,
        message: eventMsg,
        telemetry: { pcapOutcast: rawTelemetry },
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'degraded',
            riskScore: 70,
            trustScore: 50,
            cpuLoad: 80,
            latency: 150,
            activeConnections: 1200
          }]
        }
      });
    } else if (scenario.step === 2) {
      scenario.stage = 'lateral';
      // Side effect propagation: Downstream microservices dependent on the ingress get choked (cascade)
      const depNodeId = this.findDependentServiceId(target.id);
      
      if (depNodeId) {
        const downstream = graphStateRuntime.getNode(depNodeId)!;
        const eventMsg = `CASCADING_FAILOVER: Influx throttling on [${target.name}] exhausted routing threads on downstream dependent service [${downstream.name}]. System responses timing out.`;
        
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'cascading_thread_choke',
          severity: 'high',
          nodeId: downstream.id,
          attackStage: 'lateral',
          correlationId: scenario.correlationId,
          message: eventMsg,
          graphMutation: {
            nodesToUpdate: [{
              id: downstream.id,
              status: 'degraded',
              riskScore: 65,
              trustScore: 30,
              cpuLoad: 92,
              latency: 480
            }],
            edgesToUpdate: this.compromiseConnectedEdges(target.id, downstream.id)
          }
        });
        scenario.originId = downstream.id;
      }
    } else if (scenario.step === 3) {
      scenario.stage = 'impact';
      const eventMsg = `ROUTE_EXHAUSTION: Complete threadlock on Edge Service [${target.name}]. Socket buffer pools exhausted. Service now returns standard HTTP 503 Out-of-Service errors.`;
      
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'threadlock-botnet',
        severity: 'critical',
        nodeId: target.id,
        attackStage: 'impact',
        correlationId: scenario.correlationId,
        message: eventMsg,
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'compromised',
            riskScore: 99,
            trustScore: 5,
            cpuLoad: 100,
            latency: 1800,
            activeConnections: 9500
          }]
        }
      });
    }
  }

  // --- Identity Phishing & Credentials Breach Lifecycle ---
  private async handlePhishingStep(scenario: any, target: RuntimeNodeState) {
    if (scenario.step === 1) {
      scenario.stage = 'foothold';
      const eventMsg = `SPEAR_PHISHING: User on Office PC [${target.name}] fell for target spoofing campaign and keyed core administrator tokens to duplicate login portal.`;
      
      const rawTelemetry = telemetryGenerator.generateAuthAnomalyAlert(target, 'Cloud Auth Alert: Spoofed portal access verification bypass');
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'phishing_campaign_engine',
        severity: 'high',
        nodeId: target.id,
        attackStage: 'foothold',
        correlationId: scenario.correlationId,
        message: eventMsg,
        telemetry: { cloudAuth: rawTelemetry },
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'degraded',
            riskScore: 60,
            trustScore: 35,
            cpuLoad: 12
          }]
        }
      });
    } else if (scenario.step === 2) {
      scenario.stage = 'lateral';
      // Lateral access: Credential is used to compromise IAM or Database root accounts
      const cloudNodeId = this.findIdentitySensitiveServiceId();
      if (cloudNodeId) {
        const cloudNode = graphStateRuntime.getNode(cloudNodeId)!;
        const eventMsg = `IDENTITY_COMPROMISE: Exfiltrated access tokens used to compromise admin sessions over IAM root connector on service [${cloudNode.name}]. Global API keys compromised.`;
        
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'privileged_user_theft',
          severity: 'high',
          nodeId: cloudNode.id,
          attackStage: 'lateral',
          correlationId: scenario.correlationId,
          message: eventMsg,
          graphMutation: {
            nodesToUpdate: [{
              id: cloudNode.id,
              status: 'compromised',
              riskScore: 89,
              trustScore: 10
            }],
            edgesToUpdate: this.compromiseConnectedEdges(target.id, cloudNode.id)
          }
        });
        scenario.originId = cloudNode.id;
      }
    } else if (scenario.step === 3) {
      scenario.stage = 'impact';
      const eventMsg = `DATA_EXFILTRATION: Security authorization headers bypassed. Bulk metadata scraping of tables is underway over cloud S3 portals.`;
      
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'identity-leaker',
        severity: 'critical',
        nodeId: target.id,
        attackStage: 'impact',
        correlationId: scenario.correlationId,
        message: eventMsg,
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            riskScore: 90,
            trustScore: 5,
            latency: 120
          }]
        }
      });
    }
  }

  // --- Insider Malicious Analyst Lifecycle ---
  private async handleInsiderStep(scenario: any, target: RuntimeNodeState) {
    if (scenario.step === 1) {
      scenario.stage = 'foothold';
      const eventMsg = `INSIDER_THREAT: Local consultant on node [${target.name}] ran unauthorized debug network scanners over internal cluster namespaces.`;
      
      const rawTelemetry = telemetryGenerator.generateSyslogDump(target, 'Wazuh Alert: T1046 - Internal Network Service Scanning');
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'rogue-insider-analyst',
        severity: 'medium',
        nodeId: target.id,
        attackStage: 'foothold',
        correlationId: scenario.correlationId,
        message: eventMsg,
        telemetry: { auditLog: rawTelemetry },
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'warning',
            riskScore: 50,
            trustScore: 50
          }]
        }
      });
    } else if (scenario.step === 2) {
      scenario.stage = 'lateral';
      // Inside network scanning is leveraged to spot database vulnerabilities
      const dbNodeId = '4'; // db-core-master
      const dbNode = graphStateRuntime.getNode(dbNodeId)!;
      const eventMsg = `PRIVILEGE_ESCALATION: Insider successfully guessed local system passwords of [${dbNode.name}] database master using automated credential spray logs.`;
      
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'rogue-insider-analyst',
        severity: 'high',
        nodeId: dbNode.id,
        attackStage: 'lateral',
        correlationId: scenario.correlationId,
        message: eventMsg,
        graphMutation: {
          nodesToUpdate: [{
            id: dbNode.id,
            status: 'degraded',
            riskScore: 80,
            trustScore: 25,
            cpuLoad: 35
          }],
          edgesToUpdate: this.compromiseConnectedEdges(target.id, dbNode.id)
        }
      });
      scenario.originId = dbNode.id;
    } else if (scenario.step === 3) {
      scenario.stage = 'impact';
      const eventMsg = `INFORMATION_THEFT: Global client lists and encrypted hashes downloaded by local insider. Copy completed to external flash partitions.`;
      
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'insider-leak-agent',
        severity: 'critical',
        nodeId: target.id,
        attackStage: 'impact',
        correlationId: scenario.correlationId,
        message: eventMsg,
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'compromised',
            riskScore: 95,
            trustScore: 0
          }]
        }
      });
    }
  }

  // --- Zero-Day Memory Corruption Lifecycle ---
  private async handleZeroDayStep(scenario: any, target: RuntimeNodeState) {
    if (scenario.step === 1) {
      scenario.stage = 'foothold';
      const eventMsg = `ZERO_DAY_EXPLOIT: Remote memory heap page overflow targeted undocumented socket APIs on [${target.name}]. Gaining unauthenticated root access.`;
      
      const rawTelemetry = telemetryGenerator.generateFalcoContainerAnomaly(target, 'Falco Security Indicator: Critical syscall memory-mmap corruption detected');
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'apt_state_hackers',
        severity: 'critical',
        nodeId: target.id,
        attackStage: 'foothold',
        correlationId: scenario.correlationId,
        message: eventMsg,
        telemetry: { falco: rawTelemetry },
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'compromised',
            riskScore: 92,
            trustScore: 8,
            cpuLoad: 68,
            latency: 120
          }]
        }
      });
    } else if (scenario.step === 2) {
      scenario.stage = 'lateral';
      // Pivoting stealthily across namespaces
      const authNodeId = '2'; // auth api pod
      const authNode = graphStateRuntime.getNode(authNodeId)!;
      const eventMsg = `STEALTH_PIVOT: Exploiting local session configurations of [${target.name}] to traverse namespace boundaries onto authorization handler [${authNode.name}].`;
      
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'apt_state_hackers',
        severity: 'high',
        nodeId: authNode.id,
        attackStage: 'lateral',
        correlationId: scenario.correlationId,
        message: eventMsg,
        graphMutation: {
          nodesToUpdate: [{
            id: authNode.id,
            status: 'degraded',
            riskScore: 78,
            trustScore: 30,
            cpuLoad: 50
          }],
          edgesToUpdate: this.compromiseConnectedEdges(target.id, authNode.id)
        }
      });
      scenario.originId = authNode.id;
    } else if (scenario.step === 3) {
      scenario.stage = 'impact';
      const eventMsg = `INFRASTRUCTURE_STRIKE: Host controllers shutdown. Central configuration scripts overwritten. Production environment routing disrupted.`;
      
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'system-agent-zeroday',
        severity: 'critical',
        nodeId: target.id,
        attackStage: 'impact',
        correlationId: scenario.correlationId,
        message: eventMsg,
        graphMutation: {
          nodesToUpdate: [{
            id: target.id,
            status: 'compromised',
            riskScore: 100,
            trustScore: 0,
            latency: 2500
          }]
        }
      });
    }
  }

  // --- Dynamic helper fallback vectors ---
  private async handleLateralStep(scenario: any, target: RuntimeNodeState) {
    const nextId = this.findUnisolatedNeighborId(target.id);
    if (nextId) {
      const neighbor = graphStateRuntime.getNode(nextId)!;
      await unifiedEventBus.ingestEvent({
        eventType: 'attack',
        source: 'pivoting_threat_actor',
        severity: 'high',
        nodeId: neighbor.id,
        attackStage: 'lateral',
        correlationId: scenario.correlationId,
        message: `LATERAL_PROPAGATION: Intrusion pivot succeeded from [${target.name}] to adjacent endpoint [${neighbor.name}].`,
        graphMutation: {
          nodesToUpdate: [{
            id: neighbor.id,
            status: 'degraded',
            riskScore: 70,
            trustScore: 50
          }],
          edgesToUpdate: this.compromiseConnectedEdges(target.id, neighbor.id)
        }
      });
      scenario.originId = neighbor.id;
    }
  }

  private async handleCredCompromiseStep(scenario: any, target: RuntimeNodeState) {
    await unifiedEventBus.ingestEvent({
      eventType: 'attack',
      source: 'identity_broker',
      severity: 'high',
      nodeId: target.id,
      attackStage: 'foothold',
      correlationId: scenario.correlationId,
      message: `CREDENTIAL_STUFFING: Brute force sweep harvested administrative privileges over [${target.name}]. Internal keys vulnerable.`,
      graphMutation: {
        nodesToUpdate: [{
          id: target.id,
          status: 'warning',
          riskScore: 60,
          trustScore: 40
        }]
      }
    });
  }

  // --- Topology awareness calculations ---
  private findUnisolatedNeighborId(nodeId: string): string | null {
    const edges = graphStateRuntime.getEdges();
    const neighborEdge = edges.find(
      e => (e.source === nodeId || e.target === nodeId) && e.status !== 'severed'
    );
    if (!neighborEdge) return null;
    return neighborEdge.source === nodeId ? neighborEdge.target : neighborEdge.source;
  }

  private findDependentServiceId(nodeId: string): string | null {
    const edges = graphStateRuntime.getEdges();
    const matches = edges.filter(
      e => e.source === nodeId && e.type === 'SERVICE_DEPENDENCY' && e.status !== 'severed'
    );
    return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)].target : null;
  }

  private findIdentitySensitiveServiceId(): string | null {
    const nodes = graphStateRuntime.getNodes();
    const matched = nodes.find(n => n.type === 'CLOUD_S3' || n.name.includes('iam') || n.name.includes('root'));
    return matched ? matched.id : null;
  }

  private compromiseConnectedEdges(sourceId: string, targetId: string): Array<Partial<RuntimeEdgeState> & { id: string }> {
    const edges = graphStateRuntime.getEdges();
    const matchedEdges = edges.filter(
      e => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId)
    );
    return matchedEdges.map(e => ({
      id: e.id,
      status: 'compromised',
      riskWeight: 0.95
    }));
  }

  /**
   * Defensive countermeasure executor (Rotate, Quarantine, Segmentation, Isolation)
   * All mutations have deliberate high-fidelity operational consequence side-effects (Consequence Models!)
   */
  public async executeDefenseAction(
    nodeId: string, 
    actionType: 'isolate' | 'quarantine' | 'restore' | 'scrub'
  ) {
    logger.info(`[AttackEngine] Executing operator intervention protocol: ${actionType.toUpperCase()} on Node NodeID #${nodeId}`);

    const originalNode = graphStateRuntime.getNode(nodeId);
    if (!originalNode) return;

    // Consequence Side-Effects Modeling:
    // Isolating or quarantining isolates threat spread but incurs significant operational performance latency on related pipelines
    const mutationPayload = graphStateRuntime.applyDefenseControl(nodeId, actionType);

    // Dynamic compensation modeling:
    if (actionType === 'isolate' || actionType === 'quarantine') {
      logger.info(`[AttackEngine] CONSEQUENCE MODEL: Severed communication access on workstation: ${originalNode.name}. Containment stabilizes threat spread of Adjacent Nodes.`);
    }

    const message = `DEFENSE_PROTOCOL: Applied remediation countermeasures [${actionType.toUpperCase()}] targeting [${originalNode.name}]. Restoring cryptographic path routes. State normalized.`;

    await unifiedEventBus.ingestEvent({
      eventType: 'defense',
      source: 'sentinelx-orchestration-agent',
      severity: 'high',
      nodeId,
      message,
      graphMutation: mutationPayload,
      mitigationState: 'resolved'
    });
  }
}

export const liveAttackExecutionEngine = LiveAttackExecutionEngine.getInstance();
