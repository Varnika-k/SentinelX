import { unifiedEventBus } from './event-bus';
import { graphStateRuntime } from './graph-runtime';
import { replayPersistenceEngine } from './replay-engine';
import { logger } from '../app/core/logger';

export class MockDataGenerator {
  /**
   * Generates continuous background telemetry signals
   */
  public static async generateBackgroundTelemetry() {
    const nodes = graphStateRuntime.getNodes();
    if (nodes.length === 0) return;

    // Pick a random node and simulate moderate telemetry tick
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const cpuDelta = Math.floor(Math.random() * 6) - 3; // -3% to +3%
    const latencyDelta = Math.floor(Math.random() * 4) - 2; // -2ms to +2ms

    const newCpu = Math.max(2, Math.min(95, node.cpuLoad + cpuDelta));
    const newLatency = Math.max(1, Math.min(300, node.latency + latencyDelta));

    await unifiedEventBus.ingestEvent({
      eventType: 'telemetry',
      source: 'sentinelx-syslog-collector',
      severity: 'low',
      nodeId: node.id,
      infrastructureContext: {
        nodeId: node.id,
        namespace: node.namespace,
        type: node.type
      },
      message: `System diagnostic telemetry. Core utilization metrics stabilized. CPU: ${newCpu}%, Latency: ${newLatency}ms.`,
      graphMutation: {
        nodesToUpdate: [{
          id: node.id,
          cpuLoad: newCpu,
          latency: newLatency
        }]
      }
    });
  }

  /**
   * Triggers a specific high fidelity attack campaign scenario complete with propagation
   */
  public static async executeScenario(type: 'ransomware' | 'ddos' | 'phishing' | 'insider' | 'zeroday') {
    const correlationId = `campaign-${type}-${Date.now().toString().slice(-4)}`;
    logger.info(`Starting Mock Scenario Campaign: ${type}, CorrelationId: ${correlationId}`);

    switch (type) {
      case 'ransomware':
        // Stage 1: spear phishing credential theft on workstation
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'external_cyber_actor',
          severity: 'high',
          nodeId: '7', // pc-admin-hq
          attackStage: 'foothold',
          correlationId,
          message: 'SPEAR_PHISHING: High criticality alert. User on workstation "pc-admin-hq" opened malicious attachment. Local host compromised.',
          graphMutation: {
            nodesToUpdate: [{
              id: '7',
              status: 'compromised',
              riskScore: 85,
              trustScore: 15,
              cpuLoad: 45
            }]
          }
        });

