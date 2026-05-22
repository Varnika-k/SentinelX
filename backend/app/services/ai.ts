import { AIOrchestrator } from '../../../src/server/ai/orchestrator';
import { GeminiProvider } from '../../../src/server/ai/gemini-provider';
import { CONFIG } from '../../../src/config';
import { logger } from '../core/logger';
import { graphIntelligenceEngine } from '../simulation/graph-intelligence';
import { digitalTwinEngine } from '../simulation/twin-engine';

class AIService {
  private orchestrator: AIOrchestrator;

  constructor() {
    this.orchestrator = new AIOrchestrator();
    this.init();
  }

  private init() {
    if (CONFIG.ai.apiKey) {
      this.orchestrator.registerProvider(new GeminiProvider(CONFIG.ai.apiKey));
      logger.info('AI Intelligence Service Initialized');
    } else {
      logger.warn('AI Intelligence Service running in LIMITED mode (Missing API Key)');
    }
  }

  public async analyze(data: any) {
    // Inject runtime context if missing
    if (data && data.context) {
      data.context.isReplayActive = digitalTwinEngine.scenario !== 'idle' && digitalTwinEngine.status === 'running';
      data.context.replaySessionId = digitalTwinEngine.sessionId;
      data.context.simulationScenario = digitalTwinEngine.scenario;
    }
    return await this.orchestrator.analyze(data);
  }

  public async analyzeInfra(topology: any, events: any) {
    // Collect active graph propagation and blast radius analysis for each node in the cluster
    const graphNodes = Array.from(graphIntelligenceEngine.nodes.values());
    const blastRadiusAnalyses: Record<string, any> = {};
    const propagationSpreads: Record<string, any> = {};
    const cognitiveExplanations: Record<string, string> = {};

    graphNodes.forEach(node => {
      blastRadiusAnalyses[node.name] = graphIntelligenceEngine.computeBlastRadius(node.name);
      propagationSpreads[node.name] = graphIntelligenceEngine.computeAttackSpread(node.name);
      cognitiveExplanations[node.name] = graphIntelligenceEngine.getAIGraphExplanation(node.name);
    });

    return await this.orchestrator.analyze({ 
      type: 'threat',
      context: {
        nodes: topology,
        events: events,
        isReplayActive: digitalTwinEngine.scenario !== 'idle' && digitalTwinEngine.status === 'running',
        replaySessionId: digitalTwinEngine.sessionId,
        simulationScenario: digitalTwinEngine.scenario,
        graphAnalytics: {
          note: "Analyzing cloud-native topology with advanced multi-tier graph reasoning",
          nodes: graphNodes,
          edges: graphIntelligenceEngine.edges,
          blastRadius: blastRadiusAnalyses,
          propagationSpreads: propagationSpreads,
          cognitiveExplanations: cognitiveExplanations
        }
      }
    });
  }

  public async stream(data: any, onChunk: (chunk: string) => void) {
    if (data && data.context) {
      data.context.isReplayActive = digitalTwinEngine.scenario !== 'idle' && digitalTwinEngine.status === 'running';
      data.context.replaySessionId = digitalTwinEngine.sessionId;
      data.context.simulationScenario = digitalTwinEngine.scenario;
    }
    return await this.orchestrator.stream(data, onChunk);
  }
}

export const aiService = new AIService();
