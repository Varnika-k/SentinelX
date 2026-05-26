import { NetworkNode, NetworkLink, NodeType } from '../types/network';
import { TelemetryEvent } from '../types/telemetry';
import { SimulationState, AttackType } from '../types/simulation';
import { TelemetryService } from '../core/telemetry-service';
import { EnterpriseIdentity, IAMRole, IdentityRelationship, EnvironmentSegment } from '../types/iam';

import { CyberKnowledgeBase } from '../types/intelligence';
import { AgentOrchestrationState, AIAgent } from '../types/agents';

export const INITIAL_AGENTS: AIAgent[] = [
  { id: 'agent-threat', name: 'RAVEN', role: 'threat_analyst', description: 'Pattern recognition & behavioral threat analysis', status: 'idle', confidenceScore: 0.95, lastActive: new Date(), capabilities: ['pattern_matching', 'threat_modeling'] },
  { id: 'agent-responder', name: 'AEGIS', role: 'incident_responder', description: 'Automated containment & mitigation planning', status: 'idle', confidenceScore: 0.88, lastActive: new Date(), capabilities: ['containment', 'remediation'] },
  { id: 'agent-graph', name: 'ORBIT', role: 'graph_specialist', description: 'Network topology & blast radius optimization', status: 'idle', confidenceScore: 0.92, lastActive: new Date(), capabilities: ['graph_theory', 'blast_radius'] },
  { id: 'agent-iam', name: 'KEYSTONE', role: 'identity_expert', description: 'Privilege escalation & IAM risk assessment', status: 'idle', confidenceScore: 0.9, lastActive: new Date(), capabilities: ['iam_audit', 'escalation_detection'] },
];

export const INITIAL_ORCHESTRATION: AgentOrchestrationState = {
  agents: INITIAL_AGENTS,
  recentReasoning: [],
  operationalMemory: []
};

export const INITIAL_KNOWLEDGE_BASE: CyberKnowledgeBase = {
  campaigns: [],
  actors: [
    { id: 'actor-1', name: 'SILVER_HAWK', origin: 'External/Unknown', reputation: 85, associatedTechniques: ['T1566', 'T1078'], firstSeen: new Date('2024-01-01'), lastSeen: new Date() },
    { id: 'actor-2', name: 'DRIFTING_SAND', origin: 'Proxy/North-Asia', reputation: 92, associatedTechniques: ['T1190', 'T1021'], firstSeen: new Date('2024-02-15'), lastSeen: new Date() }
  ],
  baselines: [],
  anomalies: [],
  relationships: []
};

export const INITIAL_ENVIRONMENTS: EnvironmentSegment[] = [
  { id: 'env-edge', type: 'corporate', label: 'Perimeter Network Segment', trustBoundaries: ['env-prod'], nodes: ['gw-1', 'fw-1', 'waf-2', 'sandbox-honeypot', 'soc-metric-collector'], securityLevel: 0.8 },
  { id: 'env-prod', type: 'production', label: 'Core Production Mesh', trustBoundaries: ['env-staging'], nodes: ['srv-1', 'db-1', 'db-2', 'backup-1', 'kub-node-1', 'kub-node-2', 'quarantine-box-1'], securityLevel: 0.95 },
  { id: 'env-staging', type: 'staging', label: 'Staging & Sandbox API Cluster', trustBoundaries: ['env-dev'], nodes: ['hr-1', 'cloud-1', 'staging-api'], securityLevel: 0.75 },
  { id: 'env-dev', type: 'development', label: 'Enterprise Workspace Subnet', trustBoundaries: [], nodes: ['pc-1', 'pc-2', 'pc-3', 'iot-1'], securityLevel: 0.45 },
  { id: 'env-identity', type: 'corporate', label: 'Identity Directory Forest', trustBoundaries: ['env-prod'], nodes: ['srv-2', 'iam-ad-1', 'user-identity-vault'], securityLevel: 1.0 },
  { id: 'env-cloud', type: 'cloud-aws', label: 'AWS Elastic Core', trustBoundaries: ['env-prod'], nodes: ['cloud-s3-bucket', 'cloud-lambda-1'], securityLevel: 0.85 },
];

