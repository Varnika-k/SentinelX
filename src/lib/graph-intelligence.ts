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
    return {
      timestamp: Date.now(),
      criticalPaths: this.findCriticalAttackPaths(),
      blastRadius: this.calculateBlastRadius(),
      clusters: this.detectRiskClusters(),
      lateralMovementProbability: this.predictLateralMovement(),
      crownJewelRisk: this.analyzeCrownJewelRisk() as any
    };
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
