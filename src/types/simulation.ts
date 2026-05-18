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

export type DefenseModule = 'firewall' | 'neural_isolation' | 'heuristic_scanner' | 'auto_containment';

import { Incident } from './incident';
import { DefenseRecommendation } from './defense';

export interface SimulationState {
  nodes: Node[];
  links: Link[];
  events: TelemetryEvent[];
  incidents: Incident[];
  defenseRecommendations: DefenseRecommendation[];
  isSimulating: boolean;
  threatLevel: Severity;
  metrics: NetworkMetrics;
  simulationSpeed: number;
  activeDefenseModules: DefenseModule[];
}

export interface AttackPayload {
  type: AttackType;
  targetId: string;
  intensity: number;
  origin?: string;
}
