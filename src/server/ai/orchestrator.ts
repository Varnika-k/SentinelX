import { AIAnalysisRequest, AIAnalysisResponse, AIProviderType } from '../../types/ai';
import { logger } from '../../lib/logger';

export interface AIProvider {
  name: AIProviderType;
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  stream?(request: AIAnalysisRequest, onChunk: (chunk: string) => void): Promise<void>;
}

export class AIOrchestrator {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private activeProvider: AIProviderType = 'gemini';

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider);
    logger.info(`AI Provider registered: ${provider.name}`);
  }

  setActiveProvider(type: AIProviderType) {
    if (!this.providers.has(type)) {
      throw new Error(`Provider ${type} not registered`);
    }
    this.activeProvider = type;
    logger.info(`Active AI Provider set to: ${type}`);
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) throw new Error('No active AI provider');
    
    logger.debug(`Starting AI analysis for type: ${request.type}`);
    const start = Date.now();
    
    try {
      const response = await provider.analyze(request);
      logger.info(`AI analysis for ${request.type} completed in ${Date.now() - start}ms`);
      return response;
    } catch (error) {
      logger.error('AI provider failed to analyze', error);
      throw error;
    }
  }

  async stream(request: AIAnalysisRequest, onChunk: (chunk: string) => void): Promise<void> {
    const provider = this.providers.get(this.activeProvider);
    
    if (!provider || !provider.stream) {
      logger.warn('Streaming requested but not supported by active provider, falling back to full analysis');
      const response = await this.analyze(request);
      onChunk(response.summary);
      return;
    }
    
    logger.debug(`Starting AI stream for type: ${request.type}`);
    try {
      return await provider.stream(request, onChunk);
    } catch (error) {
      logger.error('AI provider failed to stream', error);
      throw error;
    }
  }
}
