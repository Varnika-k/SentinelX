import { TelemetryEvent, EventType, Severity, NetworkMetrics } from '../types/telemetry';
import { NetworkNode } from '../types/network';

export class TelemetryService {
  static createEvent(
    message: string, 
    type: EventType, 
    severity: Severity = 'low', 
    origin?: string,
    target?: string,
    metadata?: Record<string, any>,
    nodeId?: string
  ): TelemetryEvent {
    return {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      type,
      message,
      severity,
      nodeId: nodeId || target, // Fallback for compatibility
      origin,
      target,
      metadata
    };
  }

  static calculateMetrics(nodes: NetworkNode[]): NetworkMetrics {
    const safe = nodes.filter(n => n.status === 'safe').length;
    const compromised = nodes.filter(n => n.status === 'compromised').length;
    const isolated = nodes.filter(n => n.status === 'isolated').length;
    const total = nodes.length;
    
    const percent = total > 0 ? compromised / total : 0;
    let threatLevel: Severity = 'low';
    if (percent > 0) threatLevel = 'medium';
    if (percent >= 0.2) threatLevel = 'high';
    if (percent >= 0.5) threatLevel = 'critical';

    return {
      safe,
      compromised,
      isolated,
      total,
      threatLevel,
      activeThreats: compromised,
      systemHealth: Math.max(0, 100 - (percent * 150)) // Arbitrary health scoring
    };
  }
}
