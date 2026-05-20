export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'local';

export interface AIAnalysisRequest {
  type: 'threat' | 'risk' | 'incident' | 'prediction' | 'remediation';
  context: {
    nodes?: any[];
    links?: any[];
    events?: any[];
    targetNode?: any;
    recentActivity?: any[];
    graphAnalytics?: any;
    defenseRecommendations?: any[];
    knowledgeBase?: any;
  };
  options?: {
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AIAnalysisResponse {
  summary: string;
  reasoning: string[];
  recommendations: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
}
