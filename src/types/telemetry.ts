import { NodeStatus } from './network';

export type EventType = 'attack' | 'defense' | 'system' | 'compromise' | 'isolation';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface TelemetryEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  message: string;
  severity: Severity;
  nodeId?: string; // Standardized field for UI filtering
  origin?: string; // Original source ID
  target?: string; // Target ID
  metadata?: Record<string, any>;
}

export interface SimulationMetrics {
  safe: number;
  compromised: number;
  isolated: number;
  total: number;
  threatLevel?: Severity;
}

export interface NetworkMetrics extends SimulationMetrics {
  activeThreats: number;
  systemHealth: number; // 0 to 100
}
