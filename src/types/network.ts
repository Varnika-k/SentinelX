export type NodeStatus = 'safe' | 'compromised' | 'isolated' | 'quarantined' | 'degraded';
export type NodeType = 'gateway' | 'database' | 'firewall' | 'hr-system' | 'workstation' | 'server';

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  environmentId: string;
  x: number;
  y: number;
  status: NodeStatus;
  criticality: number; // 0 to 1
  vulnerability: number; // 0 to 1
  threatScore: number; // 0 to 100
  lastActivity?: string | Date;
  lastAttackType?: 'ransomware' | 'ddos' | 'phishing' | 'insider' | 'apt' | 'zero-day';
  degradation?: number; // 0 to 100 %
  latency?: number; // ms latency
  monitoringLevel?: number; // 0 to 100 % proactive monitor
  credentialsRotated?: boolean;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  traffic: number; // 0 to 1
  riskWeight: number; // 0 to 1
}