export const INITIAL_NODES: NetworkNode[] = [
  // --- Perimeter Segment ---
  { id: 'gw-1', label: 'Internet Gateway', type: 'gateway', environmentId: 'env-edge', x: -80, y: 150, status: 'safe', criticality: 0.9, vulnerability: 0.4, threatScore: 0, latency: 12, monitoringLevel: 90 },
  { id: 'fw-1', label: 'Perimeter Firewall', type: 'firewall', environmentId: 'env-edge', x: -30, y: 150, status: 'safe', criticality: 0.95, vulnerability: 0.15, threatScore: 0, latency: 4, monitoringLevel: 100 },
  { id: 'waf-2', label: 'WAF LoadBalancer', type: 'firewall', environmentId: 'env-edge', x: -30, y: 90, status: 'safe', criticality: 0.85, vulnerability: 0.25, threatScore: 0, latency: 15, monitoringLevel: 80 },
  { id: 'sandbox-honeypot', label: 'Canary Honeypot', type: 'server', environmentId: 'env-edge', x: -140, y: 60, status: 'safe', criticality: 0.1, vulnerability: 0.95, threatScore: 0, latency: 45, monitoringLevel: 50 },

  // --- Production App Segment ---
  { id: 'srv-1', label: 'Public Web Application Hub', type: 'server', environmentId: 'env-prod', x: 200, y: 0, status: 'safe', criticality: 0.9, vulnerability: 0.35, threatScore: 0, latency: 18, monitoringLevel: 85 },
  { id: 'kub-node-1', label: 'API Kubernetes Pod Alpha', type: 'server', environmentId: 'env-prod', x: 250, y: -40, status: 'safe', criticality: 0.8, vulnerability: 0.4, threatScore: 0, latency: 6, monitoringLevel: 75 },
  { id: 'kub-node-2', label: 'Secure DB Proxy Controller', type: 'server', environmentId: 'env-prod', x: 250, y: 60, status: 'safe', criticality: 0.9, vulnerability: 0.1, threatScore: 0, latency: 2, monitoringLevel: 95 },

  // --- Staging Portal Segment ---
  { id: 'hr-1', label: 'Staging Payroll DB Sync', type: 'hr-system', environmentId: 'env-staging', x: 200, y: -150, status: 'safe', criticality: 0.85, vulnerability: 0.5, threatScore: 0, latency: 22, monitoringLevel: 60 },
  { id: 'staging-api', label: 'OAuth Sandbox Gateway', type: 'server', environmentId: 'env-staging', x: 140, y: -120, status: 'safe', criticality: 0.7, vulnerability: 0.6, threatScore: 0, latency: 35, monitoringLevel: 40 },

  // --- Business Critical Data Crypt ---
  { id: 'db-1', label: 'Core Customer Database', type: 'database', environmentId: 'env-prod', x: 380, y: -60, status: 'safe', criticality: 1.0, vulnerability: 0.15, threatScore: 0, latency: 4, monitoringLevel: 100 },
  { id: 'db-2', label: 'Financial Transactions Vault', type: 'database', environmentId: 'env-prod', x: 380, y: 40, status: 'safe', criticality: 1.0, vulnerability: 0.1, threatScore: 0, latency: 1, monitoringLevel: 100 },
  { id: 'backup-1', label: 'Disaster Recovery Cold Storage', type: 'database', environmentId: 'env-prod', x: 440, y: -10, status: 'safe', criticality: 0.95, vulnerability: 0.05, threatScore: 0, latency: 50, monitoringLevel: 90 },

  // --- Active Directory Forest Segment ---
  { id: 'srv-2', label: 'Active Directory Domain Master', type: 'server', environmentId: 'env-identity', x: 50, y: 300, status: 'safe', criticality: 1.0, vulnerability: 0.2, threatScore: 0, latency: 3, monitoringLevel: 100 },
  { id: 'iam-ad-1', label: 'Internal IAM Kerberos Server', type: 'hr-system', environmentId: 'env-identity', x: 100, y: 330, status: 'safe', criticality: 0.95, vulnerability: 0.3, threatScore: 0, latency: 8, monitoringLevel: 95 },
  { id: 'user-identity-vault', label: 'Global Security Tokens Vault', type: 'hr-system', environmentId: 'env-identity', x: 0, y: 350, status: 'safe', criticality: 1.0, vulnerability: 0.08, threatScore: 0, latency: 2, monitoringLevel: 100 },

  // --- AWS Cloud Platform Segment ---
  { id: 'cloud-1', label: 'AWS Cloud API Proxy', type: 'gateway', environmentId: 'env-cloud', x: 50, y: -100, status: 'safe', criticality: 0.85, vulnerability: 0.45, threatScore: 0, latency: 15, monitoringLevel: 80 },
  { id: 'cloud-s3-bucket', label: 'Confidential Media S3 Bucket', type: 'database', environmentId: 'env-cloud', x: 110, y: -130, status: 'safe', criticality: 0.9, vulnerability: 0.3, threatScore: 0, latency: 40, monitoringLevel: 70 },
  { id: 'cloud-lambda-1', label: 'Card Payment Lambda Worker', type: 'server', environmentId: 'env-cloud', x: 0, y: -140, status: 'safe', criticality: 0.95, vulnerability: 0.2, threatScore: 0, latency: 18, monitoringLevel: 90 },

  // --- Corporate Endpoints Segment ---
  { id: 'pc-1', label: 'DevOps Administrator Workstation', type: 'workstation', environmentId: 'env-dev', x: 300, y: 220, status: 'safe', criticality: 0.9, vulnerability: 0.3, threatScore: 0, latency: 14, monitoringLevel: 95 },
  { id: 'pc-2', label: 'Corporate Billing PC', type: 'workstation', environmentId: 'env-dev', x: 350, y: 280, status: 'safe', criticality: 0.5, vulnerability: 0.65, threatScore: 0, latency: 16, monitoringLevel: 70 },
  { id: 'pc-3', label: 'VP Marketing Work Laptop', type: 'workstation', environmentId: 'env-dev', x: 400, y: 240, status: 'safe', criticality: 0.7, vulnerability: 0.75, threatScore: 0, latency: 24, monitoringLevel: 45 },
  { id: 'iot-1', label: 'Reception IP CCTV camera', type: 'gateway', environmentId: 'env-dev', x: 260, y: 280, status: 'safe', criticality: 0.3, vulnerability: 0.85, threatScore: 0, latency: 30, monitoringLevel: 25 },

  // --- SIEM & Security Observability ---
  { id: 'soc-metric-collector', label: 'Audit Log Forwarder Broker', type: 'gateway', environmentId: 'env-edge', x: 200, y: -80, status: 'safe', criticality: 0.8, vulnerability: 0.2, threatScore: 0, latency: 5, monitoringLevel: 100 },

  // --- Isolation Control Subnet ---
  { id: 'quarantine-box-1', label: 'Sandboxed Cyber Containment Node', type: 'server', environmentId: 'env-prod', x: 450, y: 150, status: 'safe', criticality: 0.2, vulnerability: 0.8, threatScore: 0, latency: 99, monitoringLevel: 100 }
];

