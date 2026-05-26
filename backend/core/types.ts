export type OperationalEventType = 'telemetry' | 'attack' | 'defense' | 'replay' | 'ai' | 'simulation';
export type OperationalLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentMitigationState = 'triggered' | 'active' | 'resolved' | 'failed';

export interface UnifiedOperationalEvent {
  id: string;
  timestamp: string;
  eventType: OperationalEventType;
  source: string;
  severity: OperationalLevel;
  nodeId?: string;
  infrastructureZone?: string;
  attackStage?: 'recon' | 'foothold' | 'lateral' | 'exfiltration' | 'impact';
  propagationRisk?: number; // 0.0 to 1.0
  trustImpact?: number; // delta change to trust state (-100 to 100)
  graphMutation?: GraphMutationPayload;
  telemetry?: Record<string, any>;
  replaySequence: number;
  mitigationState?: IncidentMitigationState;
  correlationId?: string;
}

export interface GraphMutationPayload {
  nodesToUpdate?: Array<Partial<RuntimeNodeState> & { id: string }>;
  edgesToUpdate?: Array<Partial<RuntimeEdgeState> & { id: string }>;
}

export interface RuntimeNodeState {
  id: string;
  name: string;
  type: string;
  namespace: string;
  environment: string;
  status: 'healthy' | 'warning' | 'critical' | 'infected' | 'isolated' | 'compromised' | 'safe' | 'degraded';
  trustScore: number;            // 0 to 100
  compromiseProbability: number; // 0.0 to 1.0
  resilienceScore: number;       // 0 to 100
  operationalCriticality: number; // 0 to 100
  exposureScore: number;         // 0 to 100
  cpuLoad: number;
  latency: number;
  activeConnections: number;
  riskScore: number;             // 0 to 100
}

export interface RuntimeEdgeState {
  id: string;
  source: string;
  target: string;
  type: 'TRUST_PATH' | 'COMMUNICATION_LINK' | 'SERVICE_DEPENDENCY' | 'AUTH_ROUTE' | 'DATA_FLOW';
  status: 'active' | 'compromised' | 'severed';
  riskWeight: number; // 0.0 to 1.0
}

export interface GraphSnapshot {
  id: string;
  timestamp: string;
  replaySequence: number;
  nodes: RuntimeNodeState[];
  edges: RuntimeEdgeState[];
}
