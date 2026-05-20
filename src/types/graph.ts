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
  // Predictive operational intelligence & resilience properties
  cascadingFailureRisks?: {
    nodeId: string;
    cascadingProbability: number; // 0-1 percentage
    description: string;
  }[];
  infrastructurePressure?: {
    nodeId: string;
    stressScore: number; // 0-100
    degradationForecast: number; // 0-100 %
  }[];
  survivabilityScores?: {
    nodeId: string;
    survivabilityScore: number; // 0-100 %
  }[];
  resilienceIndex?: number; // 0-100 global health-defense scale
  recoveryTimelines?: {
    nodeId: string;
    estimatedRecoverySeconds: number;
    progressPercentage: number;
  }[];
  threatTrajectoryAngle?: number;
}

export interface GraphTraversalOptions {
  maxDepth?: number;
  weightBy?: 'vulnerability' | 'criticality' | 'riskWeight';
  excludedNodeIds?: string[];
}
