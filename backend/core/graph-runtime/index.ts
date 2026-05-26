import { RuntimeNodeState, RuntimeEdgeState, GraphMutationPayload, GraphSnapshot } from '../types';
import { logger } from '../../app/core/logger';
import { DatabaseService } from '../../app/db/service';

export class GraphStateRuntime {
  private static instance: GraphStateRuntime;
  private nodes: Map<string, RuntimeNodeState> = new Map();
  private edges: RuntimeEdgeState[] = [];

  private constructor() {
    this.initializeDefaultTopology();
  }

  public static getInstance(): GraphStateRuntime {
    if (!GraphStateRuntime.instance) {
      GraphStateRuntime.instance = new GraphStateRuntime();
    }
    return GraphStateRuntime.instance;
  }

  /**
   * Loads high fidelity baseline network topology
   */
  public initializeDefaultTopology() {
    this.nodes.clear();
    
    const defaultNodes: RuntimeNodeState[] = [
      { id: '1', name: 'k8s-svc-ingress-nginx', type: 'K8S_SERVICE', namespace: 'production', environment: 'aws-east', status: 'healthy', trustScore: 95, compromiseProbability: 0.02, resilienceScore: 80, operationalCriticality: 80, exposureScore: 95, cpuLoad: 12, latency: 5, activeConnections: 120, riskScore: 5 },
      { id: '2', name: 'k8s-pod-auth-api-559b', type: 'K8S_POD', namespace: 'production', environment: 'aws-east', status: 'healthy', trustScore: 90, compromiseProbability: 0.05, resilienceScore: 75, operationalCriticality: 90, exposureScore: 60, cpuLoad: 8, latency: 12, activeConnections: 45, riskScore: 10 },
      { id: '3', name: 'k8s-pod-payment-gw-88c2', type: 'K8S_POD', namespace: 'production', environment: 'aws-east', status: 'healthy', trustScore: 90, compromiseProbability: 0.08, resilienceScore: 85, operationalCriticality: 85, exposureScore: 70, cpuLoad: 15, latency: 25, activeConnections: 60, riskScore: 15 },
      { id: '4', name: 'db-core-master', type: 'CLOUD_EC2', namespace: 'db-tier', environment: 'aws-east', status: 'healthy', trustScore: 98, compromiseProbability: 0.01, resilienceScore: 90, operationalCriticality: 100, exposureScore: 10, cpuLoad: 24, latency: 4, activeConnections: 8, riskScore: 2 },
      { id: '5', name: 'aws-lambda-payment-processor', type: 'CLOUD_LAMBDA', namespace: 'serverless', environment: 'aws-east', status: 'healthy', trustScore: 95, compromiseProbability: 0.03, resilienceScore: 95, operationalCriticality: 70, exposureScore: 20, cpuLoad: 0, latency: 180, activeConnections: 0, riskScore: 5 },
      { id: '6', name: 'cloud-storage-bucket', type: 'CLOUD_S3', namespace: 'storage', environment: 'aws-east', status: 'healthy', trustScore: 99, compromiseProbability: 0.01, resilienceScore: 95, operationalCriticality: 80, exposureScore: 30, cpuLoad: 2, latency: 8, activeConnections: 15, riskScore: 1 },
      { id: '7', name: 'pc-admin-hq', type: 'API_ENDPOINT', namespace: 'hq', environment: 'hq-office', status: 'healthy', trustScore: 80, compromiseProbability: 0.12, resilienceScore: 60, operationalCriticality: 75, exposureScore: 85, cpuLoad: 5, latency: 15, activeConnections: 2, riskScore: 20 },
      { id: '8', name: 'iam-root-account', type: 'API_ENDPOINT', namespace: 'security', environment: 'aws-global', status: 'healthy', trustScore: 95, compromiseProbability: 0.02, resilienceScore: 95, operationalCriticality: 100, exposureScore: 40, cpuLoad: 1, latency: 2, activeConnections: 1, riskScore: 5 },
      { id: '9', name: 'azure-vm-ad-connector', type: 'CLOUD_EC2', namespace: 'active-directory', environment: 'azure-west', status: 'healthy', trustScore: 85, compromiseProbability: 0.10, resilienceScore: 70, operationalCriticality: 90, exposureScore: 50, cpuLoad: 18, latency: 45, activeConnections: 12, riskScore: 15 }
    ];

    defaultNodes.forEach(node => this.nodes.set(node.id, node));

    this.edges = [
      { id: 'e1', source: '1', target: '2', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.2 },
      { id: 'e2', source: '1', target: '3', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.2 },
      { id: 'e3', source: '7', target: '1', type: 'COMMUNICATION_LINK', status: 'active', riskWeight: 0.4 },
      { id: 'e4', source: '9', target: '2', type: 'AUTH_ROUTE', status: 'active', riskWeight: 0.6 },
      { id: 'e5', source: '7', target: '9', type: 'AUTH_ROUTE', status: 'active', riskWeight: 0.5 },
      { id: 'e6', source: '2', target: '8', type: 'TRUST_PATH', status: 'active', riskWeight: 0.8 },
      { id: 'e7', source: '7', target: '8', type: 'TRUST_PATH', status: 'active', riskWeight: 0.9 },
      { id: 'e8', source: '2', target: '4', type: 'SERVICE_DEPENDENCY', status: 'active', riskWeight: 0.3 },
      { id: 'e9', source: '3', target: '4', type: 'SERVICE_DEPENDENCY', status: 'active', riskWeight: 0.4 },
      { id: 'e10', source: '3', target: '5', type: 'SERVICE_DEPENDENCY', status: 'active', riskWeight: 0.3 },
      { id: 'e11', source: '5', target: '6', type: 'DATA_FLOW', status: 'active', riskWeight: 0.2 },
      { id: 'e12', source: '4', target: '6', type: 'DATA_FLOW', status: 'active', riskWeight: 0.1 }
    ];

    logger.info('Graph State Runtime: Root micro-topology loaded successfully.');
  }

