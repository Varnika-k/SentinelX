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

    const compromisedNodes = nodes.filter(n => n.status === 'compromised');
    const totalCompromised = compromisedNodes.length;

    // 1. Prioritize compromised nodes for isolation / quarantine
    compromisedNodes.forEach(node => {
      const blastRadius = report.blastRadius[node.id] || 0;
      
      if (node.type === 'workstation' || node.type === 'gateway') {
        newRecommendations.push({
          id: `REC-QRN-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          action: 'quarantine_workload',
          title: 'QUARANTINE_NODE',
          targetId: node.id,
          priority: 'high',
          confidence: 0.9,
          reasoning: `Workload [${node.label}] is exhibiting anomalous process spikes. Quarantining to a guest vSphere sandbox prevents endpoint propagation.`,
          rationale: `Credential or system execution anomaly was validated at workstation. Sandbox transition prevents hypervisor level lateral propagation.`,
          predictedImpact: `Cuts breach propagation to server layers by 85%. Sandbox confines active binary payloads.`,
          mitigationProbability: 0.92,
          operationalCost: 'Medium',
          affectedInfrastructure: `${node.label} guest kernel slice`,
          urgency: 'High',
          impactScore: 0.75,
          timestamp: Date.now(),
          status: 'pending'
        });
      }

      newRecommendations.push({
        id: `REC-ISO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        action: 'isolate_node',
        title: 'ISOLATE_ROUTE',
        targetId: node.id,
        priority: node.criticality > 0.8 ? 'critical' : 'high',
        confidence: 0.7 + (blastRadius * 0.3),
        reasoning: `Node [${node.label}] is highly compromised with a blast radius of ${(blastRadius * 100).toFixed(0)}%. Complete route isolation prevents lateral breach progression.`,
        rationale: `Isolating subnet interfaces of [${node.label}] stops inbound/outbound packets without server termination.`,
        predictedImpact: `Completely halts lateral movement along active paths. Nullifies adjacent workspace impact.`,
        mitigationProbability: 0.98,
        operationalCost: 'High',
        affectedInfrastructure: `Network routing tables on adjacent edge routes`,
        urgency: node.criticality > 0.8 ? 'Critical' : 'High',
        impactScore: blastRadius * 0.8,
        timestamp: Date.now(),
        status: 'pending'
      });

      // Terminate process recommendation for active infection
      if (node.threatScore > 50) {
        newRecommendations.push({
          id: `REC-KIL-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          action: 'terminate_process',
          title: 'QUARANTINE_NODE',
          targetId: node.id,
          priority: 'high',
          confidence: 0.95,
          reasoning: `Malicious runtime thread hijacking detected on [${node.label}]. Terminating unauthorized process IDs stabilizes memory overhead.`,
          rationale: `Immediate execution of force-kill signal on high-CPU anomalous process pid traces.`,
          predictedImpact: `Halts running payload. Restores CPU loads on [${node.label}] back to under 15% latency.`,
          mitigationProbability: 0.88,
          operationalCost: 'Low',
          affectedInfrastructure: `Memory process stack of ${node.label}`,
          urgency: 'High',
          impactScore: 0.85,
          timestamp: Date.now(),
          status: 'pending'
        });
      }
    });

    // 2. Secret exposure & credential rotation recommendations
    const hasActiveCredentialsRisk = incidents.some(inc => 
      inc.title?.toLowerCase().includes('credential') || 
      inc.title?.toLowerCase().includes('iam') || 
      inc.title?.toLowerCase().includes('key') ||
      inc.attackType?.toLowerCase().includes('credential') ||
      inc.attackType?.toLowerCase().includes('iam') ||
      inc.attackType?.toLowerCase().includes('key')
    );

    if (totalCompromised > 0 || hasActiveCredentialsRisk) {
      const highRiskNode = nodes.find(n => n.status === 'compromised' && n.criticality > 0.5) || nodes[0];
      newRecommendations.push({
        id: `REC-ROT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        action: 'rotate_credentials',
        title: 'ROTATE_SECRETS',
        targetId: highRiskNode.id,
        priority: 'high',
        confidence: 0.8,
        reasoning: `Lateral traversal threat implies local cache credential dumping. Rotating SSH/SAML root secrets on [${highRiskNode.label}] invalidates stolen tokens.`,
        rationale: `Active session revocation and rotating secret strings in the GCP/AWS vault keys prevents stale token re-use.`,
        predictedImpact: `Revokes threat actor authenticated routes with zero disruption to stateless API transactions.`,
        mitigationProbability: 0.85,
        operationalCost: 'Low',
        affectedInfrastructure: `Identity provider vaults & access authorization levels`,
        urgency: 'Urgent',
        impactScore: 0.6,
        timestamp: Date.now(),
        status: 'pending'
      });
    }

    // 3. User account lock recommendation
    if (hasActiveCredentialsRisk || totalCompromised > 1) {
      newRecommendations.push({
        id: `REC-IAM-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        action: 'disable_account',
        title: 'ROTATE_SECRETS',
        targetId: 'id-dev-1', // Default developer account prone to risk
        priority: 'high',
        confidence: 0.85,
        reasoning: `Suspicious OAuth logins detected. Disabling engineer 'Marcus Miller' access groups blocks rogue API integrations.`,
        rationale: `Revocation of Marcus Miller's user tokens blocks API integrations on critical environments.`,
        predictedImpact: `Prevents further cloud credential elevation in secondary zones.`,
        mitigationProbability: 0.95,
        operationalCost: 'Medium',
        affectedInfrastructure: `Identity access manager directory profile: id-dev-1`,
        urgency: 'High',
        impactScore: 0.7,
        timestamp: Date.now(),
        status: 'pending'
      });
    }

    // 4. Perimeter block traffic recommendation
    const highThreatGateway = nodes.find(n => n.type === 'gateway' && n.threatScore > 20);
    if (highThreatGateway) {
      newRecommendations.push({
        id: `REC-BLK-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        action: 'block_traffic',
        title: 'DROP_TRAFFIC',
        targetId: highThreatGateway.id,
        priority: 'critical',
        confidence: 0.95,
        reasoning: `Volumetric command-and-control flood observed on ${highThreatGateway.label}. Enforcing traffic drop filters preserves ingress bandwidth.`,
        rationale: `Traffic scrubbing drops external network packages from malicious IP subnets on firewall level.`,
        predictedImpact: `Restores baseline latency profiles of edge gateway back to sub-15ms.`,
        mitigationProbability: 0.95,
        operationalCost: 'Medium',
        affectedInfrastructure: `Edge firewall of ${highThreatGateway.label}`,
        urgency: 'Critical',
        impactScore: 0.9,
        timestamp: Date.now(),
        status: 'pending'
      });
    }

    // 5. Global containment mode recommendation
    if (totalCompromised >= 2) {
      newRecommendations.push({
        id: `REC-CNT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        action: 'enable_containment_mode',
        title: 'ISOLATE_ROUTE',
        targetId: 'global',
        priority: 'critical',
        confidence: 0.99,
        reasoning: `Multiple active infection coordinates detected (N=${totalCompromised}). Enabling global containment mode caps threat propagation velocity immediately.`,
        rationale: `Triggers neural network isolation policies. Throttles overall transaction velocities across virtual subnets.`,
        predictedImpact: `Reduces cross-subnet propagation velocity to 15% of default rate.`,
        mitigationProbability: 0.99,
        operationalCost: 'High',
        affectedInfrastructure: `Global VPC SD-WAN control-plane`,
        urgency: 'Critical',
        impactScore: 0.95,
        timestamp: Date.now(),
        status: 'pending'
      });
    }

    // 6. Zone segmentation recommendation (Dev/Staging from Prod)
    const isDevStagingInfected = nodes.some(n => 
      n.status === 'compromised' && (n.environmentId === 'env-dev' || n.environmentId === 'env-staging')
    );
    if (isDevStagingInfected) {
      newRecommendations.push({
        id: `REC-ZON-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        action: 'segment_network_zone',
        title: 'ISOLATE_ROUTE',
        targetId: 'env-prod',
        priority: 'critical',
        confidence: 0.9,
        reasoning: `Infiltration present inside Stage/Dev environments. Segmenting the Production mesh trust boundaries air-gaps crown jewels database systems.`,
        rationale: `Air-gaps production mesh boundary. Installs security rules severing dev-to-prod ingress routes.`,
        predictedImpact: `Enforces perfect trust airground for all crown jewels database structures.`,
        mitigationProbability: 0.94,
        operationalCost: 'High',
        affectedInfrastructure: `Production - Stage Mesh border routes`,
        urgency: 'Critical',
        impactScore: 0.9,
        timestamp: Date.now(),
        status: 'pending'
      });
    }

    // 7. High-vulnerability nodes near critical paths
    report.criticalPaths.forEach(path => {
      const nextTargetId = path.path.find(id => {
        const n = nodes.find(node => node.id === id);
        return n && n.status !== 'compromised';
      });

      if (nextTargetId) {
        const targetNode = nodes.find(n => n.id === nextTargetId);
        if (targetNode) {
          newRecommendations.push({
            id: `REC-MON-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            action: 'increase_monitoring',
            title: 'ESCALATE_LOGS',
            targetId: nextTargetId,
            priority: 'medium',
            confidence: 0.85,
            reasoning: `Target system [${targetNode.label}] is identified as the next logical stepping stone along an active critical exploit path.`,
            rationale: `Increases eBPF system logs capturing rate. Deploys real-time memory probes to monitor incoming packets.`,
            predictedImpact: `Provides 5x diagnostic density inside forensic timelines if a threat attempts targeting of this path.`,
            mitigationProbability: 0.78,
            operationalCost: 'Low',
            affectedInfrastructure: `eBPF probes on ${targetNode.label}`,
            urgency: 'Routine',
            impactScore: 0.4,
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      }
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

  restoreState(recommendations: DefenseRecommendation[]): void {
    this.recommendations = JSON.parse(JSON.stringify(recommendations));
  }
}

export const defenseEngine = new DefenseEngine();
