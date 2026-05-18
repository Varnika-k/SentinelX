import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider } from "./orchestrator";
import { AIAnalysisRequest, AIAnalysisResponse } from "../../types/ai";

export class GeminiProvider implements AIProvider {
  name: 'gemini' = 'gemini';
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const prompt = this.buildPrompt(request);
    
    const response = await this.client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            threatLevel: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
            confidence: { type: Type.NUMBER }
          },
          required: ['summary', 'reasoning', 'recommendations', 'threatLevel', 'confidence']
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", response.text);
      throw new Error("AI engine returned invalid intelligence format");
    }
  }

  async stream(request: AIAnalysisRequest, onChunk: (chunk: string) => void): Promise<void> {
    const prompt = this.buildPrompt(request) + "\n\nProvide the analysis in a structured operational format. Be concise and technical.";
    
    const result = await this.client.models.generateContentStream({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    const { type, context } = request;
    const { nodes, links, events, targetNode, recentActivity, graphAnalytics } = context;

    let prompt = `You are SentinelX Intelligence Core. 
    Analyze the following network state from an operational security perspective.
    
    OPERATION_TYPE: ${type.toUpperCase()}
    NETWORK_NODES: ${nodes ? nodes.length : 0} active
    NETWORK_LINKS: ${links ? links.length : 0} active
    RECENT_EVENTS: ${events ? events.length : 0} logged
    `;

    if (graphAnalytics) {
      prompt += `
      GRAPH_INTELLIGENCE_METRICS:
      Critical Paths: ${JSON.stringify(graphAnalytics.criticalPaths)}
      Crown Jewel Risk: ${JSON.stringify(graphAnalytics.crownJewelRisk)}
      Spread Probability: ${JSON.stringify(graphAnalytics.lateralMovementProbability?.slice(0, 3))}
      
      AUTONOMOUS_DEFENSE_PROPOSALS:
      Active Recommendations: ${JSON.stringify(context.defenseRecommendations || [])}
      `;
    }

    if (targetNode) {
      prompt += `
      TARGET_SYSTEM_FOCUS:
      ID: ${targetNode.id}
      Type: ${targetNode.type}
      Status: ${targetNode.status}
      Threat Score: ${targetNode.threatScore}
      Vulnerability: ${targetNode.vulnerability}
      Last Attack: ${targetNode.lastAttackType || 'None'}
      `;
    }

    if (recentActivity && recentActivity.length > 0) {
      prompt += `
      RECENT_TELEMETRY_STREAM:
      ${JSON.stringify(recentActivity.slice(-5))}
      `;
    }

    prompt += `
    OBJECTIVES:
    1. Assess the situational risk.
    2. Identify infrastructure-aware propagation paths.
    3. Provide explainable operational reasoning.
    4. Recommend containment or defense actions.
    
    STRICT_REQUIREMENT: Maintain an enterprise SOC tone. No conversational filler. Focus on topology and technical indicators.
    `;

    return prompt;
  }
}
