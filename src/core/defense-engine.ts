import { NetworkNode, NetworkLink } from '../types/network';
import { Incident } from '../types/incident';
import { DefenseRecommendation, DefenseActionType } from '../types/defense';
import { GraphIntelligenceEngine } from '../lib/graph-intelligence';

export class DefenseEngine {
  private recommendations: DefenseRecommendation[] = [];

  constructor() {}

  /**
   * Analyzes the current network state and generates defensive recommendations.
   */
  analyze(nodes: NetworkNode[], links: NetworkLink[], incidents: Incident[]): DefenseRecommendation[] {
    const graphEngine = new GraphIntelligenceEngine(nodes, links);
    const report = graphEngine.generateFullReport();
    const newRecommendations: DefenseRecommendation[] = [];

    // 1. Prioritize compromised nodes for isolation
    const compromisedNodes = nodes.filter(n => n.status === 'compromised');
    compromisedNodes.forEach(node => {
      const blastRadius = report.blastRadius[node.id] || 0;
      const confidence = 0.7 + (blastRadius * 0.3);
      
      newRecommendations.push({
        id: `REC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        action: 'isolate_node',
        targetId: node.id,
        priority: node.criticality > 0.8 ? 'critical' : 'high',
        confidence,
        reasoning: `Node is compromised with a blast radius of ${(blastRadius * 100).toFixed(0)}%. Isolation prevents lateral spread to crown jewels.`,
        impactScore: blastRadius * 0.8,
        timestamp: Date.now(),
        status: 'pending'
      });
    });

    // 2. High-vulnerability nodes near critical paths
    report.criticalPaths.forEach(path => {
      // Find the first uncompromised node in the path
      const nextTargetId = path.path.find(id => {
        const n = nodes.find(node => node.id === id);
        return n && n.status !== 'compromised';
      });

      if (nextTargetId) {
        const targetNode = nodes.find(n => n.id === nextTargetId);
        if (targetNode) {
          newRecommendations.push({
            id: `REC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            action: 'increase_monitoring',
            targetId: nextTargetId,
            priority: 'medium',
            confidence: 0.85,
            reasoning: `Target system is identified as the next logical step in an active attack path. Proactive monitoring recommended.`,
            impactScore: 0.3,
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      }
    });

    // 3. Escalation for high-risk incidents
    incidents.filter(inc => inc.status === 'detected' && inc.severity === 'critical').forEach(inc => {
      newRecommendations.push({
        id: `REC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        action: 'escalate_incident',
        targetId: inc.id,
        priority: 'high',
        confidence: 0.9,
        reasoning: `Critical incident detected with high velocity spread. Immediate escalation to SOC Level 2 is required for manual containment.`,
        impactScore: 0.5,
        timestamp: Date.now(),
        status: 'pending'
      });
    });

    // Deduplicate and filter old ones
    this.recommendations = this.mergeRecommendations(newRecommendations);
    return this.recommendations;
  }

  private mergeRecommendations(newRecs: DefenseRecommendation[]): DefenseRecommendation[] {
    // Keep existing applied/dismissed ones for a short time, merge new ones
    const filtered = this.recommendations.filter(r => 
      r.status !== 'pending' && (Date.now() - r.timestamp < 60000)
    );

    const pending = newRecs.filter(nr => 
      !this.recommendations.find(er => er.action === nr.action && er.targetId === nr.targetId)
    );

    return [...filtered, ...pending].sort((a, b) => b.timestamp - a.timestamp);
  }

  updateRecommendationStatus(id: string, status: 'applied' | 'dismissed'): void {
    const rec = this.recommendations.find(r => r.id === id);
    if (rec) {
      rec.status = status;
    }
  }

  getPendingRecommendationsCount(): number {
    return this.recommendations.filter(r => r.status === 'pending').length;
  }
}

export const defenseEngine = new DefenseEngine();