export const INITIAL_ROLES: IAMRole[] = [
  { id: 'role-admin', name: 'Global Administrator', permissions: ['*'] },
  { id: 'role-dev', name: 'Developer', permissions: ['read', 'write:dev', 'execute:staging'], inheritance: [] },
  { id: 'role-hr', name: 'HR Manager', permissions: ['read:hr', 'write:hr'], inheritance: [] },
  { id: 'role-svca', name: 'Cloud Service Agent', permissions: ['cloud:access'], inheritance: [] },
];

export const INITIAL_IDENTITIES: EnterpriseIdentity[] = [
  { 
    id: 'id-ceo', 
    name: 'Sarah Chen', 
    type: 'admin', 
    status: 'active', 
    roles: ['role-admin'], 
    riskScore: 5, 
    groups: ['Executive'], 
    mfaEnabled: true, 
    clearanceLevel: 5, 
    accessibleNodes: ['srv-1', 'pc-1', 'db-1', 'db-2', 'user-identity-vault'],
    environments: ['production', 'corporate']
  },
  { 
    id: 'id-dev-1', 
    name: 'Marcus Miller', 
    type: 'user', 
    status: 'active', 
    roles: ['role-dev'], 
    riskScore: 12, 
    groups: ['Engineering'], 
    mfaEnabled: true, 
    clearanceLevel: 3, 
    accessibleNodes: ['pc-1', 'pc-2', 'pc-3', 'hr-1'],
    environments: ['development', 'staging']
  },
  { 
    id: 'id-svca-1', 
    name: 'AWS Integration Agent', 
    type: 'service-account', 
    status: 'active', 
    roles: ['role-svca'], 
    riskScore: 20, 
    groups: ['Cloud'], 
    mfaEnabled: false, 
    clearanceLevel: 4, 
    accessibleNodes: ['cloud-1', 'srv-1', 'cloud-s3-bucket'],
    environments: ['cloud-aws', 'production']
  },
  { 
    id: 'id-hr-1', 
    name: 'Jessica Wong', 
    type: 'user', 
    status: 'active', 
    roles: ['role-hr'], 
    riskScore: 8, 
    groups: ['HR'], 
    mfaEnabled: true, 
    clearanceLevel: 2, 
    accessibleNodes: ['hr-1'],
    environments: ['staging']
  },
];