  public getNodes(): RuntimeNodeState[] {
    return Array.from(this.nodes.values()).map(n => ({ ...n }));
  }

  public getNode(id: string): RuntimeNodeState | undefined {
    const node = this.nodes.get(id);
    return node ? { ...node } : undefined;
  }

  public getEdges(): RuntimeEdgeState[] {
    return this.edges.map(e => ({ ...e }));
  }

  /**
   * Applies deliberate graph state changes
   */
  public applyMutation(mutation: GraphMutationPayload): { mutatedNodes: string[]; mutatedEdges: string[] } {
    const mutatedNodes: string[] = [];
    const mutatedEdges: string[] = [];

    if (mutation.nodesToUpdate) {
      for (const update of mutation.nodesToUpdate) {
        const existingNode = this.nodes.get(update.id);
        if (existingNode) {
          const updatedNode = { ...existingNode, ...update };
          
          // Re-evaluate health status of mutated nodes dynamically
          if (updatedNode.riskScore !== undefined) {
            if (updatedNode.riskScore >= 75) {
              updatedNode.status = 'critical';
            } else if (updatedNode.riskScore >= 45) {
              updatedNode.status = 'warning';
            } else if (updatedNode.status === 'critical' || updatedNode.status === 'warning') {
              updatedNode.status = 'healthy';
            }
          }

          this.nodes.set(update.id, updatedNode);
          mutatedNodes.push(update.id);
        }
      }
    }

    if (mutation.edgesToUpdate) {
      for (const update of mutation.edgesToUpdate) {
        const edgeIdx = this.edges.findIndex(e => e.id === update.id);
        if (edgeIdx !== -1) {
          this.edges[edgeIdx] = { ...this.edges[edgeIdx], ...update };
          mutatedEdges.push(update.id);
        }
      }
    }

    if (mutatedNodes.length > 0 || mutatedEdges.length > 0) {
      logger.info(`Graph State Runtime mutation applied: ${mutatedNodes.length} nodes, ${mutatedEdges.length} edges.`);
    }

    return { mutatedNodes, mutatedEdges };
  }

