import { eventBus } from '../core/event-bus';
import { TelemetryEventType, TelemetryEvent } from '../schemas/telemetry';
import { logger } from '../core/logger';
import { v4 as uuidv4 } from 'uuid';

// Helper for random picking
const pickOne = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export class TelemetryGenerator {
  private interval: NodeJS.Timeout | null = null;
  private readonly nodes = [
    'srv-prod-01', 'db-core-master', 'pc-admin-hq', 'gw-perimeter-01', 
    'cloud-storage-bucket', 'iam-root-account',
    'k8s-pod-auth-api-559b', 'k8s-pod-payment-gw-88c2', 'aws-lambda-payment-processor',
    'k8s-svc-ingress-nginx', 'azure-vm-ad-connector'
  ];

  constructor() {}

  public start() {
    logger.info('Starting Cloud-Native Telemetry Generator...');
    this.interval = setInterval(() => {
      this.generateRandomEvent();
    }, 3000); // Slightly faster for more activity
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateRandomEvent() {
    const chance = Math.random();
    let event: TelemetryEvent;

    if (chance < 0.1) {
      event = this.createAttackEvent();
    } else if (chance < 0.15) {
      event = this.createK8sEvent();
    } else if (chance < 0.2) {
      event = this.createCloudEvent();
    } else if (chance < 0.3) {
      event = this.createCompromiseEvent();
    } else if (chance < 0.4) {
      event = this.createDefenseEvent();
    } else if (chance < 0.6) {
      event = this.createAlertEvent();
    } else {
      event = this.createLogEvent();
    }

    // Publish through the event bus
    const topic = this.getTopicForEvent(event.type);
    eventBus.publish(topic, event);
  }

  private createK8sEvent(): TelemetryEvent {
    const types = [
      TelemetryEventType.K8S_POD_CREATED,
      TelemetryEventType.K8S_RBAC_MODIFIED,
      TelemetryEventType.CONTAINER_CRASHED,
      TelemetryEventType.K8S_AUDIT_LOG_ENTRY
    ];
    const type = pickOne(types);
    const node = pickOne(this.nodes.filter(n => n.startsWith('k8s')));
    
    let message = `Kubernetes event: ${type} on ${node}`;
    let severity: TelemetryEvent['severity'] = 'low';

    if (type === TelemetryEventType.K8S_RBAC_MODIFIED) {
      message = `Critical RBAC modification detected: cluster-admin role bound to 'default' service account`;
      severity = 'high';
    } else if (type === TelemetryEventType.CONTAINER_CRASHED) {
      message = `Container crash loop back-off on ${node}`;
      severity = 'medium';
    }

    return {
      id: uuidv4(),
      type,
      severity,
      source: 'K8S_WATCHDOG',
      message,
      timestamp: new Date().toISOString(),
      nodeId: node,
      payload: { namespace: 'production', cluster: 'sentinel-prod-01' }
    };
  }

  private createCloudEvent(): TelemetryEvent {
    const types = [
      TelemetryEventType.CLOUD_API_ANOMALY,
      TelemetryEventType.IAM_PRIVILEGE_ESCALATION,
      TelemetryEventType.INFRA_DRIFT_DETECTED
    ];
    const type = pickOne(types);
    
    let message = `Cloud infrastructure event: ${type}`;
    let severity: TelemetryEvent['severity'] = 'medium';

    if (type === TelemetryEventType.IAM_PRIVILEGE_ESCALATION) {
      message = `IAM Anomaly: User 'dev-user-1' attempted 'iam:CreatePolicyVersion' (Potentially Escalation)`;
      severity = 'high';
    } else if (type === TelemetryEventType.CLOUD_API_ANOMALY) {
      message = `Abnormal AWS API call volume from unknown IP 192.168.45.12`;
      severity = 'critical';
    }

    return {
      id: uuidv4(),
      type,
      severity,
      source: 'CLOUD_SENTINEL_AI',
      message,
      timestamp: new Date().toISOString(),
      payload: { region: 'us-east-1', provider: 'aws' }
    };
  }

  private createAttackEvent(): TelemetryEvent {
    const types = ['Ransomware Propagation', 'L7 DDoS Flood', 'SSH Brute Force', 'SQL Injection', 'Cross-Site Scripting'];
    const node = pickOne(this.nodes);
    return {
      id: uuidv4(),
      type: TelemetryEventType.ATTACK_STARTED,
      severity: 'high',
      source: 'IDS_CLUSTER_A',
      message: `${pickOne(types)} detected targeting ${node}`,
      timestamp: new Date().toISOString(),
      nodeId: node,
      payload: {
        origin_ip: `10.45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target_port: pickOne([80, 443, 22, 3306])
      }
    };
  }

  private createCompromiseEvent(): TelemetryEvent {
    const node = pickOne(this.nodes);
    return {
      id: uuidv4(),
      type: TelemetryEventType.NODE_COMPROMISED,
      severity: 'critical',
      source: 'EDR_SENTINEL',
      message: `System integrity violation on ${node}: Unauthorized shell access`,
      timestamp: new Date().toISOString(),
      nodeId: node
    };
  }

  private createDefenseEvent(): TelemetryEvent {
    const node = pickOne(this.nodes);
    return {
      id: uuidv4(),
      type: TelemetryEventType.DEFENSE_TRIGGERED,
      severity: 'medium',
      source: 'AUTONOMOUS_DEFENSE_ENGINE',
      message: `Automatic isolation rule applied to ${node}`,
      timestamp: new Date().toISOString(),
      nodeId: node,
      payload: {
        action: 'ISOLATE',
        reason: 'Suspicious outbound traffic spike'
      }
    };
  }

  private createAlertEvent(): TelemetryEvent {
    return {
      id: uuidv4(),
      type: TelemetryEventType.TELEMETRY_ALERT,
      severity: 'medium',
      source: 'METRIC_ANALYZER',
      message: `Anomaly detected: CPU usage spike (98%) on processing node`,
      timestamp: new Date().toISOString()
    };
  }

  private createLogEvent(): TelemetryEvent {
    const messages = [
      'Daily backup job completed successfully',
      'IAM policy update synchronized',
      'New endpoint registered: mobile-device-882',
      'System health check status: healthy',
      'Database replication latency within limits'
    ];
    return {
      id: uuidv4(),
      type: TelemetryEventType.SYSTEM_LOG,
      severity: 'low',
      source: 'SYSTEM_MONITOR',
      message: pickOne(messages),
      timestamp: new Date().toISOString()
    };
  }

  private getTopicForEvent(type: TelemetryEventType): string {
    switch (type) {
      case TelemetryEventType.ATTACK_STARTED: return 'attack:alert';
      case TelemetryEventType.NODE_COMPROMISED: return 'node:update';
      case TelemetryEventType.DEFENSE_TRIGGERED: return 'defense:action';
      case TelemetryEventType.SYSTEM_LOG: return 'system:log';
      case TelemetryEventType.TELEMETRY_ALERT: return 'telemetry:alert';
      case TelemetryEventType.K8S_POD_CREATED:
      case TelemetryEventType.K8S_POD_DELETED:
      case TelemetryEventType.K8S_RBAC_MODIFIED:
      case TelemetryEventType.K8S_AUDIT_LOG_ENTRY:
      case TelemetryEventType.CONTAINER_CRASHED:
        return 'telemetry:event:k8s';
      case TelemetryEventType.CLOUD_API_ANOMALY:
      case TelemetryEventType.IAM_PRIVILEGE_ESCALATION:
      case TelemetryEventType.INFRA_DRIFT_DETECTED:
        return 'telemetry:event:cloud';
      default: return 'telemetry:event';
    }
  }
}

// Since I don't have uuid installed, I'll use a simple shim or install it.
// I'll install it to be professional.
