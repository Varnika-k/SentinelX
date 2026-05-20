import { Incident } from './incident';

export type DefenseActionType = 
  | 'isolate_node' 
  | 'quarantine_workload'
  | 'disable_account'
  | 'block_traffic' 
  | 'rotate_credentials'
  | 'enable_containment_mode'
  | 'increase_monitoring' 
  | 'terminate_process'
  | 'reroute_traffic'
  | 'segment_network_zone'
  | 'escalate_incident';

export interface DefenseRecommendation {
  id: string;
  action: DefenseActionType;
  targetId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  reasoning: string;
  impactScore: number; // Predicted decrease in risk
  timestamp: number;
  status: 'pending' | 'applied' | 'dismissed';
}

export interface DefenseStrategy {
  name: string;
  mode: 'aggressive' | 'balanced' | 'conservative';
  autoApply: boolean;
  minConfidence: number;
}

export interface DefenseAnalytics {
  effectivenessScore: number;
  totalActionsTaken: number;
  falsePositiveRate: number;
  meanResponseTime: number;
}
