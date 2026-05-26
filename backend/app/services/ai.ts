import { AIOrchestrator } from '../../../src/server/ai/orchestrator';
import { GeminiProvider } from '../../../src/server/ai/gemini-provider';
import { CONFIG } from '../../../src/config';
import { logger } from '../core/logger';
import { graphIntelligenceEngine } from '../simulation/graph-intelligence';
import { digitalTwinEngine } from '../simulation/twin-engine';

class AIService {
  private orchestrator: AIOrchestrator;
  private responseCache: Map<string, { response: any; timestamp: number }> = new Map();

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

    // Determine cache key based on request shape to prevent duplicate Gemini reasoning
    let cacheKey = '';
    if (data && data.type === 'threat' && data.context?.targetNode) {
      const node = data.context.targetNode;
      cacheKey = `threat-${node.id}-${node.status}-${node.threatScore || 0}-${node.lastAttackType || ''}`;
    } else {
      cacheKey = JSON.stringify(data).substring(0, 300);
    }

    const now = Date.now();
    if (this.responseCache.has(cacheKey)) {
      const val = this.responseCache.get(cacheKey)!;
      if (now - val.timestamp < 15000) { // Cache AI summaries for 15 seconds
        logger.info(`[AIService] Deduction Hit! Serving cached reasoning response for key: ${cacheKey}`);
        return val.response;
      }
    }

    // Protect Gemini API key rate limits under high automation loops
    const lastRequestTime = Array.from(this.responseCache.values())
      .map(v => v.timestamp)
      .reduce((max, t) => Math.max(max, t), 0);
    
    if (now - lastRequestTime < 1000) {
      logger.info('[AIService] Throttling rapid sequential AI analysis to avoid rate exhaustion');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      const response = await this.orchestrator.analyze(data);
      this.responseCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    } catch (err) {
      logger.error('Error during AI analysis inference call', err);
      throw err;
    }
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
