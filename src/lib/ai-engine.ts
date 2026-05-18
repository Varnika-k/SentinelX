import { AIAnalysisRequest, AIAnalysisResponse, AIStreamChunk } from '../types/ai';

class AIEngine {
  private static instance: AIEngine;
  private cache: Map<string, { data: AIAnalysisResponse; timestamp: number }> = new Map();
  private CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  private constructor() {}

  static getInstance() {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const cacheKey = JSON.stringify(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('AI Intelligence Core offline or unreachable');
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async *streamAnalysis(request: AIAnalysisRequest): AsyncGenerator<string> {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok || !response.body) {
      throw new Error('AI Stream connection failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data) as AIStreamChunk;
            if (parsed.content) yield parsed.content;
          } catch (e) {
            console.error('Failed to parse stream chunk', e);
          }
        }
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const aiEngine = AIEngine.getInstance();
