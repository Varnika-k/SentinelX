import { AIOrchestrator } from '../../../src/server/ai/orchestrator';
import { GeminiProvider } from '../../../src/server/ai/gemini-provider';
import { CONFIG } from '../../../src/config';
import { logger } from '../core/logger';

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
    return await this.orchestrator.analyze(data);
  }

  public async analyzeInfra(topology: any, events: any) {
    return await this.orchestrator.analyze({ 
      type: 'threat',
      context: {
        nodes: topology,
        events: events,
        graphAnalytics: {
          note: "Analyzing cloud-native topology for cross-environment paths"
        }
      }
    });
  }

  public async stream(data: any, onChunk: (chunk: string) => void) {
    return await this.orchestrator.stream(data, onChunk);
  }
}

export const aiService = new AIService();
