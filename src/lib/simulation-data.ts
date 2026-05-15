import { NodeStatus, NetworkNode, NetworkLink, SimulationEvent, SimulationState, AttackType, NodeType } from '../types/simulation';

export const INITIAL_NODES: NetworkNode[] = [
  { id: 'gw-1', label: 'Internet Gateway', type: 'gateway', x: 10, y: 50, status: 'safe', criticality: 0.9, vulnerability: 0.4, threatScore: 0 },
  { id: 'fw-1', label: 'External Firewall', type: 'firewall', x: 25, y: 50, status: 'safe', criticality: 0.8, vulnerability: 0.2, threatScore: 0 },
  { id: 'srv-1', label: 'Main Server', type: 'server', x: 50, y: 30, status: 'safe', criticality: 0.95, vulnerability: 0.3, threatScore: 0 },
  { id: 'db-1', label: 'User Database', type: 'database', x: 75, y: 30, status: 'safe', criticality: 1.0, vulnerability: 0.2, threatScore: 0 },
  { id: 'pc-1', label: 'Admin Workstation', type: 'workstation', x: 50, y: 70, status: 'safe', criticality: 0.7, vulnerability: 0.5, threatScore: 0 },
  { id: 'hr-1', label: 'HR Portal', type: 'hr-system', x: 75, y: 70, status: 'safe', criticality: 0.6, vulnerability: 0.6, threatScore: 0 },
  { id: 'pc-2', label: 'Sales PC', type: 'workstation', x: 40, y: 90, status: 'safe', criticality: 0.4, vulnerability: 0.7, threatScore: 0 },
];

export const INITIAL_LINKS: NetworkLink[] = [
  { id: 'l1', source: 'gw-1', target: 'fw-1', traffic: 0.8, riskWeight: 0.2 },
  { id: 'l2', source: 'fw-1', target: 'srv-1', traffic: 0.5, riskWeight: 0.1 },
  { id: 'l3', source: 'fw-1', target: 'pc-1', traffic: 0.3, riskWeight: 0.1 },
  { id: 'l4', source: 'srv-1', target: 'db-1', traffic: 0.6, riskWeight: 0.05 },
  { id: 'l5', source: 'pc-1', target: 'hr-1', traffic: 0.2, riskWeight: 0.1 },
  { id: 'l6', source: 'pc-1', target: 'pc-2', traffic: 0.1, riskWeight: 0.1 },
  { id: 'l7', source: 'srv-1', target: 'hr-1', traffic: 0.4, riskWeight: 0.1 },
];

export function getThreatSeverity(compromisedCount: number, totalCount: number): 'low' | 'medium' | 'high' | 'critical' {
  const percent = compromisedCount / totalCount;
  if (percent === 0) return 'low';
  if (percent < 0.2) return 'medium';
  if (percent < 0.5) return 'high';
  return 'critical';
}

export function createEvent(message: string, type: any, severity: any = 'low', nodeId?: string): SimulationEvent {
  return {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date(),
    type,
    message,
    severity,
    nodeId,
  };
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
