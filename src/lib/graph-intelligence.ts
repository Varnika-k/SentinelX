import { NetworkNode, NetworkLink } from '../types/network';
import { GraphIntelligenceReport, GraphTraversalOptions } from '../types/graph';

export class GraphIntelligenceEngine {
  private nodes: Map<string, NetworkNode> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();
  private reverseAdjacencyList: Map<string, string[]> = new Map();

  constructor(nodes: NetworkNode[], links: NetworkLink[]) {
    this.update(nodes, links);
  }

  update(nodes: NetworkNode[], links: NetworkLink[]) {
    this.nodes.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();

    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    });

    links.forEach(link => {
      this.adjacencyList.get(link.source)?.push(link.target);
      this.reverseAdjacencyList.get(link.target)?.push(link.source);
    });
  }

  /**
   * Calculates the blast radius for all nodes.
   * Blast radius is the percentage of nodes reachable from a node.
   */
  calculateBlastRadius(): Record<string, number> {
    const result: Record<string, number> = {};
    const totalNodes = this.nodes.size;

    this.nodes.forEach((_, nodeId) => {
      const reachable = this.getReachableNodes(nodeId);
      result[nodeId] = reachable.size / totalNodes;
    });

    return result;
  }

  /**
   * Finds the shortest paths from any compromised node to high-criticality nodes (Crown Jewels).
   */
  findCriticalAttackPaths(): GraphIntelligenceReport['criticalPaths'] {
    const compromisedNodes = Array.from(this.nodes.values()).filter(n => n.status === 'compromised');
    const crownJewels = Array.from(this.nodes.values()).filter(n => n.criticality > 0.8);
    const paths: GraphIntelligenceReport['criticalPaths'] = [];

    compromisedNodes.forEach(source => {
      crownJewels.forEach(target => {
        if (source.id === target.id) return;
        const path = this.findShortestPath(source.id, target.id);
        if (path) {
          const riskScore = this.calculatePathRisk(path);
          paths.push({
            path,
            riskScore,
            description: `Attack path detected: ${source.label} -> ${target.label}`
          });
        }
      });
    });

    return paths.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  }

  /**
   * Predicts where an attack might spread next based on proximity to compromised nodes.
   */
  predictLateralMovement(): GraphIntelligenceReport['lateralMovementProbability'] {
    const compromisedNodes = Array.from(this.nodes.values()).filter(n => n.status === 'compromised');
    const probabilities: GraphIntelligenceReport['lateralMovementProbability'] = [];

    compromisedNodes.forEach(source => {
      const neighbors = this.adjacencyList.get(source.id) || [];
      neighbors.forEach(targetId => {
        const target = this.nodes.get(targetId);
        if (target && target.status !== 'compromised' && target.status !== 'isolated') {
          // Heuristic for lateral movement: vulnerability * link density
          const prob = target.vulnerability * 0.8 + (1 - source.threatScore / 100) * 0.2;
          probabilities.push({
            sourceId: source.id,
            targetId: targetId,
            probability: Math.min(prob, 1)
          });
        }
      });
    });

    return probabilities.sort((a, b) => b.probability - a.probability);
  }

  analyzeCrownJewelRisk(): GraphIntelligenceReport['crownJewelRisk'] {
    const crownJewels = Array.from(this.nodes.values()).filter(n => n.criticality > 0.8);
    const compromisedNodes = Array.from(this.nodes.values()).filter(n => n.status === 'compromised');

    return crownJewels.map(cj => {
      let minDistance = Infinity;
      compromisedNodes.forEach(comp => {
        const path = this.findShortestPath(comp.id, cj.id);
        if (path && path.length < minDistance) {
          minDistance = path.length - 1; // Path includes start node
        }
      });

      return {
        nodeId: cj.id,
        distanceFromCompromise: minDistance === Infinity ? -1 : minDistance,
        riskTrend: minDistance < 3 ? 'rising' : 'stable'
      };
    }) as any;
  }

  generateFullReport(): GraphIntelligenceReport {
    const criticalPaths = this.findCriticalAttackPaths();
    const blastRadius = this.calculateBlastRadius();
    const clusters = this.detectRiskClusters();
    const lateralMovementProbability = this.predictLateralMovement();
    const crownJewelRisk = this.analyzeCrownJewelRisk();

    // Calculate advanced predictive and operational resilience metrics
    const cascadingFailureRisks = this.calculateCascadingFailures();
    const infrastructurePressure = this.calculateInfrastructurePressure();
    const survivabilityScores = this.calculateSurvivability();
    const recoveryTimelines = this.calculateRecoveryTimelines();
    const resilienceIndex = this.calculateGlobalResilience(survivabilityScores, infrastructurePressure);
    
    // Heuristic trajectory: compromise ratio * 180 degrees
    const compromisedCount = Array.from(this.nodes.values()).filter(n => n.status === 'compromised').length;
    const threatTrajectoryAngle = Math.min(180, Math.max(0, (compromisedCount / Math.max(1, this.nodes.size)) * 180));

    return {
      timestamp: Date.now(),
      criticalPaths,
      blastRadius,
      clusters,
      lateralMovementProbability,
      crownJewelRisk: crownJewelRisk as any,
      cascadingFailureRisks,
      infrastructurePressure,
      survivabilityScores,
      resilienceIndex,
      recoveryTimelines,
      threatTrajectoryAngle
    };
  }

  private calculateCascadingFailures(): { nodeId: string; cascadingProbability: number; description: string }[] {
    const risks: { nodeId: string; cascadingProbability: number; description: string }[] = [];
    
    this.nodes.forEach((node, nodeId) => {
      // Safe but directly neighboring a compromised node has risk of service starvation or load spike
      if (node.status === 'safe') {
        const neighbors = this.adjacencyList.get(nodeId) || [];
        const compromisedNeighbors = neighbors.filter(neighId => {
          const neighNode = this.nodes.get(neighId);
          return neighNode && neighNode.status === 'compromised';
        });

        if (compromisedNeighbors.length > 0) {
          const count = compromisedNeighbors.length;
          const prob = Math.min(0.95, node.vulnerability * 0.5 + (count * 0.25));
          risks.push({
            nodeId,
            cascadingProbability: prob,
            description: `Cascade high risk due to ${count} compromised connecting service edge(s).`
          });
        }
      }
    });

    return risks.sort((a, b) => b.cascadingProbability - a.cascadingProbability).slice(0, 5);
  }

  private calculateInfrastructurePressure(): { nodeId: string; stressScore: number; degradationForecast: number }[] {
    const pressures: { nodeId: string; stressScore: number; degradationForecast: number }[] = [];

    this.nodes.forEach((node, nodeId) => {
      let baseStress = 10;
      
      // status factors
      if (node.status === 'compromised') baseStress += 70;
      if (node.status === 'isolated') baseStress += 35;
      
      // relationship connectivity stress
      const neighbors = this.adjacencyList.get(nodeId) || [];
      const incoming = this.reverseAdjacencyList.get(nodeId) || [];
      const totalConnected = neighbors.length + incoming.length;

      // adjacent isolations put stress on this system
      let isolationPressure = 0;
      [...neighbors, ...incoming].forEach(id => {
        const adjacent = this.nodes.get(id);
        if (adjacent && (adjacent.status === 'isolated' || adjacent.status === 'compromised')) {
          isolationPressure += 15;
        }
      });

      // latency multiplier
      const latencyContribution = node.latency ? Math.min(30, (node.latency / 200) * 35) : 0;
      
      const stressScore = Math.min(100, Math.max(0, baseStress + isolationPressure + latencyContribution));
      
      // Forecast degradation in next tick: higher if stress is high and vulnerability exists
      const degradationForecast = Math.min(100, Math.max(0, 
        node.status === 'compromised' ? 95 : 
        node.status === 'degraded' ? 85 : 
        (stressScore * 0.6) + (node.vulnerability * 40)
      ));

      pressures.push({
        nodeId,
        stressScore,
        degradationForecast
      });
    });

    return pressures;
  }

  private calculateSurvivability(): { nodeId: string; survivabilityScore: number }[] {
    const survivabilities: { nodeId: string; survivabilityScore: number }[] = [];

    this.nodes.forEach((node, nodeId) => {
      let score = 100;
      
      if (node.status === 'compromised') {
        score = 10 + Math.random() * 10;
      } else if (node.status === 'degraded') {
        score = 45 + (1 - node.vulnerability) * 20;
      } else if (node.status === 'isolated') {
        // High survival but isolated operation
        score = 85 + (node.credentialsRotated ? 15 : 0);
      } else {
        // Proximity penalty
        const neighbors = this.adjacencyList.get(nodeId) || [];
        const connectedCompromised = neighbors.filter(nid => this.nodes.get(nid)?.status === 'compromised').length;
        score = 100 - (node.vulnerability * 25) - (connectedCompromised * 20);
      }

      survivabilities.push({
        nodeId,
        survivabilityScore: Math.max(5, Math.min(100, score))
      });
    });

    return survivabilities;
  }

  private calculateRecoveryTimelines(): { nodeId: string; estimatedRecoverySeconds: number; progressPercentage: number }[] {
    const timelines: { nodeId: string; estimatedRecoverySeconds: number; progressPercentage: number }[] = [];

    this.nodes.forEach((node, nodeId) => {
      if (node.status === 'compromised' || node.status === 'isolated' || node.status === 'degraded') {
        // Estimate recovery based on proactive monitor level & credentials state
        const monitorFactor = (node.monitoringLevel || 10) / 100;
        const baseEstimate = node.status === 'compromised' ? 180 : (node.status === 'degraded' ? 90 : 45);
        const estimatedSec = Math.max(10, Math.floor(baseEstimate * (1 - monitorFactor * 0.5) * (node.credentialsRotated ? 0.4 : 1.0)));
        
        // Progress derived from credentials state and monitoring percentage
        const progress = node.credentialsRotated ? 75 : Math.max(15, Math.floor(monitorFactor * 100));

        timelines.push({
          nodeId,
          estimatedRecoverySeconds: estimatedSec,
          progressPercentage: progress
        });
      }
    });

    return timelines;
  }

  private calculateGlobalResilience(
    survivabilities: { nodeId: string; survivabilityScore: number }[],
    pressures: { nodeId: string; stressScore: number; degradationForecast: number }[]
  ): number {
    if (this.nodes.size === 0) return 100;

    // Average survivability minus average pressure, weighted by node criticality
    let totalWeight = 0;
    let scoreSum = 0;

    this.nodes.forEach((node, nodeId) => {
      const weight = node.criticality * 10 + 1; // Critical nodes affect resilience more
      const surv = survivabilities.find(s => s.nodeId === nodeId)?.survivabilityScore || 100;
      const stress = pressures.find(p => p.nodeId === nodeId)?.stressScore || 10;
      
      const nodeOperationalStability = surv - (stress * 0.25); // stress slightly offsets survival
      scoreSum += Math.max(0, nodeOperationalStability) * weight;
      totalWeight += weight;
    });

    return Math.max(0, Math.min(100, scoreSum / totalWeight));
  }

  private detectRiskClusters(): GraphIntelligenceReport['clusters'] {
    // Simple implementation: group by zones or proximity to high-threat nodes
    // For now, let's group by "affected areas"
    const clusters: any[] = [];
    const visited = new Set<string>();

    this.nodes.forEach((node, nodeId) => {
      if (node.status === 'compromised' && !visited.has(nodeId)) {
        const reachable = this.getReachableNodes(nodeId, 2); // 2 steps out
        const clusterNodes = Array.from(reachable);
        clusterNodes.forEach(id => visited.add(id));
        
        clusters.push({
          id: `cluster-${nodeId}`,
          nodeIds: clusterNodes,
          riskLevel: node.threatScore,
          name: `Compromise Zone Alpha`
        });
      }
    });

    return clusters;
  }

  private getReachableNodes(startId: string, maxDepth: number = Infinity): Set<string> {
    const visited = new Set<string>();
    const queue: [string, number][] = [[startId, 0]];
    visited.add(startId);

    while (queue.length > 0) {
      const [currentId, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = this.adjacencyList.get(currentId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push([neighborId, depth + 1]);
        }
      });
    }

    return visited;
  }

  private findShortestPath(startId: string, endId: string): string[] | null {
    const queue: string[][] = [[startId]];
    const visited = new Set<string>();
    visited.add(startId);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const node = path[path.length - 1];

      if (node === endId) return path;

      const neighbors = this.adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null;
  }

  private calculatePathRisk(path: string[]): number {
    // Average vulnerability of nodes in the path
    let totalRisk = 0;
    path.forEach(id => {
      const node = this.nodes.get(id);
      if (node) totalRisk += node.vulnerability;
    });
    return totalRisk / path.length;
  }
}
