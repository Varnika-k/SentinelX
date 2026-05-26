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
  type?: 'telemetry' | 'authentication' | 'database' | 'api' | 'cloud' | 'trust' | 'replication';
}

export type SectorType = 'CLOUD' | 'IDENTITY' | 'PERIMETER' | 'PRODUCTION' | 'DATA_CORE' | 'OBSERVABILITY' | 'DEV_LAB' | 'ISOLATION_ZONE';

export const SECTOR_NAMES: Record<SectorType, string> = {
  PERIMETER: 'Perimeter Boundary Gateway',
  IDENTITY: 'IAM & Directory Core',
  CLOUD: 'Multi-Cloud Mesh',
  PRODUCTION: 'Production App Clusters',
  DATA_CORE: 'Business Critical Data Crypt',
  OBSERVABILITY: 'Observability & SIEM',
  DEV_LAB: 'Enterprise User Endpoints',
  ISOLATION_ZONE: 'Containment & Quarantine Subnet'
};

export function getNodeSector(node: { id: string; type: string; environmentId: string }): SectorType {
  if (node.environmentId === 'env-isolation' || node.id.includes('quarantine') || node.id.includes('iso')) {
    return 'ISOLATION_ZONE';
  }
  if (node.environmentId === 'env-edge' || node.id.startsWith('gw') || node.id.startsWith('fw') || node.id.includes('waf') || node.id.includes('honeypot')) {
    return 'PERIMETER';
  }
  if (node.environmentId === 'env-identity' || node.id.includes('iam') || node.id.includes('ad') || node.id.includes('auth')) {
    return 'IDENTITY';
  }
  if (node.environmentId === 'env-cloud' || node.id.startsWith('cloud') || node.id.includes('lambda') || node.id.includes('s3')) {
    return 'CLOUD';
  }
  if (node.id.includes('soc') || node.id.includes('collector') || node.id.includes('metric') || node.id.includes('siem')) {
    return 'OBSERVABILITY';
  }
  if (node.type === 'database' || node.id.includes('db') || node.id.includes('backup')) {
    return 'DATA_CORE';
  }
  if (node.environmentId === 'env-prod' || node.id.startsWith('srv') || node.id.includes('kub')) {
    return 'PRODUCTION';
  }
  return 'DEV_LAB';
}
