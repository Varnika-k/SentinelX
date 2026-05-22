import { logger } from '../core/logger';
import { eventBus } from '../core/event-bus';
import { DatabaseService } from '../db/service';

export interface GraphNodeState {
  id: string;
  name: string;
  type: string;
  namespace: string;
  environment: string;
  status: 'healthy' | 'warning' | 'critical' | 'infected' | 'isolated';
  
  // Graph-Native Quantitative Metrics (Phase 5)
  trustScore: number;            // 0 to 100
  compromiseProbability: number; // 0.0 to 1.0
  resilienceScore: number;       // 0 to 100
  operationalCriticality: number; // 0 to 100
  exposureScore: number;         // 0 to 100
  
  // Real-time telemetry values
  cpuLoad: number;
  latency: number;
  activeConnections: number;
}

export interface GraphEdgeState {
  id: string;
  source: string; // Node ID or Name
  target: string; // Node ID or Name
  type: 'TRUST_PATH' | 'COMMUNICATION_LINK' | 'SERVICE_DEPENDENCY' | 'AUTH_ROUTE' | 'DATA_FLOW';
  status: 'active' | 'compromised' | 'severed';
  riskWeight: number; // 0.0 to 1.0
}

export class GraphIntelligenceEngine {
  private static instance: GraphIntelligenceEngine;

  public nodes: Map<string, GraphNodeState> = new Map();
  public edges: GraphEdgeState[] = [];

  private constructor() {
    this.rebuildGraph();
  }

  public static getInstance(): GraphIntelligenceEngine {
    if (!GraphIntelligenceEngine.instance) {
      GraphIntelligenceEngine.instance = new GraphIntelligenceEngine();
    }
    return GraphIntelligenceEngine.instance;
  }

