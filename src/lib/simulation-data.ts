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
  { id: 'env-prod', type: 'production', label: 'Production Mesh', trustBoundaries: ['env-staging'], nodes: ['srv-1', 'db-1', 'backup-1'], securityLevel: 0.9 },
  { id: 'env-staging', type: 'staging', label: 'Staging Cluster', trustBoundaries: ['env-dev'], nodes: ['hr-1', 'cloud-1'], securityLevel: 0.7 },
  { id: 'env-dev', type: 'development', label: 'R&D Lab', trustBoundaries: [], nodes: ['pc-1', 'pc-2', 'iot-1'], securityLevel: 0.4 },
  { id: 'env-edge', type: 'corporate', label: 'Edge Network', trustBoundaries: ['env-prod'], nodes: ['gw-1', 'fw-1'], securityLevel: 0.6 },
];

export const INITIAL_NODES: NetworkNode[] = [
  { id: 'gw-1', label: 'Internet Gateway', type: 'gateway', environmentId: 'env-edge', x: 10, y: 50, status: 'safe', criticality: 0.9, vulnerability: 0.4, threatScore: 0 },
  { id: 'fw-1', label: 'External Firewall', type: 'firewall', environmentId: 'env-edge', x: 25, y: 50, status: 'safe', criticality: 0.8, vulnerability: 0.2, threatScore: 0 },
  { id: 'srv-1', label: 'Main Server', type: 'server', environmentId: 'env-prod', x: 45, y: 30, status: 'safe', criticality: 0.95, vulnerability: 0.3, threatScore: 0 },
  { id: 'db-1', label: 'User Database', type: 'database', environmentId: 'env-prod', x: 75, y: 30, status: 'safe', criticality: 1.0, vulnerability: 0.2, threatScore: 0 },
  { id: 'pc-1', label: 'Admin Workstation', type: 'workstation', environmentId: 'env-dev', x: 45, y: 70, status: 'safe', criticality: 0.7, vulnerability: 0.5, threatScore: 0 },
  { id: 'hr-1', label: 'HR Portal', type: 'hr-system', environmentId: 'env-staging', x: 75, y: 70, status: 'safe', criticality: 0.6, vulnerability: 0.6, threatScore: 0 },
  { id: 'pc-2', label: 'Sales PC', type: 'workstation', environmentId: 'env-dev', x: 35, y: 90, status: 'safe', criticality: 0.4, vulnerability: 0.7, threatScore: 0 },
  { id: 'cloud-1', label: 'AWS S3 Proxy', type: 'gateway', environmentId: 'env-staging', x: 60, y: 15, status: 'safe', criticality: 0.8, vulnerability: 0.4, threatScore: 0 },
  { id: 'backup-1', label: 'Offline Backup', type: 'database', environmentId: 'env-prod', x: 90, y: 50, status: 'safe', criticality: 1.0, vulnerability: 0.1, threatScore: 0 },
  { id: 'iot-1', label: 'Security Cam', type: 'gateway', environmentId: 'env-dev', x: 20, y: 80, status: 'safe', criticality: 0.2, vulnerability: 0.9, threatScore: 0 },
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
    accessibleNodes: ['srv-1', 'pc-1', 'db-1'],
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
    accessibleNodes: ['pc-1', 'pc-2', 'hr-1'],
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
    accessibleNodes: ['cloud-1', 'srv-1'],
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
  { id: 'l1', source: 'gw-1', target: 'fw-1', traffic: 0.8, riskWeight: 0.2 },
  { id: 'l2', source: 'fw-1', target: 'srv-1', traffic: 0.5, riskWeight: 0.1 },
  { id: 'l3', source: 'fw-1', target: 'pc-1', traffic: 0.3, riskWeight: 0.1 },
  { id: 'l4', source: 'srv-1', target: 'db-1', traffic: 0.6, riskWeight: 0.05 },
  { id: 'l5', source: 'pc-1', target: 'hr-1', traffic: 0.2, riskWeight: 0.1 },
  { id: 'l6', source: 'pc-1', target: 'pc-2', traffic: 0.1, riskWeight: 0.1 },
  { id: 'l7', source: 'srv-1', target: 'hr-1', traffic: 0.4, riskWeight: 0.1 },
  { id: 'l8', source: 'cloud-1', target: 'srv-1', traffic: 0.3, riskWeight: 0.2 },
  { id: 'l9', source: 'db-1', target: 'backup-1', traffic: 0.1, riskWeight: 0.05 },
  { id: 'l10', source: 'iot-1', target: 'fw-1', traffic: 0.1, riskWeight: 0.4 },
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
