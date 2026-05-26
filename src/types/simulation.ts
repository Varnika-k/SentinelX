export type { NetworkNode, NetworkLink } from './network';
import { NetworkNode as Node, NetworkLink as Link } from './network';
import { TelemetryEvent, NetworkMetrics, Severity } from './telemetry';

export type AttackType = 'ransomware' | 'ddos' | 'phishing' | 'insider' | 'zeroday' | 'apt';
export type ScenarioType = 
  | 'ransomware_outbreak' 
  | 'data_exfiltration' 
  | 'supply_chain' 
  | 'zero_day' 
  | 'corporate_espionage' 
  | 'critical_infrastructure' 
  | 'ransomware_storm';

export type DefenseModule = 'firewall' | 'neural_isolation' | 'heuristic_scanner' | 'auto_containment' | 'traffic_scrubbing' | 'quantum_hardening';

import { Incident } from './incident';
import { DefenseRecommendation } from './defense';
import { EnterpriseIdentity, IAMRole, IdentityRelationship, EnvironmentSegment } from './iam';
import { CyberKnowledgeBase } from './intelligence';
import { AgentOrchestrationState } from './agents';

export interface SimulationState {
  nodes: Node[];
  links: Link[];
  identities: EnterpriseIdentity[];
  roles: IAMRole[];
  identityRelationships: IdentityRelationship[];
  environments: EnvironmentSegment[];
  knowledgeBase: CyberKnowledgeBase;
  agentOrchestration: AgentOrchestrationState;
  events: TelemetryEvent[];
  incidents: Incident[];
  defenseRecommendations: DefenseRecommendation[];
  isSimulating: boolean;
  threatLevel: Severity;
  metrics: NetworkMetrics;
  simulationSpeed: number;
  spreadVelocity: number;
  activeDefenseModules: DefenseModule[];
  defenseStrategyMode: 'balanced' | 'aggressive' | 'forensics' | 'resilience';
  containmentStability?: number;
  propagationReductionIndex?: number;
  recoveryTrackingRating?: number;
}

export interface AttackPayload {
  type: AttackType;
  targetId?: string;
  identityId?: string;
  intensity: number;
  origin?: string;
}