  /**
   * Hardened structural rebuild of our Infrastructure Reasoning Graph
   */
  public rebuildGraph(twinNodes?: any[]) {
    this.nodes.clear();
    this.edges = [];

    // 1. Rebuild or load structural nodes with their core metadata and graph properties
    const defaultNodes: GraphNodeState[] = [
      { id: '1', name: 'k8s-svc-ingress-nginx', type: 'K8S_SERVICE', namespace: 'production', environment: 'aws-east', status: 'healthy', trustScore: 95, compromiseProbability: 0.02, resilienceScore: 80, operationalCriticality: 80, exposureScore: 95, cpuLoad: 12, latency: 5, activeConnections: 120 },
      { id: '2', name: 'k8s-pod-auth-api-559b', type: 'K8S_POD', namespace: 'production', environment: 'aws-east', status: 'healthy', trustScore: 90, compromiseProbability: 0.05, resilienceScore: 75, operationalCriticality: 90, exposureScore: 60, cpuLoad: 8, latency: 12, activeConnections: 45 },
      { id: '3', name: 'k8s-pod-payment-gw-88c2', type: 'K8S_POD', namespace: 'production', environment: 'aws-east', status: 'healthy', trustScore: 90, compromiseProbability: 0.08, resilienceScore: 85, operationalCriticality: 85, exposureScore: 70, cpuLoad: 15, latency: 25, activeConnections: 60 },
      { id: '4', name: 'db-core-master', type: 'CLOUD_EC2', namespace: 'db-tier', environment: 'aws-east', status: 'healthy', trustScore: 98, compromiseProbability: 0.01, resilienceScore: 90, operationalCriticality: 100, exposureScore: 10, cpuLoad: 24, latency: 4, activeConnections: 8 },
      { id: '5', name: 'aws-lambda-payment-processor', type: 'CLOUD_LAMBDA', namespace: 'serverless', environment: 'aws-east', status: 'healthy', trustScore: 95, compromiseProbability: 0.03, resilienceScore: 95, operationalCriticality: 70, exposureScore: 20, cpuLoad: 0, latency: 180, activeConnections: 0 },
      { id: '6', name: 'cloud-storage-bucket', type: 'CLOUD_S3', namespace: 'storage', environment: 'aws-east', status: 'healthy', trustScore: 99, compromiseProbability: 0.01, resilienceScore: 95, operationalCriticality: 80, exposureScore: 30, cpuLoad: 2, latency: 8, activeConnections: 15 },
      { id: '7', name: 'pc-admin-hq', type: 'API_ENDPOINT', namespace: 'hq', environment: 'hq-office', status: 'healthy', trustScore: 80, compromiseProbability: 0.12, resilienceScore: 60, operationalCriticality: 75, exposureScore: 85, cpuLoad: 5, latency: 15, activeConnections: 2 },
      { id: '8', name: 'iam-root-account', type: 'API_ENDPOINT', namespace: 'security', environment: 'aws-global', status: 'healthy', trustScore: 95, compromiseProbability: 0.02, resilienceScore: 95, operationalCriticality: 100, exposureScore: 40, cpuLoad: 1, latency: 2, activeConnections: 1 },
      { id: '9', name: 'azure-vm-ad-connector', type: 'CLOUD_EC2', namespace: 'active-directory', environment: 'azure-west', status: 'healthy', trustScore: 85, compromiseProbability: 0.10, resilienceScore: 70, operationalCriticality: 90, exposureScore: 50, cpuLoad: 18, latency: 45, activeConnections: 12 }
    ];

    defaultNodes.forEach(node => {
      // Sync with twin-engine active state if present
      if (twinNodes) {
        const twin = twinNodes.find(t => t.name === node.name);
        if (twin) {
          node.status = twin.status;
          node.cpuLoad = twin.cpuLoad;
          node.latency = twin.latency;
          node.activeConnections = twin.activeConnections;
          node.trustScore = Math.max(0, 100 - twin.riskScore);
          node.compromiseProbability = twin.riskScore / 100;
        }
      }
      this.nodes.set(node.name, node);
    });

    // 2. Map multidimensional relationships as typed edges
    this.edges = [
      // Network Traffic paths
      { id: 'e1', source: 'k8s-svc-ingress-nginx', target: 'k8s-pod-auth-api-559b', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.2 },
      { id: 'e2', source: 'k8s-svc-ingress-nginx', target: 'k8s-pod-payment-gw-88c2', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.2 },
      { id: 'e3', source: 'pc-admin-hq', target: 'k8s-svc-ingress-nginx', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.4 },
      
      // Credential/Auth boundaries
      { id: 'e4', source: 'azure-vm-ad-connector', target: 'k8s-pod-auth-api-559b', type: 'AUTH_ROUTE', status: 'active', riskWeight: 0.6 },
      { id: 'e5', source: 'pc-admin-hq', target: 'azure-vm-ad-connector', type: 'AUTH_ROUTE', status: 'active', riskWeight: 0.5 },
      { id: 'e6', source: 'k8s-pod-auth-api-559b', target: 'iam-root-account', type: 'TRUST_PATH', status: 'active', riskWeight: 0.8 },
      { id: 'e7', source: 'pc-admin-hq', target: 'iam-root-account', type: 'TRUST_PATH', status: 'active', riskWeight: 0.9 },

      // Database service dependency paths
      { id: 'e8', source: 'k8s-pod-auth-api-559b', target: 'db-core-master', type: 'SERVICE_DEPENDENCY', status: 'active', riskWeight: 0.5 },
      { id: 'e9', source: 'k8s-pod-payment-gw-88c2', target: 'db-core-master', type: 'SERVICE_DEPENDENCY', status: 'active', riskWeight: 0.5 },

      // Cloud data pipelines
      { id: 'e10', source: 'k8s-pod-payment-gw-88c2', target: 'aws-lambda-payment-processor', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.3 },
      { id: 'e11', source: 'aws-lambda-payment-processor', target: 'cloud-storage-bucket', type: 'DATA_FLOW', status: 'active', riskWeight: 0.1 },
      { id: 'e12', source: 'db-core-master', target: 'cloud-storage-bucket', type: 'DATA_FLOW', status: 'active', riskWeight: 0.2 },
    ];

    logger.debug('[Graph] Initialized relational infrastructure reasoning graph');
  }

