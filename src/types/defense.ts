import { Incident } from './incident';

export type DefenseActionType = 
  | 'isolate_node' 
  | 'block_traffic' 
  | 'increase_monitoring' 
  | 'escalate_incident' 
  | 'trigger_containment' 
  | 'heuristic_reset';

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
