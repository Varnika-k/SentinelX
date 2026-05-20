import { z } from 'zod';

export enum TelemetryEventType {
  NODE_COMPROMISED = 'NODE_COMPROMISED',
  ATTACK_STARTED = 'ATTACK_STARTED',
  DEFENSE_TRIGGERED = 'DEFENSE_TRIGGERED',
  THREAT_ESCALATED = 'THREAT_ESCALATED',
  INCIDENT_CREATED = 'INCIDENT_CREATED',
  NODE_ISOLATED = 'NODE_ISOLATED',
  TELEMETRY_ALERT = 'TELEMETRY_ALERT',
  SYSTEM_LOG = 'SYSTEM_LOG',
  
  // Cloud-Native Events
  K8S_POD_CREATED = 'K8S_POD_CREATED',
  K8S_POD_DELETED = 'K8S_POD_DELETED',
  K8S_RBAC_MODIFIED = 'K8S_RBAC_MODIFIED',
  K8S_AUDIT_LOG_ENTRY = 'K8S_AUDIT_LOG_ENTRY',
  CONTAINER_CRASHED = 'CONTAINER_CRASHED',
  CLOUD_API_ANOMALY = 'CLOUD_API_ANOMALY',
  IAM_PRIVILEGE_ESCALATION = 'IAM_PRIVILEGE_ESCALATION',
  INFRA_DRIFT_DETECTED = 'INFRA_DRIFT_DETECTED'
}

export enum InfraEntityType {
  K8S_POD = 'K8S_POD',
  K8S_NAMESPACE = 'K8S_NAMESPACE',
  K8S_DEPLOYMENT = 'K8S_DEPLOYMENT',
  K8S_SERVICE = 'K8S_SERVICE',
  CLOUD_EC2 = 'CLOUD_EC2',
  CLOUD_S3 = 'CLOUD_S3',
  CLOUD_LAMBDA = 'CLOUD_LAMBDA',
  CONTAINER = 'CONTAINER',
  API_ENDPOINT = 'API_ENDPOINT'
}

export const TelemetryEventSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.nativeEnum(TelemetryEventType),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string(),
  message: z.string(),
  timestamp: z.string().datetime().optional(),
  payload: z.any().optional(),
  nodeId: z.string().optional(),
  attackerId: z.string().optional()
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export const TelemetryEnvelopeSchema = z.object({
  topic: z.string(),
  payload: z.any(),
  timestamp: z.string().datetime()
});

export type TelemetryEnvelope = z.infer<typeof TelemetryEnvelopeSchema>;
