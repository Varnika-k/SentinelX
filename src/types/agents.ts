export type AgentRole = 
  | 'threat_analyst' 
  | 'incident_responder' 
  | 'graph_specialist' 
  | 'telemetry_correlator' 
  | 'identity_expert' 
  | 'defense_strategist';

export type AgentStatus = 'idle' | 'analyzing' | 'reporting' | 'error';

export interface AIAgent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  status: AgentStatus;
  confidenceScore: number; // 0-1
  lastActive: Date;
  capabilities: string[];
}

export interface AgentReasoning {
  agentId: string;
  timestamp: Date;
  observation: string;
  hypothesis: string;
  confidence: number;
  recommendedAction?: string;
  contextIds: string[]; // Linked node or event IDs
}

export interface ThreatConsensus {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  primaryVector: string;
  agreementCount: number;
  dissentingAgents: string[];
}

export interface AgentOrchestrationState {
  agents: AIAgent[];
  recentReasoning: AgentReasoning[];
  consensus?: ThreatConsensus;
  operationalMemory: string[]; // Recent significant observations
}