export const INITIAL_RELATIONSHIPS: IdentityRelationship[] = [
  { id: 'rel-1', sourceId: 'id-ceo', targetId: 'id-dev-1', type: 'trust', trustLevel: 0.9 },
  { id: 'rel-2', sourceId: 'id-dev-1', targetId: 'pc-1', type: 'access', trustLevel: 1.0 },
  { id: 'rel-3', sourceId: 'role-dev', targetId: 'role-admin', type: 'trust', trustLevel: 0.2 },
];

export const INITIAL_LINKS: NetworkLink[] = [
  // --- INGRESS ROUTING / PERIMETER FABRIC ---
  { id: 'l1', source: 'gw-1', target: 'fw-1', traffic: 0.8, riskWeight: 0.2, type: 'telemetry' },
  { id: 'l1-waf', source: 'gw-1', target: 'waf-2', traffic: 0.6, riskWeight: 0.15, type: 'telemetry' },
  { id: 'l1-honey', source: 'gw-1', target: 'sandbox-honeypot', traffic: 0.1, riskWeight: 0.45, type: 'telemetry' },
  { id: 'l2', source: 'fw-1', target: 'srv-1', traffic: 0.5, riskWeight: 0.1, type: 'api' },
  { id: 'l3', source: 'fw-1', target: 'pc-1', traffic: 0.3, riskWeight: 0.1, type: 'trust' },
  { id: 'l3-waf-srv', source: 'waf-2', target: 'srv-1', traffic: 0.5, riskWeight: 0.1, type: 'api' },

  // --- PRODUCTION SERVICES / DATABASE CORE ---
  { id: 'l4', source: 'srv-1', target: 'db-1', traffic: 0.6, riskWeight: 0.05, type: 'database' },
  { id: 'l4-db2', source: 'srv-1', target: 'db-2', traffic: 0.4, riskWeight: 0.05, type: 'database' },
  { id: 'l4-kub1', source: 'srv-1', target: 'kub-node-1', traffic: 0.7, riskWeight: 0.02, type: 'api' },
  { id: 'l4-kub2', source: 'srv-1', target: 'kub-node-2', traffic: 0.5, riskWeight: 0.02, type: 'api' },
  { id: 'l4-proxy-db1', source: 'kub-node-2', target: 'db-1', traffic: 0.4, riskWeight: 0.01, type: 'database' },
  { id: 'l4-proxy-db2', source: 'kub-node-2', target: 'db-2', traffic: 0.3, riskWeight: 0.01, type: 'database' },
  { id: 'l9', source: 'db-1', target: 'backup-1', traffic: 0.1, riskWeight: 0.05, type: 'replication' },
  { id: 'l9-db2-backup', source: 'db-2', target: 'backup-1', traffic: 0.1, riskWeight: 0.05, type: 'replication' },

  // --- IDENTITY & ACCESS DIRECTORY ---
  { id: 'l-auth-main', source: 'srv-1', target: 'srv-2', traffic: 0.35, riskWeight: 0.15, type: 'authentication' },
  { id: 'l-ad-kerberos', source: 'srv-2', target: 'iam-ad-1', traffic: 0.5, riskWeight: 0.05, type: 'authentication' },
  { id: 'l-ad-token-vault', source: 'iam-ad-1', target: 'user-identity-vault', traffic: 0.2, riskWeight: 0.01, type: 'authentication' },
  { id: 'l-pc1-auth', source: 'pc-1', target: 'srv-2', traffic: 0.2, riskWeight: 0.2, type: 'authentication' },

  // --- AWS CLOUD RECONCILIATION ---
  { id: 'l8', source: 'cloud-1', target: 'srv-1', traffic: 0.3, riskWeight: 0.2, type: 'cloud' },
  { id: 'l8-s3', source: 'cloud-1', target: 'cloud-s3-bucket', traffic: 0.5, riskWeight: 0.1, type: 'cloud' },
  { id: 'l8-lambda', source: 'cloud-1', target: 'cloud-lambda-1', traffic: 0.4, riskWeight: 0.15, type: 'cloud' },
  { id: 'l-lambda-db2', source: 'cloud-lambda-1', target: 'db-2', traffic: 0.2, riskWeight: 0.1, type: 'database' },

  // --- ENTERPRISE ENDPOINTS ---
  { id: 'l5', source: 'pc-1', target: 'hr-1', traffic: 0.2, riskWeight: 0.1, type: 'trust' },
  { id: 'l6', source: 'pc-1', target: 'pc-2', traffic: 0.1, riskWeight: 0.1, type: 'telemetry' },
  { id: 'l-exec-pc3', source: 'pc-3', target: 'fw-1', traffic: 0.15, riskWeight: 0.25, type: 'telemetry' },
  { id: 'l10', source: 'iot-1', target: 'fw-1', traffic: 0.1, riskWeight: 0.4, type: 'telemetry' },
  { id: 'l-iot-pc2', source: 'iot-1', target: 'pc-2', traffic: 0.05, riskWeight: 0.35, type: 'telemetry' },

  // --- STAGING ENVIRONMENT ---
  { id: 'l7', source: 'srv-1', target: 'hr-1', traffic: 0.4, riskWeight: 0.1, type: 'api' },
  { id: 'l-staging-mesh', source: 'staging-api', target: 'hr-1', traffic: 0.3, riskWeight: 0.15, type: 'api' },

  // --- OBSERVABILITY LAYER ---
  { id: 'l-soc-srv1', source: 'srv-1', target: 'soc-metric-collector', traffic: 0.5, riskWeight: 0.02, type: 'telemetry' },
  { id: 'l-soc-db1', source: 'db-1', target: 'soc-metric-collector', traffic: 0.3, riskWeight: 0.02, type: 'telemetry' },
  { id: 'l-soc-ad', source: 'srv-2', target: 'soc-metric-collector', traffic: 0.3, riskWeight: 0.01, type: 'telemetry' },

  // --- ISOLATION CONTROLS ---
  { id: 'l-quarantine-node', source: 'quarantine-box-1', target: 'fw-1', traffic: 0.01, riskWeight: 0.01, type: 'telemetry' }
];


