export type MITREStage = 
  | 'reconnaissance'
  | 'resource-development'
  | 'initial-access'
  | 'execution'
  | 'persistence'
  | 'privilege-escalation'
  | 'defense-evasion'
  | 'credential-access'
  | 'discovery'
  | 'lateral-movement'
  | 'collection'
  | 'command-and-control'
  | 'exfiltration'
  | 'impact';

export interface ThreatActor {
  id: string;
  name: string;
  origin: string;
  reputation: number; // 0-100
  associatedTechniques: string[];
  firstSeen: Date;
  lastSeen: Date;
}

export interface AttackCampaign {
  id: string;
  title: string;
  status: 'active' | 'contained' | 'dormant';
  startTime: Date;
  lastActivity: Date;
  incidents: string[]; // Incident IDs
  affectedAssets: string[]; // Node IDs
  attackerId?: string;
  stages: MITREStage[];
  confidenceScore: number; // 0-1
}

export interface BehaviorBaseline {
  nodeId: string;
  averageTrafficIn: number;
  averageTrafficOut: number;
  normalPorts: number[];
  commonIdentities: string[];
  lastBaselineUpdate: Date;
}

export interface AnomalyTrend {
  timestamp: Date;
  type: string;
  score: number;
  sourceId: string;
}

export interface KnowledgeRelationship {
  source: string;
  target: string;
  type: 'targets' | 'communicates_with' | 'exploits' | 'related_to';
  weight: number;
}

export interface CyberKnowledgeBase {
  campaigns: AttackCampaign[];
  actors: ThreatActor[];
  baselines: BehaviorBaseline[];
  anomalies: AnomalyTrend[];
  relationships: KnowledgeRelationship[];
}
