import { Severity, TelemetryEvent } from './telemetry';
import { AIAnalysisResponse } from './ai';

export type IncidentStatus = 'detected' | 'investigating' | 'escalated' | 'contained' | 'resolved' | 'archived';

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  priority: 'low' | 'medium' | 'high' | 'critical';
  detectionTime: Date;
  lastUpdateTime: Date;
  resolvedTime?: Date;
  affectedNodeIds: string[];
  attackType?: string;
  events: TelemetryEvent[];
  riskScore: number;
  blastRadius: number; // 0-1
  compromiseChain: string[]; // List of node IDs
  aiAssessment?: AIAnalysisResponse;
  analystNotes: string[];
  assignedTo?: string;
}

export interface SOCAnalytics {
  activeIncidents: number;
  meanTimeToResolve: number; // in milliseconds
  incidentTrends: { timestamp: number; count: number }[];
  attackFrequency: Record<string, number>;
  infrastructureRiskHistory: { timestamp: number; score: number }[];
}
