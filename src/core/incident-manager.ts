import { Incident, IncidentStatus } from '../types/incident';
import { TelemetryEvent, Severity } from '../types/telemetry';
import { NetworkNode } from '../types/network';
import { GraphIntelligenceEngine } from '../lib/graph-intelligence';

export class IncidentManager {
  private incidents: Map<string, Incident> = new Map();

  constructor() {}

  reset(): void {
    this.incidents.clear();
  }

  /**
   * Processes a new telemetry event and determines if it belongs to an existing incident
   * or starts a new one.
   */
  processEvent(event: TelemetryEvent, nodes: NetworkNode[], links: any[]): Incident[] {
    if (event.type !== 'attack' && event.type !== 'compromise') {
      return Array.from(this.incidents.values());
    }

    const existingIncident = this.findRelatedIncident(event);

    if (existingIncident) {
      this.updateIncident(existingIncident.id, event, nodes, links);
    } else {
      this.createIncident(event, nodes, links);
    }

    return Array.from(this.incidents.values());
  }

  private findRelatedIncident(event: TelemetryEvent): Incident | null {
    // Look for active incidents that involve the target node or origin node
    const activeIncidents = Array.from(this.incidents.values()).filter(i => 
      ['detected', 'investigating', 'escalated'].includes(i.status)
    );

    return activeIncidents.find(i => 
      (event.nodeId && i.affectedNodeIds.includes(event.nodeId)) ||
      (event.target && i.affectedNodeIds.includes(event.target)) ||
      (event.origin && i.affectedNodeIds.includes(event.origin))
    ) || null;
  }

  private createIncident(event: TelemetryEvent, nodes: NetworkNode[], links: any[]): void {
    const id = `INC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const graphEngine = new GraphIntelligenceEngine(nodes, links);
    const blastRadiusMap = graphEngine.calculateBlastRadius();
    const blastRadius = event.nodeId ? (blastRadiusMap[event.nodeId] || 0) : 0;

    const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();

    const newIncident: Incident = {
      id,
      title: `${event.type.toUpperCase()}: ${event.message.split(':')[0]}`,
      status: 'detected',
      severity: event.severity,
      priority: this.mapSeverityToPriority(event.severity),
      detectionTime: eventTime,
      lastUpdateTime: eventTime,
      affectedNodeIds: event.nodeId ? [event.nodeId] : [],
      attackType: event.message.includes(':') ? event.message.split(':')[0] : undefined,
      events: [event],
      riskScore: 50 + (event.severity === 'critical' ? 40 : event.severity === 'high' ? 20 : 0),
      blastRadius,
      compromiseChain: event.nodeId ? [event.nodeId] : [],
      analystNotes: [],
    };

    if (event.origin && !newIncident.affectedNodeIds.includes(event.origin)) {
      newIncident.affectedNodeIds.push(event.origin);
    }

    this.incidents.set(id, newIncident);
  }

  private updateIncident(incidentId: string, event: TelemetryEvent, nodes: NetworkNode[], links: any[]): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.events.unshift(event);
    incident.lastUpdateTime = event.timestamp ? new Date(event.timestamp) : new Date();
    
    if (event.nodeId && !incident.affectedNodeIds.includes(event.nodeId)) {
      incident.affectedNodeIds.push(event.nodeId);
      incident.compromiseChain.push(event.nodeId);
    }

    // Recalculate risk score based on new events and blast radius
    const graphEngine = new GraphIntelligenceEngine(nodes, links);
    const blastRadiusMap = graphEngine.calculateBlastRadius();
    const maxBlastRadius = Math.max(...incident.affectedNodeIds.map(id => blastRadiusMap[id] || 0));
    
    incident.blastRadius = maxBlastRadius;
    incident.riskScore = Math.min(100, incident.riskScore + 10);
    
    if (event.severity === 'critical' && incident.severity !== 'critical') {
      incident.severity = 'critical';
      incident.priority = 'critical';
    }
  }

  updateIncidentStatus(incidentId: string, status: IncidentStatus): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.status = status;
    incident.lastUpdateTime = new Date();
    if (status === 'resolved') {
      incident.resolvedTime = new Date();
    }
  }

  addAnalystNote(incidentId: string, note: string): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.analystNotes.push(`${new Date().toISOString()}: ${note}`);
    incident.lastUpdateTime = new Date();
  }

  restoreState(incidents: Incident[]): void {
    this.incidents.clear();
    incidents.forEach(inc => {
      this.incidents.set(inc.id, {
        ...inc,
        detectionTime: new Date(inc.detectionTime),
        lastUpdateTime: new Date(inc.lastUpdateTime),
        resolvedTime: inc.resolvedTime ? new Date(inc.resolvedTime) : undefined,
        events: inc.events.map(e => ({
          ...e,
          timestamp: e.timestamp ? new Date(e.timestamp) : undefined
        }))
      });
    });
  }

  getIncidents(): Incident[] {
    return Array.from(this.incidents.values()).sort((a, b) => b.lastUpdateTime.getTime() - a.lastUpdateTime.getTime());
  }

  private mapSeverityToPriority(severity: Severity): 'low' | 'medium' | 'high' | 'critical' {
    return severity as any;
  }
}

export const incidentManager = new IncidentManager();
