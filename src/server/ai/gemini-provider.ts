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
      model: "gemini-3.5-flash",
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
      model: "gemini-3.5-flash",
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

    let prompt = `You are SentinelX Intelligence Core - an elite CyOps and autonomous defense planner.
    Conduct a forensic and operations-aware threat propagation review.
    
    OPERATION_TYPE: ${type.toUpperCase()}
    NETWORK_NODES: ${nodes ? nodes.length : 0} nodes online in digital twin
    NETWORK_LINKS: ${links ? links.length : 0} linking threads active
    RECENT_EVENTS: ${events ? events.length : 0} logs ingested
    `;

    if (graphAnalytics) {
      prompt += `
      GRAPH_INTELLIGENCE_METRICS:
      Critical Infrastructure Paths: ${JSON.stringify(graphAnalytics.criticalPaths)}
      Crown Jewel Exposure Weights: ${JSON.stringify(graphAnalytics.crownJewelRisk)}
      Lateral Propagation Vectors: ${JSON.stringify(graphAnalytics.lateralMovementProbability?.slice(0, 4))}
      
      AUTONOMOUS_DEFENSE_PROPOSALS:
      Active Recommendations: ${JSON.stringify(context.defenseRecommendations || [])}
      `;
    }

    if (targetNode) {
      prompt += `
      TARGETED_INFRASTRUCTURE_SPEC_FOCUS:
      ID: ${targetNode.id}
      Type: ${targetNode.type}
      Status: ${targetNode.status} (Infection/Degradation Scope)
      Threat Score: ${targetNode.threatScore}/100
      Latency Profile: ${targetNode.latency || 12}ms
      Degradation Coefficient: ${targetNode.degradation || 0}%
      Exposure Index: ${targetNode.vulnerability}
      Last Event Footprint: ${targetNode.lastAttackType || 'None'}
      `;
    }

    if (recentActivity && recentActivity.length > 0) {
      prompt += `
      REAL-TIME INGESTION STREAM (FIRST-RESPONSE AUDITS):
      ${JSON.stringify(recentActivity.slice(-8))}
      `;
    }

    prompt += `
    CRITICAL COGNITIVE OBJECTIVES:
    1. EXPLAIN THE THREAT: Analyze the root cause of anomalous behaviors seen in the ingestion stream.
    2. PREDICT SPREAD: Determine the risk of lateral propagation down critical network paths to crown jewel nodes (e.g., db-tier, serverless core).
    3. RECOMMENDED CONTAINMENT: Formulate a tier-1 tactical isolation plan (e.g. isolate_node, quarantine_workload, block_traffic, terminate_process, rotate_credentials). Give actionable steps.
    4. OPERATIONAL PRESSURE: Detail the performance cost. Assess node degradation, throughput drops, latency anomalies, and overall cyber operational friction.
    
    STRICT SEC_COMMANDS: Maintain an extremely professional, calm, military-grade SOC threat briefing tone. Under no circumstances use conversational intros, greetings, self-praising or flowery AI descriptions. Keep recommendations highly actionable and aligned with SentinelX defense API values.
    `;

    return prompt;
  }
}
