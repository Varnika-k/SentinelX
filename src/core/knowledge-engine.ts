import { 
  AttackCampaign, 
  CyberKnowledgeBase, 
  MITREStage,
  ThreatActor,
  BehaviorBaseline
} from '../types/intelligence';
import { Incident } from '../types/incident';
import { TelemetryEvent } from '../types/telemetry';

export class CorrelationEngine {
  /**
   * Correlates an incident into a campaign or creates a new one.
   */
  static correlateIncident(
    incident: Incident,
    knowledgeBase: CyberKnowledgeBase
  ): AttackCampaign[] {
    const existingCampaigns = [...knowledgeBase.campaigns];
    
    // Simple correlation logic: check for shared assets or attacker patterns
    const matchingCampaignIdx = existingCampaigns.findIndex(c => 
      c.status === 'active' && 
      (c.affectedAssets.some(id => incident.affectedNodeIds.includes(id)) ||
       c.attackerId === incident.events[0]?.origin)
    );

    if (matchingCampaignIdx !== -1) {
      const campaign = { ...existingCampaigns[matchingCampaignIdx] };
      if (!campaign.incidents.includes(incident.id)) {
        campaign.incidents.push(incident.id);
        campaign.lastActivity = new Date();
        incident.affectedNodeIds.forEach(id => {
          if (!campaign.affectedAssets.includes(id)) campaign.affectedAssets.push(id);
        });
        
        // Map to MITRE stage (mock inference)
        const stage = this.inferMITREStage(incident);
        if (!campaign.stages.includes(stage)) campaign.stages.push(stage);
      }
      existingCampaigns[matchingCampaignIdx] = campaign;
    } else {
      // Create new campaign
      const newCampaign: AttackCampaign = {
        id: `campaign-${Math.random().toString(36).substring(7)}`,
        title: `Operation ${incident.attackType || 'Ghost'} Pattern`,
        status: 'active',
        startTime: incident.detectionTime,
        lastActivity: incident.detectionTime,
        incidents: [incident.id],
        affectedAssets: [...incident.affectedNodeIds],
        attackerId: incident.events[0]?.origin,
        stages: [this.inferMITREStage(incident)],
        confidenceScore: 0.8
      };
      existingCampaigns.push(newCampaign);
    }

    return existingCampaigns;
  }

  static inferMITREStage(incident: Incident): MITREStage {
    const type = incident.title.toLowerCase();
    if (type.includes('phish')) return 'initial-access';
    if (type.includes('ddos')) return 'impact';
    if (type.includes('ransom')) return 'impact';
    if (type.includes('brute')) return 'initial-access';
    if (type.includes('iam')) return 'privilege-escalation';
    if (type.includes('lateral')) return 'lateral-movement';
    return 'discovery';
  }

  /**
   * Updates behavioral baselines based on new events.
   */
  static updateBaselines(
    events: TelemetryEvent[],
    baselines: BehaviorBaseline[]
  ): BehaviorBaseline[] {
    const newBaselines = [...baselines];
    
    events.forEach(ev => {
      if (!ev.nodeId) return;
      
      const idx = newBaselines.findIndex(b => b.nodeId === ev.nodeId);
      if (idx === -1) {
        newBaselines.push({
          nodeId: ev.nodeId,
          averageTrafficIn: Math.random() * 100,
          averageTrafficOut: Math.random() * 100,
          normalPorts: [80, 443],
          commonIdentities: [],
          lastBaselineUpdate: new Date()
        });
      } else {
        // Incremental update logic could go here
        newBaselines[idx].lastBaselineUpdate = new Date();
      }
    });

    return newBaselines;
  }

  /**
   * Analyzes trends to detect campaigns over long term.
   */
  static analyzeLongTermTrends(knowledgeBase: CyberKnowledgeBase): Partial<CyberKnowledgeBase> {
    // This would ideally use AI or heavy statistics
    // For now, it cleans up dead campaigns
    const now = new Date();
    const updatedCampaigns = knowledgeBase.campaigns.map(c => {
      const hoursSinceActivity = (now.getTime() - c.lastActivity.getTime()) / (1000 * 60 * 60);
      if (hoursSinceActivity > 24) return { ...c, status: 'dormant' as const };
      return c;
    });

    return { campaigns: updatedCampaigns };
  }
}