export function getThreatSeverity(compromisedCount: number, totalCount: number): 'low' | 'medium' | 'high' | 'critical' {
  const percent = compromisedCount / totalCount;
  if (percent === 0) return 'low';
  if (percent < 0.2) return 'medium';
  if (percent < 0.5) return 'high';
  return 'critical';
}

export function createEvent(message: string, type: any, severity: any = 'low', nodeId?: string): TelemetryEvent {
  return TelemetryService.createEvent(message, type, severity, undefined, nodeId);
}

export const SCENARIOS = {
  ransomware_outbreak: {
    name: "Ransomware Outbreak",
    description: "Aggressive spread through workstations.",
    attackType: 'ransomware' as AttackType
  },
  database_exfiltration: {
    name: "DB Exfiltration",
    description: "Targeted attack on user data storage.",
    attackType: 'insider' as AttackType
  }
};

export function calculateHeatmap(node: NetworkNode, links: NetworkLink[], allNodes: NetworkNode[]) {
  // If node is compromised, heat is max.
  // If neighbor is compromised, heat is partial.
  if (node.status === 'compromised') return 1.0;
  
  const compromisedNeighbors = links
    .filter(l => l.source === node.id || l.target === node.id)
    .map(l => l.source === node.id ? l.target : l.source)
    .filter(id => allNodes.find(n => n.id === id)?.status === 'compromised');

  return Math.min(compromisedNeighbors.length * 0.3 + (node.threatScore / 100), 0.8);
}
