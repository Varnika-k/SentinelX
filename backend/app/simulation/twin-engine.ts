import { eventBus } from '../core/event-bus';
import { logger } from '../core/logger';
import { DatabaseService } from '../db/service';
import { TelemetryEventType, TelemetryEvent } from '../schemas/telemetry';
import { v4 as uuidv4 } from 'uuid';
import { telemetryPipeline } from '../telemetry/pipeline';
import { graphIntelligenceEngine } from './graph-intelligence';

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
  
  // Phase 5 Graph metrics
  trustScore?: number;
  compromiseProbability?: number;
  resilienceScore?: number;
  operationalCriticality?: number;
  exposureScore?: number;
}

export class DigitalTwinEngine {
  private static instance: DigitalTwinEngine;
  private timer: NodeJS.Timeout | null = null;
  
  public scenario: string = 'idle'; // 'ransomware' | 'ddos' | 'insider' | 'k8s_escalation' | 'lateral_movement' | 'idle'
  public status: 'running' | 'paused' | 'stopped' = 'stopped';
  public tickCount: number = 0;
  public threatLevel: number = 0; // 0 to 100
  public sessionId: string = '';
  public aarTimeline: any[] = [];
  public mitigationsRun: string[] = [];

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

    topology.forEach(node => {
      const gNode = graphIntelligenceEngine.nodes.get(node.name);
      if (gNode) {
        node.trustScore = gNode.trustScore;
        node.compromiseProbability = gNode.compromiseProbability;
        node.resilienceScore = gNode.resilienceScore;
        node.operationalCriticality = gNode.operationalCriticality;
        node.exposureScore = gNode.exposureScore;
      }
      this.nodes.set(node.name, node);
    });
    graphIntelligenceEngine.rebuildGraph(Array.from(this.nodes.values()));
    this.threatLevel = 0;
    this.tickCount = 0;
    this.aarTimeline = [];
    this.mitigationsRun = [];
    logger.info('Digital Twin Topology reset to healthy operational state with Graph Intelligence');
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
      case 'credential':
        this.runCredentialCompromiseTick();
        break;
      case 'container_escape':
        this.runContainerEscapeTick();
        break;
      case 'cloud_privesc':
        this.runCloudPrivEscalationTick();
        break;
      case 'ai_adaptive':
        this.runAIAdaptiveAttackTick();
        break;
      case 'infra_failure':
        this.runInfraFailureTick();
        break;
    }

    // 2.5 Cascading Degradation & Dynamic Resilience Modeling
    this.runCascadingDegradation();
    this.updateAarTimeline();

    // 3. Sync and Propagate dynamic Graph Intelligence (Phase 5)
    graphIntelligenceEngine.rebuildGraph(Array.from(this.nodes.values()));
    graphIntelligenceEngine.propagateRiskAndTrust();

    // Sync values back from graph engine
    this.nodes.forEach(node => {
      const gNode = graphIntelligenceEngine.nodes.get(node.name);
      if (gNode) {
        node.trustScore = gNode.trustScore;
        node.compromiseProbability = gNode.compromiseProbability;
        node.resilienceScore = gNode.resilienceScore;
        node.operationalCriticality = gNode.operationalCriticality;
        node.exposureScore = gNode.exposureScore;
        node.riskScore = Math.min(100, Math.max(node.riskScore, 100 - gNode.trustScore));
      }
    });

    // 4. Emit Digital Twin Stats through the Event Bus
    eventBus.publish('simulation:status', {
      scenario: this.scenario,
      status: this.status,
      tickCount: this.tickCount,
      threatLevel: this.threatLevel,
      sessionId: this.sessionId,
      nodes: Array.from(this.nodes.values()),
      graphState: {
        nodes: Array.from(graphIntelligenceEngine.nodes.values()),
        edges: graphIntelligenceEngine.edges
      }
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

      telemetryPipeline.ingestWazuhAlert({
        timestamp: new Date().toISOString(),
        rule: { id: "100201", level: 9, description: "Privilege escalation suspicious execution chain: Ransomware binary run" },
        agent: { name: "pc-admin-hq" },
        data: { srcip: "185.220.101.5", user: "administrator", process: "powershell" }
      }).catch(err => logger.error("Wazuh simulation ingest failed", err));
    } 
    // Stage 2: Spreads from HQ to AD Connector
    else if (this.tickCount === 3 && adConnector && hq && hq.status === 'infected' && adConnector.status !== 'isolated') {
      adConnector.status = 'infected';
      adConnector.riskScore = 95;
      adConnector.cpuLoad = 98;
      this.threatLevel = 65;

      telemetryPipeline.ingestWazuhAlert({
        timestamp: new Date().toISOString(),
        rule: { id: "100420", level: 12, description: "Domain controller AD Connector compromise: Unauthorized registry alterations" },
        agent: { name: "azure-vm-ad-connector" },
        data: { srcip: "82.102.23.4", user: "system", process: "regsrv32" }
      }).catch(err => logger.error("Wazuh simulation ingest failed", err));
    }
    // Stage 3: AD Connector spreads to Auth API Pod
    else if (this.tickCount === 5 && authApi && adConnector && adConnector.status === 'infected' && authApi.status !== 'isolated') {
      authApi.status = 'infected';
      authApi.riskScore = 85;
      authApi.cpuLoad = 90;
      this.threatLevel = 80;

      telemetryPipeline.ingestFalcoAlert({
        time: new Date().toISOString(),
        rule: "Privileged container activity detected",
        priority: "Critical",
        output: "Interactive shell bash run in pod k8s-pod-auth-api-559b by root user",
        container: "auth-api-container",
        k8s: { pod: "k8s-pod-auth-api-559b", ns: "production" }
      }).catch(err => logger.error("Falco simulation ingest failed", err));
    }
    // Stage 4: Compiles down to Database tier encryption
    else if (this.tickCount === 7 && dbMaster && authApi && authApi.status === 'infected' && dbMaster.status !== 'isolated') {
      dbMaster.status = 'infected';
      dbMaster.riskScore = 100;
      dbMaster.cpuLoad = 100;
      this.threatLevel = 100;

      telemetryPipeline.ingestFalcoAlert({
        time: new Date().toISOString(),
        rule: "Malicious write pattern in secure directory",
        priority: "Critical",
        output: "Massive file renaming/encryption loops targeting production master DB tables",
        container: "db-master-container",
        k8s: { pod: "db-core-master", ns: "db-tier" }
      }).catch(err => logger.error("Falco simulation ingest failed", err));
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

      telemetryPipeline.ingestFalcoAlert({
        time: new Date().toISOString(),
        rule: "Exploitation Probe in Container Interface",
        priority: "High",
        output: "LFI/XSS execution probe targeting backend login validation scripts in namespace production",
        container: "auth-api-container",
        k8s: { pod: "k8s-pod-auth-api-559b", ns: "production" }
      }).catch(err => logger.error("Falco simulation ingest failed", err));
    } else if (this.tickCount === 3 && authPod) {
      authPod.status = 'infected';
      authPod.riskScore = 80;
      this.threatLevel = 70;

      telemetryPipeline.ingestFalcoAlert({
        time: new Date().toISOString(),
        rule: "Reverse Shell Spawned in Container",
        priority: "Critical",
        output: "RCE exploitation successful. reverse shell opened to listener 45.18.23.90",
        container: "auth-api-container",
        k8s: { pod: "k8s-pod-auth-api-559b", ns: "production" }
      }).catch(err => logger.error("Falco simulation ingest failed", err));
    } else if (this.tickCount === 5 && rbacService) {
      rbacService.status = 'critical';
      rbacService.riskScore = 95;
      this.threatLevel = 95;

      telemetryPipeline.ingestFalcoAlert({
        time: new Date().toISOString(),
        rule: "Kubernetes Role binding mutated to root-admin equivalence",
        priority: "Critical",
        output: "Privilege Escalation: Compromised service account successfully elevated role to cluster-admin",
        container: "kube-apiserver",
        k8s: { pod: "iam-root-account", ns: "security" }
      }).catch(err => logger.error("Falco simulation ingest failed", err));
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
   * Credential Compromise Scenario Evolution
   */
  private runCredentialCompromiseTick() {
    const adConnector = this.nodes.get('azure-vm-ad-connector');
    const iamRoot = this.nodes.get('iam-root-account');

    if (this.tickCount === 1 && adConnector) {
      adConnector.status = 'warning';
      adConnector.riskScore = 60;
      this.threatLevel = 35;

      this.emitSimulationTelemetry(
        TelemetryEventType.CLOUD_API_ANOMALY,
        'medium',
        'azure-vm-ad-connector',
        'Credential Compromise: Dynamic session hijack detected. Active directory ticket reuse anomaly.'
      );
    } else if (this.tickCount === 3 && iamRoot) {
      iamRoot.status = 'infected';
      iamRoot.riskScore = 85;
      this.threatLevel = 75;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'critical',
        'iam-root-account',
        'Privileged Impersonation: Multi-factor bypass using hijacked admin session token. Root IAM access targeted.'
      );
    }
  }

  /**
   * Kubernetes Container Escape Scenario Evolution
   */
  private runContainerEscapeTick() {
    const authPod = this.nodes.get('k8s-pod-auth-api-559b');

    if (this.tickCount === 1 && authPod) {
      authPod.status = 'warning';
      authPod.riskScore = 55;
      this.threatLevel = 40;

      this.emitSimulationTelemetry(
        TelemetryEventType.TELEMETRY_ALERT,
        'medium',
        'k8s-pod-auth-api-559b',
        'Kubernetes Container Probe: Unauthorized pivot attempt executing privilege escalation payload.'
      );
    } else if (this.tickCount === 3 && authPod) {
      authPod.status = 'infected';
      authPod.riskScore = 95;
      this.threatLevel = 80;

      this.emitSimulationTelemetry(
        TelemetryEventType.CONTAINER_CRASHED,
        'critical',
        'k8s-pod-auth-api-559b',
        'Container Escape Success: Pod processes escaped cgroup restrictions. Acquired write-access to host files.'
      );
    }
  }

  /**
   * Cloud Privilege Escalation Scenario Evolution
   */
  private runCloudPrivEscalationTick() {
    const payProcessor = this.nodes.get('aws-lambda-payment-processor');
    const iamRoot = this.nodes.get('iam-root-account');

    if (this.tickCount === 1 && payProcessor) {
      payProcessor.status = 'warning';
      payProcessor.riskScore = 50;
      this.threatLevel = 45;

      this.emitSimulationTelemetry(
        TelemetryEventType.CLOUD_API_ANOMALY,
        'high',
        'aws-lambda-payment-processor',
        'Access Policy Abuse: Lambda executed with elevated policies, auditing local security parameters.'
      );
    } else if (this.tickCount === 3 && iamRoot && payProcessor && payProcessor.status === 'warning') {
      iamRoot.status = 'warning';
      iamRoot.riskScore = 70;
      payProcessor.status = 'infected';
      payProcessor.riskScore = 90;
      this.threatLevel = 85;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'critical',
        'iam-root-account',
        'Cloud Privilege Escalation: Malicious identity policy attach. Lambda successfully acquired cluster-admin access.'
      );
    }
  }

  /**
   * AI-Assisted Adaptive Attack Scenario Evolution
   */
  private runAIAdaptiveAttackTick() {
    const ingress = this.nodes.get('k8s-svc-ingress-nginx');
    const authPod = this.nodes.get('k8s-pod-auth-api-559b');
    const db = this.nodes.get('db-core-master');

    if (this.tickCount === 1 && ingress) {
      ingress.status = 'warning';
      ingress.riskScore = 65;
      this.threatLevel = 40;

      this.emitSimulationTelemetry(
        TelemetryEventType.TELEMETRY_ALERT,
        'high',
        'k8s-svc-ingress-nginx',
        'AI Mutation Attack: Highly randomized web request signatures bypassing edge firewall configurations.'
      );
    } else if (this.tickCount === 3 && authPod && ingress && ingress.status === 'warning') {
      authPod.status = 'infected';
      authPod.riskScore = 80;
      this.threatLevel = 75;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'high',
        'k8s-pod-auth-api-559b',
        'AI-Assisted Propagation: Lateral scanning adaptive agents bypass API gateways using customized JSON payloads.'
      );
    } else if (this.tickCount === 5 && db && authPod && authPod.status === 'infected') {
      db.status = 'infected';
      db.riskScore = 95;
      this.threatLevel = 98;

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_COMPROMISED,
        'critical',
        'db-core-master',
        'AI Adaptive Domination: AI agent executes payload mutations to decrypt database layers directly.'
      );
    }
  }

  /**
   * Distributed Infrastructure Failure Scenario Evolution (Chaos Engineering)
   */
  private runInfraFailureTick() {
    const db = this.nodes.get('db-core-master');
    const authPod = this.nodes.get('k8s-pod-auth-api-559b');

    if (this.tickCount === 1 && db) {
      db.status = 'warning';
      db.riskScore = 40;
      db.latency = 980;
      this.threatLevel = 30;

      this.emitSimulationTelemetry(
        TelemetryEventType.TELEMETRY_ALERT,
        'high',
        'db-core-master',
        'Database Congestion: Packet drops and thread starvation registered on AWS-East DB storage tiers.'
      );
    } else if (this.tickCount === 3 && db && authPod) {
      db.status = 'critical';
      db.latency = 6500;
      authPod.status = 'warning';
      authPod.latency = 2400;
      this.threatLevel = 70;

      this.emitSimulationTelemetry(
        TelemetryEventType.CONTAINER_CRASHED,
        'critical',
        'k8s-pod-auth-api-559b',
        'Distributed Failover Panic: Connection starvation caused downstream authentication services to drop requests.'
      );
    }
  }

  /**
   * Cascading Degradation Modeling Simulator (Objective C)
   */
  private runCascadingDegradation() {
    const ingress = this.nodes.get('k8s-svc-ingress-nginx');
    const authPod = this.nodes.get('k8s-pod-auth-api-559b');
    const payGw = this.nodes.get('k8s-pod-payment-gw-88c2');
    const db = this.nodes.get('db-core-master');
    const iamRoot = this.nodes.get('iam-root-account');

    // 1. Database Compromise/Failure -> Downstream service bottleneck
    if (db && (db.status === 'infected' || db.status === 'critical')) {
      if (authPod && authPod.status !== 'isolated' && authPod.status !== 'infected') {
        authPod.status = 'warning';
        authPod.latency = Math.max(authPod.latency, 2500);
        authPod.cpuLoad = Math.min(100, authPod.cpuLoad + 45);
        authPod.activeConnections = Math.max(0, authPod.activeConnections - 15);
      }
      if (payGw && payGw.status !== 'isolated' && payGw.status !== 'infected') {
        payGw.status = 'warning';
        payGw.latency = Math.max(payGw.latency, 3200);
        payGw.cpuLoad = Math.min(100, payGw.cpuLoad + 50);
      }
    }

    // 2. Auth API Server Failure -> Ingress queue overload & payment process drops
    if (authPod && (authPod.status === 'infected' || authPod.status === 'critical' || authPod.status === 'isolated')) {
      if (ingress && ingress.status !== 'isolated') {
        ingress.latency = Math.max(ingress.latency, 1200);
        ingress.activeConnections = Math.max(50, ingress.activeConnections - 40);
        if (ingress.status === 'healthy') ingress.status = 'warning';
      }
    }

    // 3. IAM Account Compromise / Key Theft -> Root exposure cascading risk increment
    if (iamRoot && (iamRoot.status === 'infected' || iamRoot.status === 'critical')) {
      this.nodes.forEach(node => {
        if (node.id !== iamRoot.id && node.status !== 'isolated') {
          node.riskScore = Math.min(100, node.riskScore + 15);
        }
      });
    }
  }

  /**
   * Military-grade After-Action Review (AAR) timeline logger (Objective J)
   */
  private updateAarTimeline() {
    let title = `T+${this.tickCount} Snapshot`;
    let description = '';
    let stepType: 'attack' | 'degradation' | 'mitigation' | 'system' = 'system';

    const infectedCount = Array.from(this.nodes.values()).filter(n => n.status === 'infected').length;
    const isolatedCount = Array.from(this.nodes.values()).filter(n => n.status === 'isolated').length;
    const compromisedList = Array.from(this.nodes.values()).filter(n => n.status === 'infected').map(n => n.name);

    if (this.tickCount === 1) {
      title = 'Infection vector established';
      description = `Breach coordinate identified. Compromised hosts represent direct trust degradation threat. Threat Level: ${this.threatLevel}%`;
      stepType = 'attack';
    } else if (infectedCount > 0) {
      title = `Compromise expanding (${infectedCount} infected)`;
      description = `Lateral spread tracks active payloads targeting: [${compromisedList.join(', ')}]. Survivability at risk.`;
      stepType = 'degradation';
    } else if (isolatedCount > 0) {
      title = `Quarantine active (${isolatedCount} isolated)`;
      description = `Defensive isolation measures deployed to intercept target vectors. Lateral spreads slowing down.`;
      stepType = 'mitigation';
    } else {
      title = `Steady baseline logged`;
      description = 'All active twin telemetry states evaluated clean. Operational parameters stable.';
      stepType = 'system';
    }

    // Store AAR review entry
    this.aarTimeline.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      tick: this.tickCount,
      title,
      type: stepType,
      description,
      threatLevel: this.threatLevel,
      survivability: this.getSurvivabilityScore(),
      continuity: this.getOperationalContinuity(),
      infectedCount,
      isolatedCount
    });
  }

  /**
   * Returns estimated survivability percentage under attack (Objective D)
   */
  public getSurvivabilityScore(): number {
    const totalCount = this.nodes.size || 1;
    let score = 100;

    // Deduct heavily for infected nodes & general threat index
    this.nodes.forEach(node => {
      if (node.status === 'infected') score -= (22 * (node.operationalCriticality ?? 0.5));
      if (node.status === 'critical') score -= (14 * (node.operationalCriticality ?? 0.5));
      if (node.status === 'isolated') score -= (8 * (node.operationalCriticality ?? 0.5)); // Isolation cuts service but saves integrity
    });

    // Factor in general threat levels
    score -= (this.threatLevel * 0.15);

    return Math.max(5, Math.min(100, Math.round(score)));
  }

  /**
   * Returns estimated operational continuity percentage (Objective D)
   */
  public getOperationalContinuity(): number {
    let operationalUnits = 0;
    this.nodes.forEach(node => {
      // Isolated, infected, and critical nodes reduce direct operational availability
      if (node.status === 'healthy') {
        operationalUnits += 1.0;
      } else if (node.status === 'warning') {
        operationalUnits += 0.75; // partial capacity
      } else if (node.status === 'critical') {
        operationalUnits += 0.35; // heavily sluggish
      } else if (node.status === 'infected') {
        operationalUnits += 0.1; // raw unauthorized encryption traffic draining output
      } else if (node.status === 'isolated') {
        operationalUnits += 0.0; // fully offline
      }
    });

    const percent = (operationalUnits / (this.nodes.size || 1)) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
  }

  /**
   * Sector-by-sector resilience scoring and categorization structure (Objective D)
   */
  public getSectorMetrics() {
    const sectors = [
      { name: 'Edge & Ingress', match: ['k8s-svc-ingress-nginx', 'pc-admin-hq'] },
      { name: 'Auth & Gateway', match: ['k8s-pod-auth-api-559b', 'k8s-pod-payment-gw-88c2'] },
      { name: 'Database Core', match: ['db-core-master', 'azure-vm-ad-connector'] },
      { name: 'Identity Control', match: ['iam-root-account'] },
      { name: 'Storage & Serverless', match: ['cloud-storage-bucket', 'aws-lambda-payment-processor'] }
    ];

    return sectors.map(sec => {
      let totalTrust = 0;
      let totalResilience = 0;
      let activeConnections = 0;
      let count = 0;
      let infectedCount = 0;
      let isolatedCount = 0;

      sec.match.forEach(name => {
        const node = this.nodes.get(name);
        if (node) {
          count++;
          totalTrust += (node.trustScore ?? 100);
          totalResilience += (node.resilienceScore ?? 65);
          activeConnections += node.activeConnections;
          if (node.status === 'infected') infectedCount++;
          if (node.status === 'isolated') isolatedCount++;
        }
      });

      const avgTrust = count > 0 ? Math.round(totalTrust / count) : 100;
      const avgResilience = count > 0 ? Math.round(totalResilience / count) : 75;

      // Classify sector operational status
      let healthStatus: 'healthy' | 'degraded' | 'critical' | 'quarantined' = 'healthy';
      if (infectedCount > 0) {
        healthStatus = 'critical';
      } else if (isolatedCount === count && count > 0) {
        healthStatus = 'quarantined';
      } else if (isolatedCount > 0 || avgTrust < 70) {
        healthStatus = 'degraded';
      }

      return {
        name: sec.name,
        resilienceScore: avgResilience,
        trustScore: avgTrust,
        activeWorkloads: count,
        infectedCount,
        isolatedCount,
        status: healthStatus,
        activeConnections
      };
    });
  }

  public getAarTimeline() {
    return this.aarTimeline;
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
      
      // Phase 5 graph impact
      graphIntelligenceEngine.applyTacticalDefenseAction('isolate_node', nodeName);
      
      this.mitigationsRun.push(`isolation:${nodeName}`);
      this.aarTimeline.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        tick: this.tickCount,
        title: `Mitigation: Isolated ${nodeName}`,
        type: 'mitigation',
        description: `Operator enforced physical port isolation on ${nodeName}. Threat vector cut off from dependencies.`,
        threatLevel: this.threatLevel,
        survivability: this.getSurvivabilityScore(),
        continuity: this.getOperationalContinuity(),
        infectedCount: Array.from(this.nodes.values()).filter(n => n.status === 'infected').length,
        isolatedCount: Array.from(this.nodes.values()).filter(n => n.status === 'isolated').length
      });

      this.emitSimulationTelemetry(
        TelemetryEventType.NODE_ISOLATED,
        'medium',
        nodeName,
        `Autonomous Defense Response: Applied physical port isolation rule. Blocked all ingress/egress routes. Containment radius successfully expanded.`
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
      
      this.mitigationsRun.push(`scale:${nodeName}`);
      this.aarTimeline.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        tick: this.tickCount,
        title: `Mitigation: Scaled Up ${nodeName}`,
        type: 'mitigation',
        description: `Scaled replica pods for ${nodeName}. Distributed CPU burden and reduced transaction latencies.`,
        threatLevel: this.threatLevel,
        survivability: this.getSurvivabilityScore(),
        continuity: this.getOperationalContinuity(),
        infectedCount: Array.from(this.nodes.values()).filter(n => n.status === 'infected').length,
        isolatedCount: Array.from(this.nodes.values()).filter(n => n.status === 'isolated').length
      });

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

      this.aarTimeline.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        tick: this.tickCount,
        title: `Chaos: Crashed ${nodeName}`,
        type: 'degradation',
        description: `Chaos Engineering agent injected thread crash on ${nodeName}. Forcing failover test parameters.`,
        threatLevel: this.threatLevel,
        survivability: this.getSurvivabilityScore(),
        continuity: this.getOperationalContinuity(),
        infectedCount: Array.from(this.nodes.values()).filter(n => n.status === 'infected').length,
        isolatedCount: Array.from(this.nodes.values()).filter(n => n.status === 'isolated').length
      });

      this.emitSimulationTelemetry(
        TelemetryEventType.CONTAINER_CRASHED,
        'high',
        nodeName,
        `Chaos Injection Event: Simulating container kernel panic crash and socket buffer depletion.`
      );
    }
  }

  /**
   * Action tool: Rotates identity credentials and API keys
   */
  public rotateNodeSecrets(nodeName: string) {
    const node = this.nodes.get(nodeName);
    if (node) {
      node.riskScore = Math.max(0, node.riskScore - 30);
      if (node.status === 'infected') node.status = 'warning';
      
      graphIntelligenceEngine.applyTacticalDefenseAction('rotate_credentials', nodeName);

      this.mitigationsRun.push(`rotate:${nodeName}`);
      this.aarTimeline.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        tick: this.tickCount,
        title: `Mitigation: Rotated Keys on ${nodeName}`,
        type: 'mitigation',
        description: `Rotated SSL certificates and IAM private key chains for node ${nodeName} to reclaim trust bounds.`,
        threatLevel: this.threatLevel,
        survivability: this.getSurvivabilityScore(),
        continuity: this.getOperationalContinuity(),
        infectedCount: Array.from(this.nodes.values()).filter(n => n.status === 'infected').length,
        isolatedCount: Array.from(this.nodes.values()).filter(n => n.status === 'isolated').length
      });

      this.emitSimulationTelemetry(
        TelemetryEventType.DEFENSE_TRIGGERED,
        'low',
        nodeName,
        `Identity Access Mitigation: Successfully rotated credentials and certificates. Cleared historical authorization tokens.`
      );
    }
  }

  /**
   * Action tool: Blocks specific high-risk network traffic routes
   */
  public blockNodeTraffic(nodeName: string) {
    const node = this.nodes.get(nodeName);
    if (node) {
      if (node.status === 'infected' || node.status === 'critical') {
        node.status = 'warning';
      }
      graphIntelligenceEngine.applyTacticalDefenseAction('block_traffic', nodeName);

      this.mitigationsRun.push(`block:${nodeName}`);
      this.aarTimeline.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        tick: this.tickCount,
        title: `Mitigation: Blocked Traffic on ${nodeName}`,
        type: 'mitigation',
        description: `WAF filtering rules injected at transit path to isolate rogue connections.`,
        threatLevel: this.threatLevel,
        survivability: this.getSurvivabilityScore(),
        continuity: this.getOperationalContinuity(),
        infectedCount: Array.from(this.nodes.values()).filter(n => n.status === 'infected').length,
        isolatedCount: Array.from(this.nodes.values()).filter(n => n.status === 'isolated').length
      });

      this.emitSimulationTelemetry(
        TelemetryEventType.DEFENSE_TRIGGERED,
        'medium',
        nodeName,
        `Network Route Isolation: Severed active data plane and API routes targeting ${nodeName}.`
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