  /**
   * ATTACK PROPAGATION ENGINE (Requirement B)
   * Evaluates lateral movement risk, credential boundary traversal, and privilege escalation likelihoods
   */
  public computeAttackSpread(infectedNodeName: string): any {
    const rootNode = this.nodes.get(infectedNodeName);
    if (!rootNode) return { infected: [], routesActivated: [] };

    const spreadMatrix: Array<{ nodeName: string; probability: number; path: string[]; description: string }> = [];
    const visited = new Set<string>([infectedNodeName]);
    const queue: Array<{ nodeName: string; probability: number; path: string[] }> = [
      { nodeName: infectedNodeName, probability: 1.0, path: [infectedNodeName] }
    ];

    while (queue.length > 0) {
      const { nodeName, probability, path } = queue.shift()!;
      
      // Get all outbound edges originating from or pointing to this node (as bidirectional communication paths carry threats)
      const outgoingEdges = this.edges.filter(e => 
        e.status !== 'severed' && 
        (e.source === nodeName || e.target === nodeName)
      );

      for (const edge of outgoingEdges) {
        const neighbor = edge.source === nodeName ? edge.target : edge.source;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const neighborNode = this.nodes.get(neighbor);
          if (!neighborNode || neighborNode.status === 'isolated') continue;

          // Compute custom propagation likelihood based on edge risk and target's vulnerabilities
          const traversalCoefficient = this.getEdgeTraversalMultiplier(edge.type);
          const rawProb = probability * edge.riskWeight * (neighborNode.exposureScore / 100) * traversalCoefficient;
          const neighborProbability = Math.min(0.99, Math.max(0.01, rawProb));

          const explanation = this.formulatePropagationReasoning(nodeName, neighbor, edge.type);

          spreadMatrix.push({
            nodeName: neighbor,
            probability: Math.round(neighborProbability * 100) / 100,
            path: [...path, neighbor],
            description: explanation
          });

          // Only continue traversing downstream if the path remains reasonably infected
          if (neighborProbability > 0.15) {
            queue.push({
              nodeName: neighbor,
              probability: neighborProbability,
              path: [...path, neighbor]
            });
          }
        }
      }
    }

