import { NetworkNode, NetworkLink } from './network';

export interface GraphIntelligenceReport {
  timestamp: number;
  criticalPaths: {
    path: string[]; // List of Node IDs
    riskScore: number;
    description: string;
  }[];
  blastRadius: {
    [nodeId: string]: number; // 0-1 percentage of infrastructure affected if this node is compromised
  };
  clusters: {
    id: string;
    nodeIds: string[];
    riskLevel: number;
    name: string;
  }[];
  lateralMovementProbability: {
    sourceId: string;
    targetId: string;
    probability: number; // 0-1
  }[];
  crownJewelRisk: {
    nodeId: string;
    distanceFromCompromise: number;
    riskTrend: 'rising' | 'stable' | 'falling';
  }[];
}

export interface GraphTraversalOptions {
  maxDepth?: number;
  weightBy?: 'vulnerability' | 'criticality' | 'riskWeight';
  excludedNodeIds?: string[];
}