        // Stage 2: Lateral movement detection
        await new Promise(resolve => setTimeout(resolve, 2000));
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'internal_lateral_actor',
          severity: 'high',
          nodeId: '2', // k8s-pod-auth-api-559b
          attackStage: 'lateral',
          correlationId,
          message: 'LATERAL_MOVEMENT: SSH tunnel initiated from workstation "pc-admin-hq" to container "k8s-pod-auth-api-559b" on unauthorized port 22.',
          graphMutation: {
            nodesToUpdate: [{
              id: '2',
              status: 'compromised',
              riskScore: 90,
              trustScore: 10,
              cpuLoad: 60
            }],
            edgesToUpdate: [{
              id: 'e4',
              status: 'compromised',
              riskWeight: 0.95
            }]
          }
        });

        // Stage 3: Impact ransomware deployment
        await new Promise(resolve => setTimeout(resolve, 2000));
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'system-agent-ransom',
          severity: 'critical',
          nodeId: '4', // db-core-master
          attackStage: 'impact',
          correlationId,
          message: 'RANSOMWARE_ENCRYPTION: Cryptographic payload activated on "db-core-master". High density file rewrite detected. Database tables locked.',
          graphMutation: {
            nodesToUpdate: [{
              id: '4',
              status: 'compromised',
              riskScore: 100,
              trustScore: 0,
              cpuLoad: 99,
              latency: 480
            }],
            edgesToUpdate: [{
              id: 'e8',
              status: 'compromised',
              riskWeight: 0.99
            }]
          }
        });
        break;

      case 'ddos':
        // Stage 1: Volumetric ingress clogs
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'distributed_botnet',
          severity: 'high',
          nodeId: '1', // k8s-svc-ingress-nginx
          attackStage: 'foothold',
          correlationId,
          message: 'DDOS_FLOOD: Layer 7 amplification packet flood peaking at 850K requests/sec on edge cluster "ingress-nginx".',
          graphMutation: {
            nodesToUpdate: [{
              id: '1',
              status: 'compromised',
              riskScore: 90,
              trustScore: 40,
              cpuLoad: 92,
              latency: 450,
              activeConnections: 9500
            }],
            edgesToUpdate: [
              { id: 'e1', riskWeight: 0.8 },
              { id: 'e2', riskWeight: 0.8 }
            ]
          }
        });

        // Stage 2: Complete cascading downstream exhaustion
        await new Promise(resolve => setTimeout(resolve, 2500));
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'cascading_traffic_clog',
          severity: 'critical',
          nodeId: '3', // k8s-pod-payment-gw-88c2
          attackStage: 'impact',
          correlationId,
          message: 'SURGE_EXHAUSTION: Core threadpool lockups registered on paymentgateway. Downstream requests failing due to HTTP 504 timeouts.',
          graphMutation: {
            nodesToUpdate: [{
              id: '3',
              status: 'compromised',
              riskScore: 99,
              trustScore: 2,
              cpuLoad: 100,
              latency: 1200
            }],
            edgesToUpdate: [
              { id: 'e9', status: 'compromised', riskWeight: 0.9 },
              { id: 'e10', status: 'compromised', riskWeight: 0.9 }
            ]
          }
        });
        break;

      case 'phishing':
        // Spearman fishing campaign on corporate enduser
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'phishing_campaign',
          severity: 'medium',
          nodeId: '7', // pc-admin-hq
          attackStage: 'foothold',
          correlationId,
          message: 'CREDENTIAL_HARVESTING: Identified spearphishing payload run. Target credentials for Administrator account cloned from pc-admin-hq.',
          graphMutation: {
            nodesToUpdate: [{
              id: '7',
              status: 'compromised',
              riskScore: 78,
              trustScore: 22
            }]
          }
        });
        break;

      case 'insider':
        // Unapproved data vaults cloning by rogue admin
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'insider_analyst',
          severity: 'high',
          nodeId: '8', // iam-root-account
          attackStage: 'lateral',
          correlationId,
          message: 'IAM_ANOMALY: Rogue credential escalation. Direct access token manipulation. Accessing production data archives from non-standard source ID.',
          graphMutation: {
            nodesToUpdate: [{
              id: '8',
              status: 'compromised',
              riskScore: 89,
              trustScore: 11
            }],
            edgesToUpdate: [{
              id: 'e6',
              status: 'compromised',
              riskWeight: 0.88
            }]
          }
        });
        break;

      case 'zeroday':
        // Zero-day vulnerability exploitation using undocumented memory-overflow
        await unifiedEventBus.ingestEvent({
          eventType: 'attack',
          source: 'zero_day_agent',
          severity: 'critical',
          nodeId: '9', // azure-vm-ad-connector
          attackStage: 'foothold',
          correlationId,
          message: 'ZERO_DAY_ANOMALY: Remote code execution exploit triggered. Memory heap overflow acquired root access to VM node.',
          graphMutation: {
            nodesToUpdate: [{
              id: '9',
              status: 'compromised',
              riskScore: 100,
              trustScore: 0,
              cpuLoad: 80,
              latency: 180
            }]
          }
        });
        break;
    }
  }

  /**
   * Applies deliberate remediation actions on targeted network nodes
   */
  public static async executeDefense(nodeId: string, actionType: 'isolate' | 'quarantine' | 'restore' | 'scrub') {
    logger.info(`Applying Defense Remediation: ${actionType} on Node ${nodeId}`);

    const mutation = graphStateRuntime.applyDefenseControl(nodeId, actionType);

    await unifiedEventBus.ingestEvent({
      eventType: 'defense',
      source: 'sentinelx-orchestration-agent',
      severity: 'high',
      nodeId,
      message: `DEFENSE_CONTAINMENT: Applied corrective ${actionType.toUpperCase()} module protocol on Node ID #${nodeId}. Restructuring network routes.`,
      graphMutation: mutation,
      mitigationState: 'resolved'
    });
  }
}