    return spreadMatrix.sort((a, b) => b.probability - a.probability);
  }

  /**
   * BLAST RADIUS ENGINE (Requirement C)
   * Generates reachable nodes, downstream critical systems exposure, and operational degradation risk
   */
  public computeBlastRadius(nodeName: string): any {
    const startNode = this.nodes.get(nodeName);
    if (!startNode) return { score: 0, affectedNodes: [], criticalSystemsRisk: [], operationalDegradationPct: 0 };

    const spread = this.computeAttackSpread(nodeName);
    const affectedNodes: string[] = spread.map((s: any) => s.nodeName);
    
    // Evaluate downstream criticality degradation
    let criticalitySum = 0;
    let criticalSystemsRisk: Array<{ name: string; criticality: number; role: string }> = [];

    affectedNodes.forEach(name => {
      const n = this.nodes.get(name);
      if (n) {
        criticalitySum += n.operationalCriticality;
        if (n.operationalCriticality >= 80) {
          criticalSystemsRisk.push({
            name: n.name,
            criticality: n.operationalCriticality,
            role: n.type
          });
        }
      }
    });

    const severityFactor = startNode.status === 'critical' || startNode.status === 'infected' ? 1.0 : 0.5;
    const sizeScore = (affectedNodes.length / this.nodes.size) * 40;
    const densityScore = (criticalitySum / 900) * 60; // Max achievable is roughly 900
    const score = Math.min(100, Math.round((sizeScore + densityScore) * severityFactor));

    // Operational survivability & degradation percentage
    const operationalDegradationPct = Math.min(100, Math.round(score * 0.95));

    return {
      score,
      affectedNodes,
      criticalSystemsRisk,
      operationalDegradationPct,
      nodeCount: affectedNodes.length,
      resilienceTimeHours: Math.max(1, Math.round((100 - score) * 0.24)) // Survives longer if blast radius is small
    };
  }

  /**
   * TRUST & RISK PROPAGATION ENGINE (Requirement D)
   * Drives mathematical state updates across graph topography
   */
  public propagateRiskAndTrust() {
    // 1. Traverse all nodes and adjust scores dynamically based on compromised neighbors
    const dynamicUpdates: Record<string, { trust: number; probability: number }> = {};

    this.nodes.forEach(node => {
      if (node.status === 'isolated') {
        dynamicUpdates[node.name] = { trust: 100, probability: 0.0 };
        return;
      }

      let activeInfectionRisk = 0;
      const associatedEdges = this.edges.filter(e => e.status !== 'severed' && (e.source === node.name || e.target === node.name));

      associatedEdges.forEach(edge => {
        const peerName = edge.source === node.name ? edge.target : edge.source;
        const peer = this.nodes.get(peerName);
        if (peer && peer.status === 'infected') {
          // peer severity leaks risk across active connection edges
          const leakageCoefficient = edge.riskWeight * (node.exposureScore / 100);
          activeInfectionRisk += (peer.compromiseProbability * 50) * leakageCoefficient;
        }
      });

      // Clamp calculated trust and risk changes
      const currentThreatIndex = node.status === 'infected' ? 85 : (node.status === 'critical' ? 65 : (node.status === 'warning' ? 30 : 5));
      const targetRisk = Math.min(100, currentThreatIndex + activeInfectionRisk);
      const targetProbability = targetRisk / 100;

      // Adjust trust inversely
      const targetTrust = Math.max(0, 100 - targetRisk);

      // Mutate node survivability and resilience parameters
      node.resilienceScore = Math.max(10, Math.min(100, Math.round(100 - targetRisk * 0.8)));

      dynamicUpdates[node.name] = {
        trust: Math.round(targetTrust),
        probability: Math.round(targetProbability * 100) / 100
      };
    });

    // Apply synchronized changes
    Object.keys(dynamicUpdates).forEach(name => {
      const node = this.nodes.get(name);
      if (node) {
        node.trustScore = dynamicUpdates[name].trust;
        node.compromiseProbability = dynamicUpdates[name].probability;
      }
    });
  }

  /**
   * DEFENSE CONSTRAINTS & MUTATIONS (Requirement H)
   * Breaks relevant nodes and edges under defense configurations
   */
  public applyTacticalDefenseAction(action: string, targetNodeId: string) {
    logger.info(`[Graph] Mutating topology and trust edges under tactical response block: ${action} on ${targetNodeId}`);

    const targetNode = this.nodes.get(targetNodeId);
    if (!targetNode) return;

    if (action === 'isolate_node' || action === 'quarantine_workload') {
      // Isolate node status
      targetNode.status = 'isolated';
      targetNode.trustScore = 100;
      targetNode.compromiseProbability = 0.0;
      targetNode.cpuLoad = 10;
      targetNode.activeConnections = 0;

      // Collapses and severs all connected edges to disrupt containment radius
      this.edges.forEach(edge => {
        if (edge.source === targetNodeId || edge.target === targetNodeId) {
          edge.status = 'severed';
          edge.riskWeight = 0.0;
        }
      });

      eventBus.publish('defense:action:success', {
        type: 'topology_mutation',
        nodeId: targetNodeId,
        impact: 'containment_radius_expanded'
      });
    } 
    else if (action === 'rotate_credentials' || action === 'revoke_session') {
      // Resets trust scores and invalidates credentials routing paths
      targetNode.trustScore = Math.min(100, targetNode.trustScore + 35);
      targetNode.status = targetNode.status === 'infected' ? 'warning' : 'healthy';

      this.edges.forEach(edge => {
        if ((edge.source === targetNodeId || edge.target === targetNodeId) && (edge.type === 'TRUST_PATH' || edge.type === 'AUTH_ROUTE')) {
          // Trust edges reset to low weights, mitigating privilege escalation risks
          edge.riskWeight = Math.max(0.1, edge.riskWeight * 0.25);
        }
      });
    }
    else if (action === 'block_traffic') {
      // Sever communications routes without entirely isolating credentials
      this.edges.forEach(edge => {
        if ((edge.source === targetNodeId || edge.target === targetNodeId) && (edge.type === 'COMMUNICATION_LINK' || edge.type === 'DATA_FLOW')) {
          edge.status = 'severed';
          edge.riskWeight = 0.0;
        }
      });
    }

    // Force recalculations post edge modifications
    this.propagateRiskAndTrust();
  }

  /**
   * AI COGNITIVE EXPLANATIONS LINK (Requirement G)
   * Resolves structural paths to output elegant telemetry-aware threat propagation explanations
   */
  public getAIGraphExplanation(nodeName: string): string {
    const node = this.nodes.get(nodeName);
    if (!node) return "Node not mapped in the infrastructure reasoning graph.";

    const blast = this.computeBlastRadius(nodeName);
    const flow = this.computeAttackSpread(nodeName);

    const highProbTargets = flow.filter((f: any) => f.probability > 0.4).map((f: any) => `${f.nodeName} (${Math.round(f.probability * 100)}% risk)`);
    const criticalExposures = blast.criticalSystemsRisk.map((c: any) => `${c.name} [${c.role}]`);

    let explanation = `The node '${nodeName}' is a ${node.type} operating in the ${node.namespace} namespace. `;
    explanation += `With an active vulnerability quotient of ${node.compromiseProbability}, the propagation threat index registers at ${blast.score}/100. `;

    if (highProbTargets.length > 0) {
      explanation += `Based on live network topography analytics, high-confidence lateral movement paths threaten: ${highProbTargets.join(', ')}. `;
    } else {
      explanation += `Lateral spread risk remains contained inside local subnet boundaries. `;
    }

    if (criticalExposures.length > 0) {
      explanation += `Downstream dependencies reveal critical risk on ${criticalExposures.join(', ')}. `;
    } else {
      explanation += `No downstream domain controllers or database systems fall inside the primary blast radius constraints. `;
    }

    explanation += `Autonomous resilience modeling forecasts system operational survivability of ${blast.resilienceTimeHours} hours unless proactive containment acts is applied.`;

    return explanation;
  }

  // --- Helpers ---

  private getEdgeTraversalMultiplier(type: string): number {
    switch (type) {
      case 'TRUST_PATH': return 1.5; // Trust relationships bypass guards easily
      case 'AUTH_ROUTE': return 1.3; // Identity-based traversal carries high authorization
      case 'COMMUNICATION_LINK': return 1.0;
      case 'SERVICE_DEPENDENCY': return 1.1;
      case 'DATA_FLOW': return 0.8;
      default: return 1.0;
    }
  }

  private formulatePropagationReasoning(source: string, target: string, type: string): string {
    switch (type) {
      case 'TRUST_PATH':
        return `Trust boundary exposure: '${target}' has implicit credentials relationships mapping from '${source}'.`;
      case 'AUTH_ROUTE':
        return `Active session hijack: '${source}' holds active auth links enabling downstream privilege escalation on '${target}'.`;
      case 'SERVICE_DEPENDENCY':
        return `Cascading upstream failure: '${target}' acts as a core socket backend for services processed in '${source}'.`;
      case 'DATA_FLOW':
        return `Outbound leak channel: payload parameters are streamed from '${source}' directly to '${target}' storage layers.`;
      default:
        return `Lateral network traversal: standard TCP/IP routing bridges communication between '${source}' and '${target}'.`;
    }
  }
}

export const graphIntelligenceEngine = GraphIntelligenceEngine.getInstance();