  /**
   * Restores the complete graph state to an existing snapshot
   */
  public restoreFromSnapshot(snapshot: GraphSnapshot) {
    this.nodes.clear();
    snapshot.nodes.forEach(n => this.nodes.set(n.id, { ...n }));
    this.edges = snapshot.edges.map(e => ({ ...e }));
    logger.info(`Graph State Runtime: Rollback restored successfully for sequence: ${snapshot.replaySequence}`);
  }

  /**
   * Expose continuous live snapshot matching requested topology syncs
   */
  public createSnapshot(replaySequence: number = 0): GraphSnapshot {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      timestamp: new Date().toISOString(),
      replaySequence,
      nodes: this.getNodes(),
      edges: this.getEdges()
    };
  }

  /**
   * Advanced attack propagation simulation mechanics
   */
  public propagateAttack(attackType: string, originNodeId: string): GraphMutationPayload {
    const nodesToUpdate: Array<Partial<RuntimeNodeState> & { id: string }> = [];
    const edgesToUpdate: Array<Partial<RuntimeEdgeState> & { id: string }> = [];

    const originNode = this.nodes.get(originNodeId);
    if (!originNode) return {};

    // Mitigate trust levels of upstream nodes & isolate
    nodesToUpdate.push({
      id: originNodeId,
      status: 'compromised',
      riskScore: 95,
      trustScore: 5,
      latency: 150,
      cpuLoad: 80
    });

    // Find all directly linked neighbors
    const directlyLinkedEdges = this.edges.filter(
      e => (e.source === originNodeId || e.target === originNodeId) && e.status !== 'severed'
    );

    for (const edge of directlyLinkedEdges) {
      const targetId = edge.source === originNodeId ? edge.target : edge.source;
      const targetNode = this.nodes.get(targetId);

      if (targetNode && targetNode.status === 'healthy') {
        const probabilityMultiplier = edge.type === 'TRUST_PATH' ? 1.5 : 1.0;
        const spreadInfection = Math.random() < (targetNode.exposureScore / 100) * probabilityMultiplier;

        if (spreadInfection) {
          nodesToUpdate.push({
            id: targetId,
            status: 'degraded',
            riskScore: 50,
            trustScore: 40,
            latency: 75,
            cpuLoad: 45
          });

          edgesToUpdate.push({
            id: edge.id,
            status: 'compromised',
            riskWeight: 0.85
          });
        }
      }
    }

    return { nodesToUpdate, edgesToUpdate };
  }

  /**
   * Defensive countermeasure simulation mechanics
   */
  public applyDefenseControl(nodeId: string, actionType: 'isolate' | 'quarantine' | 'restore' | 'scrub'): GraphMutationPayload {
    const nodesToUpdate: Array<Partial<RuntimeNodeState> & { id: string }> = [];
    const edgesToUpdate: Array<Partial<RuntimeEdgeState> & { id: string }> = [];

    const node = this.nodes.get(nodeId);
    if (!node) return {};

    if (actionType === 'isolate' || actionType === 'quarantine') {
      nodesToUpdate.push({
        id: nodeId,
        status: 'isolated',
        riskScore: 5,
        trustScore: 90,
        latency: 999, // complete communication stop
        cpuLoad: 2 // idle load as activity frozen
      });

      // Sever all connected communication edges
      this.edges.forEach(e => {
        if (e.source === nodeId || e.target === nodeId) {
          edgesToUpdate.push({
            id: e.id,
            status: 'severed',
            riskWeight: 0.0
          });
        }
      });
    } else if (actionType === 'restore') {
      nodesToUpdate.push({
        id: nodeId,
        status: 'healthy',
        riskScore: 5,
        trustScore: 95,
        latency: 5,
        cpuLoad: 10
      });

      // Restore severed links
      this.edges.forEach(e => {
        if (e.source === nodeId || e.target === nodeId) {
          edgesToUpdate.push({
            id: e.id,
            status: 'active',
            riskWeight: 0.2
          });
        }
      });
    }

    return { nodesToUpdate, edgesToUpdate };
  }
}

export const graphStateRuntime = GraphStateRuntime.getInstance();
