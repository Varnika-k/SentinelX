import { eventBus } from '../core/event-bus';
import { logger } from '../core/logger';
import { DatabaseService } from '../db/service';
import { TelemetryEventType, TelemetryEvent } from '../schemas/telemetry';
import { v4 as uuidv4 } from 'uuid';

export interface SimulatedNode {
  id: string;
  name: string;
  type: string;
  namespace: string;
  environment: string;
  status: 'healthy' | 'warning' | 'critical' | 'infected' | 'isolated';
  cpuLoad: number; // 0 to 100
  latency: number; // ms
  activeConnections: number;
  relationships: string[]; // Connected node names
  riskScore: number;
}

export class DigitalTwinEngine {
  private static instance: DigitalTwinEngine;
  private timer: NodeJS.Timeout | null = null;
  
  public scenario: string = 'idle'; // 'ransomware' | 'ddos' | 'insider' | 'k8s_escalation' | 'lateral_movement' | 'idle'
  public status: 'running' | 'paused' | 'stopped' = 'stopped';
  public tickCount: number = 0;
  public threatLevel: number = 0; // 0 to 100
  public sessionId: string = '';

  // Digital Twin state representation
  public nodes: Map<string, SimulatedNode> = new Map();

  private constructor() {
    this.resetTopology();
  }

  public static getInstance(): DigitalTwinEngine {
    if (!DigitalTwinEngine.instance) {
      DigitalTwinEngine.instance = new DigitalTwinEngine();
    }
    return DigitalTwinEngine.instance;
  }

  /**
   * Initialize a beautiful, clean cloud-native cluster topology
   */
  public resetTopology() {
    this.nodes.clear();
    const topology: SimulatedNode[] = [
      { id: '1', name: 'k8s-svc-ingress-nginx', type: 'K8S_SERVICE', namespace: 'production', environment: 'aws-east', status: 'healthy', cpuLoad: 12, latency: 5, activeConnections: 120, relationships: ['k8s-pod-auth-api-559b', 'k8s-pod-payment-gw-88c2', 'pc-admin-hq'], riskScore: 5 },
      { id: '2', name: 'k8s-pod-auth-api-559b', type: 'K8S_POD', namespace: 'production', environment: 'aws-east', status: 'healthy', cpuLoad: 8, latency: 12, activeConnections: 45, relationships: ['db-core-master', 'iam-root-account'], riskScore: 10 },
      { id: '3', name: 'k8s-pod-payment-gw-88c2', type: 'K8S_POD', namespace: 'production', environment: 'aws-east', status: 'healthy', cpuLoad: 15, latency: 25, activeConnections: 60, relationships: ['db-core-master', 'aws-lambda-payment-processor'], riskScore: 15 },
      { id: '4', name: 'db-core-master', type: 'CLOUD_EC2', namespace: 'db-tier', environment: 'aws-east', status: 'healthy', cpuLoad: 24, latency: 4, activeConnections: 8, relationships: ['cloud-storage-bucket'], riskScore: 20 },
      { id: '5', name: 'aws-lambda-payment-processor', type: 'CLOUD_LAMBDA', namespace: 'serverless', environment: 'aws-east', status: 'healthy', cpuLoad: 0, latency: 180, activeConnections: 0, relationships: ['cloud-storage-bucket'], riskScore: 10 },
      { id: '6', name: 'cloud-storage-bucket', type: 'CLOUD_S3', namespace: 'storage', environment: 'aws-east', status: 'healthy', cpuLoad: 2, latency: 8, activeConnections: 15, relationships: [], riskScore: 5 },
      { id: '7', name: 'pc-admin-hq', type: 'API_ENDPOINT', namespace: 'hq', environment: 'hq-office', status: 'healthy', cpuLoad: 5, latency: 15, activeConnections: 2, relationships: ['iam-root-account', 'azure-vm-ad-connector'], riskScore: 15 },
      { id: '8', name: 'iam-root-account', type: 'API_ENDPOINT', namespace: 'security', environment: 'aws-global', status: 'healthy', cpuLoad: 1, latency: 2, activeConnections: 1, relationships: [], riskScore: 30 },
      { id: '9', name: 'azure-vm-ad-connector', type: 'CLOUD_EC2', namespace: 'active-directory', environment: 'azure-west', status: 'healthy', cpuLoad: 18, latency: 45, activeConnections: 12, relationships: ['k8s-pod-auth-api-559b'], riskScore: 25 }
    ];

    topology.forEach(node => this.nodes.set(node.name, node));
    this.threatLevel = 0;
    this.tickCount = 0;
    logger.info('Digital Twin Topology reset to healthy operational state');
  }

