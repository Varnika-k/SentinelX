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

export class MockSIEMConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    // Simulate finding one event
    if (Math.random() > 0.7) {
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.SIEM,
        ingestTimestamp: new Date(),
        confidence: 0.95,
        rawPayload: {
          timestamp: new Date().toISOString(),
          rule_name: 'Brute Force Attempt Detected',
          action: 'logged',
          priority: 'high',
          dest_ip: '10.0.0.45',
          src_ip: '192.168.1.100'
        }
      }];
    }
    return [];
  }
}

export class CloudTrailConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.8) {
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.CLOUD_TRAIL,
        ingestTimestamp: new Date(),
        confidence: 1.0,
        rawPayload: {
          timestamp: new Date().toISOString(),
          event_name: 'AuthorizeSecurityGroupIngress',
          user_id: 'arn:aws:iam::123456789012:user/admin',
          resource_id: 'sg-0123456789abcdef0',
          risk_level: 'medium'
        }
      }];
    }
    return [];
  }
}

export class EDRConnector extends TelemetryConnector {
  public async poll(): Promise<RawTelemetryEvent[]> {
    if (!this.isEnabled()) return [];
    
    if (Math.random() > 0.9) {
      return [{
        sourceId: this.config.id,
        sourceType: TelemetrySourceType.EDR,
        ingestTimestamp: new Date(),
        confidence: 0.9,
        rawPayload: {
          timestamp: new Date().toISOString(),
          hostname: 'WKSTN-FIN-01',
          process_name: 'powershell.exe',
          command_line: 'powershell.exe -ExecutionPolicy Bypass -File C:\\Users\\Public\\exploit.ps1',
          severity: 'high'
        }
      }];
    }
    return [];
  }
}
