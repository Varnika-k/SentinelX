export type NodeStatus = 'safe' | 'compromised' | 'isolated';

export type NodeType = 'gateway' | 'database' | 'firewall' | 'hr-system' | 'workstation' | 'server';

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  status: NodeStatus;
  criticality: number; // 0 to 1
  vulnerability: number; // 0 to 1
  threatScore: number; // 0 to 100
  lastActivity?: string;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  traffic: number; // 0 to 1
  riskWeight: number; // 0 to 1
}

export type AttackType = 'ransomware' | 'ddos' | 'phishing' | 'insider' | 'zeroday' | 'apt';

export type ScenarioType = 'ransomware_outbreak' | 'data_exfiltration' | 'supply_chain' | 'zero_day' | 'corporate_espionage' | 'critical_infrastructure' | 'ransomware_storm';

export interface SimulationEvent {
  id: string;
  timestamp: Date;
  type: 'attack' | 'defense' | 'system' | 'compromise' | 'isolation';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  nodeId?: string;
}

export type DefenseModule = 'firewall' | 'neural_isolation' | 'heuristic_scanner' | 'auto_containment';

export interface SimulationState {
  nodes: NetworkNode[];
  links: NetworkLink[];
  events: SimulationEvent[];
  isSimulating: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  metrics: {
    safe: number;
    compromised: number;
    isolated: number;
  };
  simulationSpeed: number;
  activeDefenseModules: DefenseModule[];
}
