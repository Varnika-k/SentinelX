import { AIAgent, AgentReasoning, ThreatConsensus, AgentOrchestrationState } from '../types/agents';
import { TelemetryEvent } from '../types/telemetry';
import { NetworkNode } from '../types/network';

export class AgentOrchestrator {
  /**
   * Main entry point for agent reasoning triggered by telemetry.
   */
  static processTelemetry(
    event: TelemetryEvent,
    state: AgentOrchestrationState,
    nodes: NetworkNode[]
  ): AgentOrchestrationState {
    const newState = { ...state };
    const { type, nodeId, severity } = event;

    // 1. Identify which agents should react to this event
    const reactingAgents = state.agents.map(agent => {
      let status = agent.status;
      if (severity === 'high' || severity === 'critical') {
        if (Math.random() > 0.5) status = 'analyzing';
      }
      return { ...agent, status };
    });

    newState.agents = reactingAgents;

    // 2. Generate reasoning for active agents
    const newReasoning: AgentReasoning[] = [];
    reactingAgents.forEach(agent => {
      if (agent.status === 'analyzing') {
        const reasoning = this.generateAgentReasoning(agent, event, nodes);
        if (reasoning) newReasoning.push(reasoning);
      }
    });

    newState.recentReasoning = [...newReasoning, ...state.recentReasoning].slice(0, 20);

    // 3. Update Consensus
    if (newReasoning.length > 0) {
      newState.consensus = this.calculateConsensus(newState.agents, newState.recentReasoning);
    }

    // 4. Update Memory
    if (severity === 'high' || severity === 'critical') {
      newState.operationalMemory = [
        `${new Date().toISOString()}: ${event.message}`,
        ...state.operationalMemory
      ].slice(0, 10);
    }

    return newState;
  }

  private static generateAgentReasoning(
    agent: AIAgent,
    event: TelemetryEvent,
    nodes: NetworkNode[]
  ): AgentReasoning | null {
    // Semi-stochastic reasoning simulation based on agent role
    if (Math.random() > 0.7) return null;

    const node = nodes.find(n => n.id === event.nodeId);
    let observation = "";
    let hypothesis = "";
    let recommendedAction = "";

    switch (agent.role) {
      case 'threat_analyst':
        observation = `Detected ${event.type} signature on ${node?.label || 'unknown resource'}.`;
        hypothesis = "Pattern suggests a multi-stage lateral movement attempt.";
        recommendedAction = "Initiate deep packet inspection on adjacent segments.";
        break;
      case 'incident_responder':
        observation = `Anomalous activity level ${event.severity} in ${node?.type || 'infrastructure'}.`;
        hypothesis = "Compromised credentials likely being used for resource discovery.";
        recommendedAction = "Isolate node and revoke active IAM tokens for associated session.";
        break;
      case 'graph_specialist':
        observation = `Connection flux detected between ${event.nodeId} and production perimeter.`;
        hypothesis = "Topology analysis shows high probability of data exfiltration path.";
        recommendedAction = "Apply neural isolation to critical database uplinks.";
        break;
      default:
        observation = `Operational event monitored: ${event.message}`;
        hypothesis = "Standard telemetry variance within expected drift parameters.";
        recommendedAction = "Log and monitor for subsequent deviations.";
    }

    return {
      agentId: agent.id,
      timestamp: new Date(),
      observation,
      hypothesis,
      confidence: 0.7 + Math.random() * 0.25,
      recommendedAction,
      contextIds: event.nodeId ? [event.nodeId] : []
    };
  }

  private static calculateConsensus(agents: AIAgent[], reasonings: AgentReasoning[]): ThreatConsensus {
    const recent = reasonings.slice(0, 5);
    const avgConf = recent.reduce((acc, r) => acc + r.confidence, 0) / recent.length;
    
    // Determine level based on reasoning confidence and agent roles
    let level: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (avgConf > 0.9) level = 'critical';
    else if (avgConf > 0.8) level = 'high';
    else if (avgConf > 0.6) level = 'medium';
    else level = 'low';

    return {
      threatLevel: level,
      confidence: Math.round(avgConf * 100),
      primaryVector: recent[0]?.hypothesis || "Unknown Origin",
      agreementCount: recent.length,
      dissentingAgents: [] // Mock: usually low dissent in this sim
    };
  }
}