  /**
   * Start the digital twin simulation runner loop
   */
  public async start(scenarioName: string) {
    if (this.status === 'running') this.stop();

    this.scenario = scenarioName;
    this.status = 'running';
    this.tickCount = 0;
    this.threatLevel = scenarioName === 'idle' ? 0 : 25;

    // Reset topology if coming from a non-idle start
    if (scenarioName !== 'idle') {
      this.resetTopology();
    }

    // Persist a new simulation session
    const doc = await DatabaseService.saveSimulationSession({
      scenarioName: this.scenario,
      status: this.status,
      tickCount: this.tickCount,
      activeThreatLevel: this.threatLevel,
      stateCheckpoint: Array.from(this.nodes.entries())
    });
    if (doc) this.sessionId = doc.id;

    logger.info(`Digital Twin simulation started. Scenario: ${this.scenario}, SessionId: ${this.sessionId}`);

    this.timer = setInterval(() => this.tick(), 3000);
  }

  public async pause() {
    this.status = 'paused';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.persistState();
    logger.info(`Simulation session ${this.sessionId} paused`);
  }

  public async resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.timer = setInterval(() => this.tick(), 3000);
      await this.persistState();
      logger.info(`Simulation session ${this.sessionId} resumed`);
    }
  }

  public stop() {
    this.status = 'stopped';
    this.scenario = 'idle';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.resetTopology();
    logger.info(`Simulation stopped`);
  }

  private async persistState() {
    if (this.sessionId) {
      await DatabaseService.saveSimulationSession({
        id: this.sessionId,
        status: this.status,
        tickCount: this.tickCount,
        activeThreatLevel: this.threatLevel,
        stateCheckpoint: Array.from(this.nodes.entries())
      });
    }
  }

  /**
   * Processes a single tick update representing real-time telemetry updates.
   * Feeds realistic, high-fidelity changes into the event bus.
   */
  private tick() {
    this.tickCount++;

    // 1. Random noise / basic metrics dynamics on healthy nodes
    this.nodes.forEach(node => {
      if (node.status === 'healthy') {
        node.cpuLoad = Math.max(5, Math.min(60, node.cpuLoad + (Math.random() * 8 - 4)));
        node.latency = Math.max(2, Math.min(200, node.latency + (Math.random() * 10 - 5)));
        node.activeConnections = Math.max(0, Math.min(500, node.activeConnections + Math.floor(Math.random() * 10 - 5)));
      }
    });

    // 2. Scenario-specific state evolution
    switch (this.scenario) {
      case 'ransomware':
        this.runRansomwareTick();
        break;
      case 'ddos':
        this.runDdosTick();
        break;
      case 'insider':
        this.runInsiderTick();
        break;
      case 'k8s_escalation':
        this.runK8sEscalationTick();
        break;
      case 'lateral_movement':
        this.runLateralMovementTick();
        break;
    }

    // 3. Emit Digital Twin Stats through the Event Bus
    eventBus.publish('simulation:status', {
      scenario: this.scenario,
      status: this.status,
      tickCount: this.tickCount,
      threatLevel: this.threatLevel,
      sessionId: this.sessionId,
      nodes: Array.from(this.nodes.values())
    });

    // Batch update the infrastructure details in DB with a single transaction
    const nodesToSave = Array.from(this.nodes.values()).map(node => ({
      name: node.name,
      type: node.type as any,
      status: node.status,
      namespace: node.namespace,
      environment: node.environment,
      riskScore: node.riskScore,
      metadata: {
        cpuLoad: node.cpuLoad,
        latency: node.latency,
        activeConnections: node.activeConnections,
        last_update: new Date().toISOString()
      }
    }));
    DatabaseService.saveInfrastructureNodes(nodesToSave).catch(err => {
      logger.error('Failed to save batch infrastructure nodes in tick', err);
    });

    // Save DB state every few ticks to save performance
    if (this.tickCount % 3 === 0) {
      this.persistState();
    }
  }

  /**
   * Ransomware Attack Scenario Evolution
   */
  private runRansomwareTick() {
    // Stage 1: Initial infection starts at 'pc-admin-hq'
    const hq = this.nodes.get('pc-admin-hq');
    const adConnector = this.nodes.get('azure-vm-ad-connector');
    const authApi = this.nodes.get('k8s-pod-auth-api-559b');
    const dbMaster = this.nodes.get('db-core-master');

    if (this.tickCount === 1 && hq && hq.status !== 'isolated') {
      hq.status = 'infected';
      hq.riskScore = 90;
      hq.cpuLoad = 95;
      this.threatLevel = 45;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'high',
        'pc-admin-hq',
        'Infection: Ransomware root agent executed on administrative PC. Background processes encrypting files.'
      );
    } 
    // Stage 2: Spreads from HQ to AD Connector
    else if (this.tickCount === 3 && adConnector && hq && hq.status === 'infected' && adConnector.status !== 'isolated') {
      adConnector.status = 'infected';
      adConnector.riskScore = 95;
      adConnector.cpuLoad = 98;
      this.threatLevel = 65;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'critical',
        'azure-vm-ad-connector',
        'Lateral Spread: Domain Controller AD Connector compromise detected. Unauthorized registry alterations.'
      );
    }
    // Stage 3: AD Connector spreads to Auth API Pod
    else if (this.tickCount === 5 && authApi && adConnector && adConnector.status === 'infected' && authApi.status !== 'isolated') {
      authApi.status = 'infected';
      authApi.riskScore = 85;
      authApi.cpuLoad = 90;
      this.threatLevel = 80;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'critical',
        'k8s-pod-auth-api-559b',
        'Kubernetes Spread: Ingress authentication pod hijacked via stolen AD service token. Command executing as root.'
      );
    }
    // Stage 4: Compiles down to Database tier encryption
    else if (this.tickCount === 7 && dbMaster && authApi && authApi.status === 'infected' && dbMaster.status !== 'isolated') {
      dbMaster.status = 'infected';
      dbMaster.riskScore = 100;
      dbMaster.cpuLoad = 100;
      this.threatLevel = 100;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'critical',
        'db-core-master',
        'Cascade Failure: Production core database backup keys deleted. Active tables encryption started.'
      );
      
      this.emitSimulationTelemetry(
        TelemetryEventType.CONTAINER_CRASHED,
        'critical',
        'db-core-master',
        'Host System Failure: Disk I/O overloaded due to massive file encryption loops.'
      );
    }
  }

  /**
   * DDoS Flood attack cascade
   */
  private runDdosTick() {
    const nginx = this.nodes.get('k8s-svc-ingress-nginx');
    const auth = this.nodes.get('k8s-pod-auth-api-559b');
    const payGw = this.nodes.get('k8s-pod-payment-gw-88c2');

    if (this.tickCount === 1 && nginx) {
      nginx.activeConnections = 2400;
      nginx.cpuLoad = 85;
      nginx.latency = 450;
      this.threatLevel = 50;

      this.emitSimulationTelemetry(
        TelemetryEventType.ATTACK_STARTED,
        'high',
        'k8s-svc-ingress-nginx',
        'L7 HTTP Flood: High-volume request spike targeting default gateway endpoint'
      );
    } else if (this.tickCount === 3 && nginx) {
      nginx.activeConnections = 6500;
      nginx.cpuLoad = 99;
      nginx.latency = 2800;
      nginx.status = 'critical';
      this.threatLevel = 75;

      // Cascading Load onto core microservices
      if (auth && auth.status !== 'isolated') {
        auth.cpuLoad = 95;
        auth.latency = 1200;
        auth.status = 'warning';
      }
      if (payGw && payGw.status !== 'isolated') {
        payGw.cpuLoad = 92;
        payGw.latency = 1800;
        payGw.status = 'warning';
      }

      this.emitSimulationTelemetry(
        TelemetryEventType.TELEMETRY_ALERT,
        'high',
        'k8s-svc-ingress-nginx',
        'Infrastructure Saturation: Ingress CPU peak at 99%. Cascading latency overflow downstream.'
      );
    } else if (this.tickCount >= 5 && nginx) {
      if (nginx.status !== 'isolated') {
        nginx.status = 'critical';
        nginx.cpuLoad = 100;
        nginx.latency = 6000;
        this.threatLevel = 90;

        if (auth && auth.status !== 'isolated') auth.status = 'critical';
        if (payGw && payGw.status !== 'isolated') payGw.status = 'critical';

        this.emitSimulationTelemetry(
          TelemetryEventType.CONTAINER_CRASHED,
          'critical',
          'k8s-svc-ingress-nginx',
          'Service Unresponsive: Gateway crashed on connection backlog timeouts.'
        );
      }
    }
  }

  /**
   * Insider Threat Scenario Evolution
   */
  private runInsiderTick() {
    const adminPc = this.nodes.get('pc-admin-hq');
    const db = this.nodes.get('db-core-master');
    const s3 = this.nodes.get('cloud-storage-bucket');

    if (this.tickCount === 1 && adminPc) {
      adminPc.activeConnections = 5;
      adminPc.riskScore = 55;
      this.threatLevel = 35;

      this.emitSimulationTelemetry(
        TelemetryEventType.K8S_AUDIT_LOG_ENTRY,
        'medium',
        'pc-admin-hq',
        'Anomalous Session: System administrator active at non-standard operation hour 03:14 AM.'
      );
    } else if (this.tickCount === 3 && db) {
      db.activeConnections = 45;
      db.riskScore = 65;
      this.threatLevel = 60;

      this.emitSimulationTelemetry(
        TelemetryEventType.CLOUD_API_ANOMALY,
        'high',
        'db-core-master',
        'Data Exfiltration Attempt: Production database tables dump initiated via custom DB link.'
      );
    } else if (this.tickCount === 5 && s3) {
      s3.activeConnections = 120;
      s3.riskScore = 80;
      this.threatLevel = 85;

      this.emitSimulationTelemetry(
        TelemetryEventType.INFRA_DRIFT_DETECTED,
        'high',
        'cloud-storage-bucket',
        'S3 bucket access policy mutated: public permissions added to secure storage container.'
      );
    }
  }

  /**
   * Kubernetes Privilege Escalation Attack
   */
  private runK8sEscalationTick() {
    const authPod = this.nodes.get('k8s-pod-auth-api-559b');
    const rbacService = this.nodes.get('iam-root-account');

    if (this.tickCount === 1 && authPod) {
      authPod.status = 'warning';
      authPod.riskScore = 45;
      this.threatLevel = 40;

      this.emitSimulationTelemetry(
        TelemetryEventType.CONTAINER_CRASHED,
        'medium',
        'k8s-pod-auth-api-559b',
        'LFI/XSS execution probe targeting backend login validation scripts.'
      );
    } else if (this.tickCount === 3 && authPod) {
      authPod.status = 'infected';
      authPod.riskScore = 80;
      this.threatLevel = 70;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'high',
        'k8s-pod-auth-api-559b',
        'RCE exploitation successful. reverse shell opened to listener 45.18.23.90.'
      );
    } else if (this.tickCount === 5 && rbacService) {
      rbacService.status = 'critical';
      rbacService.riskScore = 95;
      this.threatLevel = 95;

      this.emitSimulationTelemetry(
        TelemetryEventType.K8S_RBAC_MODIFIED,
        'critical',
        'iam-root-account',
        'Privilege Escalation: Compromised service account successfully elevated role to cluster-admin.'
      );
    }
  }

  /**
   * Lateral movement campaign through endpoints
   */
  private runLateralMovementTick() {
    const payGw = this.nodes.get('k8s-pod-payment-gw-88c2');
    const db = this.nodes.get('db-core-master');

    if (this.tickCount === 1 && payGw) {
      payGw.status = 'infected';
      payGw.riskScore = 65;
      this.threatLevel = 45;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'high',
        'k8s-pod-payment-gw-88c2',
        'Credential stuffing success: unauthorized gateway session verified.'
      );
    } else if (this.tickCount === 3 && db) {
      db.status = 'warning';
      db.riskScore = 75;
      this.threatLevel = 70;

      this.emitSimulationTelemetry(
        TelemetryEventType.TELEMETRY_ALERT,
        'high',
        'db-core-master',
        'Lateral probing: Internal network scans originating from compromised K8s payment gateway.'
      );
    }
  }

  /**
   * Trigger direct simulation-safe telemetry events inside our central engine
   */
  private emitSimulationTelemetry(type: TelemetryEventType, severity: TelemetryEvent['severity'], nodeId: string, message: string) {
    const event: TelemetryEvent = {
      id: uuidv4(),
      type,
      severity,
      source: 'SIMULATED_DIGITAL_TWIN',
      message,
      timestamp: new Date().toISOString(),
      nodeId,
      payload: {
        simulation_tick: this.tickCount,
        scenario: this.scenario,
        session_id: this.sessionId
      }
    };

    // Dispatch directly to Redis / EventBus for full platform sync!
    eventBus.publish('system:log', event);
    eventBus.publish('telemetry:event:*', event);
  }

  /**
   * Action tool: Simulates autonomous dynamic host defense isolation
   */
  public isolateSimulatedNode(nodeName: string) {
    const node = this.nodes.get(nodeName);
    if (node) {
      node.status = 'isolated';
      node.riskScore = 0;
      node.cpuLoad = 0;
      node.activeConnections = 0;
      
      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_ISOLATED,
        'medium',
        nodeName,
        `Autonomous Defense Response: Applied physical port isolation rule. Blocked all ingress/egress routes.`
      );

      logger.info(`Isolating dynamic mock node: ${nodeName}`);
    }
  }

  /**
   * Action tool: Scales up workloads dynamically during traffic surges
   */
  public scaleUpWorkload(nodeName: string) {
    const node = this.nodes.get(nodeName);
    if (node) {
      node.cpuLoad = Math.max(10, node.cpuLoad - 35); // Load gets split
      node.latency = Math.max(5, node.latency - 100);
      
      this.emitSimulationTelemetry(
        TelemetryEventType.DEFENSE_TRIGGERED,
        'low',
        nodeName,
        `Workload Autoscaling: Deployed 3 additional replica containers to support high traffic demands.`
      );
    }
  }

  /**
   * Action tool: Injects operational failure or latency chaos
   */
  public injectChaosFailure(nodeName: string) {
    const node = this.nodes.get(nodeName);
    if (node) {
      node.status = 'critical';
      node.cpuLoad = 99;
      node.latency = 4500;
      node.riskScore = 60;

      this.emitSimulationTelemetry(
        TelemetryEventType.CONTAINER_CRASHED,
        'high',
        nodeName,
        `Chaos Injection Event: Simulating container kernel panic crash and socket buffer depletion.`
      );
    }
  }

  /**
   * Predictive What-If timeline projection. Calculates cascading spreads, service crashes
   * and infection velocity over 10 ticks for comparative visualization.
   */
  public getWhatIfScenarios(nodeName: string) {
    const activeRisk = this.threatLevel;
    
    // Timeline projection data
    const branchNoAction: any[] = [];
    const branchDefenseAction: any[] = [];

    let infectionAccumNoAction = 1;
    let infectionAccumDefense = 1;
    let systemStressNoAction = activeRisk;
    let systemStressDefense = activeRisk;

    for (let i = 1; i <= 10; i++) {
      // 1. "No Action" branch: rapid compound propagation, cascading crashes
      infectionAccumNoAction = Math.min(this.nodes.size, infectionAccumNoAction + (0.45 * i));
      systemStressNoAction = Math.min(100, systemStressNoAction + (5 * i));
      branchNoAction.push({
        tick: i,
        infectedCount: Math.min(9, Math.round(infectionAccumNoAction * 10) / 10),
        systemStress: Math.round(systemStressNoAction),
        recoveryRate: 0,
        compromiseRisk: Math.min(100, 30 + (7 * i))
      });

      // 2. "Defense Action" branch (Isolating the target node and activating firewalls)
      if (i > 1) {
        infectionAccumDefense = Math.max(1, infectionAccumDefense - 0.2);
        systemStressDefense = Math.max(5, systemStressDefense - (4 * i));
      } else {
        infectionAccumDefense = infectionAccumNoAction;
        systemStressDefense = systemStressNoAction;
      }
      branchDefenseAction.push({
        tick: i,
        infectedCount: Math.round(infectionAccumDefense * 10) / 10,
        systemStress: Math.round(systemStressDefense),
        recoveryRate: Math.min(100, 20 * i),
        compromiseRisk: Math.max(5, Math.round(30 - (4 * i)))
      });
    }

    return {
      nodeName,
      scenario: this.scenario,
      currentThreatLevel: activeRisk,
      branches: {
        noAction: branchNoAction,
        isolatedResponse: branchDefenseAction
      }
    };
  }
}

export const digitalTwinEngine = DigitalTwinEngine.getInstance();
