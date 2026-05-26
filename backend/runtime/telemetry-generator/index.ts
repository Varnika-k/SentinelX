import { RuntimeNodeState } from '../../core/types';

export class TelemetryGenerator {
  private static instance: TelemetryGenerator;

  private constructor() {}

  public static getInstance(): TelemetryGenerator {
    if (!TelemetryGenerator.instance) {
      TelemetryGenerator.instance = new TelemetryGenerator();
    }
    return TelemetryGenerator.instance;
  }

  /**
   * Generates highly detailed Wazuh Syslog alerts for corporate range endpoints
   */
  public generateSyslogDump(node: RuntimeNodeState, ruleName: string): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      rule: {
        id: Math.floor(Math.random() * 100000).toString(),
        level: node.riskScore > 75 ? 12 : 5,
        description: ruleName,
        firedtimes: Math.floor(Math.random() * 20) + 1,
        mail: false,
        groups: ["syslog", "errors", "failed_auths"]
      },
      agent: {
        id: "004",
        name: node.name,
        ip: "10.45.2.14"
      },
      manager: {
        name: "sentinelx-wazuh-master"
      },
      data: {
        srcip: "185.220.101.5",
        dstport: "443",
        protocol: "tcp",
        status: "failed",
        system: {
          os: "Linux Ubuntu 22.04 LTS",
          hostname: node.name,
          kernel: "5.15.0-76-generic"
        }
      },
      location: "/var/log/syslog"
    }, null, 2);
  }

  /**
   * Generates Falco Kubernetes container security anomalies using eBPF indicators
   */
  public generateFalcoContainerAnomaly(node: RuntimeNodeState, ruleName: string): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      time: timestamp,
      rule: ruleName,
      priority: node.riskScore > 85 ? "Critical" : "Warning",
      output: `File integrity violation: file /etc/shadow opened for writing by root user inside container namespace k8s_pod_${node.name}`,
      k8s: {
        pod: node.name,
        ns: node.namespace || "production",
        deployment: `deploy-${node.name}`,
        host: "k8s-node-worker-blue-4"
      },
      container: {
        id: "docker://" + Math.random().toString(16).slice(2, 14),
        name: node.name,
        image: "sentinelx/production-services:v3.2.0"
      },
      user: {
        name: "root",
        uid: 0
      }
    }, null, 2);
  }

  /**
   * Generates Suricata Network intrusion detection alarms
   */
  public generateSuricataAlert(node: RuntimeNodeState, signatureName: string): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      flow_id: Math.floor(Math.random() * 10000000000),
      event_type: "alert",
      src_ip: "185.220.101.5",
      src_port: Math.floor(Math.random() * 64430) + 1024,
      dest_ip: "10.45.2.14",
      dest_port: node.type === 'service' ? 8080 : 22,
      proto: "TCP",
      alert: {
        action: "allowed",
        gid: 1,
        signature_id: 2018402,
        rev: 3,
        signature: signatureName,
        category: "Attempted Administrator Privilege Gain",
        severity: node.riskScore > 80 ? 1 : 2
      },
      payload_printable: "73 70 65 61 72 20 70 68 69 73 68 69 6e 67 20 63 61 6d 70 61 69 67 6e"
    }, null, 2);
  }

  /**
   * Generates spoofed auth credentials anomalies
   */
  public generateAuthAnomalyAlert(node: RuntimeNodeState, message: string): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      api_endpoint: "https://identity.sentinelx.cloud/oauth/authorize",
      request_origin: {
        ip: "82.102.23.4",
        city: "Saint Petersburg",
        country: "Russia",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThreatActorEngine/1.1"
      },
      auth_matrix: {
        sso_verified: false,
        mfa_status: "bypassed_using_cookie_cloning",
        identity_compromised_id: "usr-admin-sso-0",
        privileges_escalated: true
      },
      indicators: [
        "IMPOSSIBLE_TRAVEL_ALARM",
        "MFA_FATIGUE_COOKIE_EXPLOITATION"
      ],
      comment: message
    }, null, 2);
  }
}

export const telemetryGenerator = TelemetryGenerator.getInstance();
