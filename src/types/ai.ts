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
    isReplayActive?: boolean;
    replaySessionId?: string;
    simulationScenario?: string;
  };
  options?: {
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AIMitigation {
  type: string;                  // e.g. 'isolate', 'rotate', 'block'
  action: string;                // Verbose description
  successProbability: number;    // 0 to 100
  rationale: string;             // reasoning why
  sideEffects: string;           // performance offsets
  infrastructureImpact: string;  // topology path outcome
}

export interface AIAnalysisResponse {
  summary: string;
  reasoning: string[];
  recommendations: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;

  // Phase 6 Structured Core Intelligence
  threatClassification?: string;       // Ransomware, Credential Compromise, etc
  blastRadius?: number;               // 0 to 100
  affectedInfrastructure?: string[];  // Node names affected
  trustDegradation?: number;          // 0 to 100
  propagationProbability?: number;    // 0 to 100
  operationalImpact?: string;         // trade offs explanation
  mitigations?: AIMitigation[];

  adversaryBehavior?: {
    tactics: string[];
    techniques: string[];
    stages: string[];
    mitreAlignment: string;
  };

  adaptiveThreatDetails?: {
    adaptabilityRisk: 'low' | 'medium' | 'high' | 'autonomous';
    payloadMutationPattern?: string;
    behaviouralAdaptation?: string;
  };

  replayAnalysis?: {
    isReplayContext: boolean;
    incidentDurationSeconds?: number;
    timelineSummary?: string;
    rootCauseReasoning?: string;
  };

  metadata?: Record<string, any>;
}

export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
}

