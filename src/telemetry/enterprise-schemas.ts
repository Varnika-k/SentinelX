import { Severity } from '../types/telemetry';

export enum TelemetrySourceType {
  SIEM = 'siem',
  FIREWALL = 'firewall',
  EDR = 'edr',
  XDR = 'xdr',
  CLOUD_TRAIL = 'cloud_trail',
  K8S_AUDIT = 'k8s_audit',
  AUTH_SERVICE = 'auth_service',
  NETFLOW = 'netflow',
  THREAT_INTEL = 'threat_intel',
  WAF = 'waf',
  IDS_IPS = 'ids_ips'
}

export interface RawTelemetryEvent {
  sourceId: string;
  sourceType: TelemetrySourceType;
  rawPayload: any;
  ingestTimestamp: Date;
  confidence?: number;
}

export interface NormalizedTelemetryEvent {
  id: string;
  timestamp: Date;
  source: string;
  sourceType: TelemetrySourceType;
  message: string;
  severity: Severity;
  targetAsset?: string;
  originatingIp?: string;
  category: string;
  eventSpecificData: Record<string, any>;
  tags: string[];
  confidenceScore: number;
}

export interface TelemetryConnectorConfig {
  id: string;
  name: string;
  type: TelemetrySourceType;
  enabled: boolean;
  ingestionRateLimit?: number; // events per second
  authConfig?: Record<string, any>;
}

export interface TelemetryProcessorMetrics {
  totalIngested: number;
  totalNormalized: number;
  droppedCount: number;
  avgConfidence: number;
  activeConnectors: number;
  throughputEps: number;
}
