import { Severity, EventType } from '../types/telemetry';
import { NodeStatus } from '../types/network';

export enum TelemetryTopic {
  NODE_UPDATE = 'node:update',
  ATTACK_ALERT = 'attack:alert',
  DEFENSE_ACTION = 'defense:action',
  METRIC_TICK = 'metric:tick',
  SYSTEM_LOG = 'system:log',
  THREAT_ESCALATION = 'threat:escalation',
  INCIDENT_REPORT = 'incident:report',
  INCIDENT_UPDATE = 'incident:update',
  DEFENSE_UPDATE = 'defense:update',
  UI_ACTION = 'ui:action',
  IAM_AUTH_EVENT = 'iam:auth',
  IAM_PRIVILEGE_CHANGE = 'iam:privilege',
  IAM_ACCESS_DENIED = 'iam:access_denied',
  IAM_IDENTITY_COMPROMISED = 'iam:compromised',
  ENV_BOUNDARY_VIOLATION = 'env:violation'
}

export interface IAMAuthPayload extends BaseTelemetryPayload {
  identityId: string;
  type: 'login' | 'logout' | 'token-refresh' | 'mfa-challenge';
  status: 'success' | 'failure' | 'anomaly';
  location?: string;
  userAgent?: string;
}

export interface IAMPrivilegePayload extends BaseTelemetryPayload {
  identityId: string;
  roleId: string;
  action: 'grant' | 'revoke' | 'elevate';
  requestedBy: string;
}

export interface IAMAccessPayload extends BaseTelemetryPayload {
  identityId: string;
  resourceId: string;
  action: string;
  reason: string;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected' | 'degraded';

export interface BaseTelemetryPayload {
  timestamp?: string;
  source: string;
  message?: string;
}

export interface NodeUpdatePayload extends BaseTelemetryPayload {
  nodeId: string;
  status?: NodeStatus;
  threatScore?: number;
  vulnerability?: number;
  lastAction?: string;
}

export interface AttackAlertPayload extends BaseTelemetryPayload {
  attackType: string;
  targetId: string;
  severity: Severity;
  origin: string;
  vector?: string;
}

export interface DefenseActionPayload extends BaseTelemetryPayload {
  module: string;
  action: 'enable' | 'disable' | 'patch';
  targetId?: string;
  result: 'success' | 'failure';
}

export interface MetricTickPayload extends BaseTelemetryPayload {
  metrics: {
    safe: number;
    compromised: number;
    isolated: number;
    total: number;
    threatLevel: Severity;
    systemHealth: number;
  };
}

export interface IncidentPayload extends BaseTelemetryPayload {
  incidentId: string;
  type: string;
  status: 'active' | 'resolved';
  affectedNodes: string[];
  summary?: string;
}

export interface DefenseUpdatePayload extends BaseTelemetryPayload {
  activeModules?: string[];
  spreadVelocity?: number;
}

export interface ZoneUpdatePayload extends BaseTelemetryPayload {
  zoneType: string;
  vulnerability: number;
}

export interface TelemetryEnvelope<T = any> {
  topic: TelemetryTopic;
  payload: T;
}
