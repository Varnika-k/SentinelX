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
            confidence: { type: Type.NUMBER },
            
            // Phase 6 Structured Core Intelligence
            threatClassification: { type: Type.STRING },
            blastRadius: { type: Type.NUMBER },
            affectedInfrastructure: { type: Type.ARRAY, items: { type: Type.STRING } },
            trustDegradation: { type: Type.NUMBER },
            propagationProbability: { type: Type.NUMBER },
            operationalImpact: { type: Type.STRING },
            
            mitigations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  action: { type: Type.STRING },
                  successProbability: { type: Type.NUMBER },
                  rationale: { type: Type.STRING },
                  sideEffects: { type: Type.STRING },
                  infrastructureImpact: { type: Type.STRING }
                },
                required: ['type', 'action', 'successProbability', 'rationale', 'sideEffects', 'infrastructureImpact']
              }
            },
            
            adversaryBehavior: {
              type: Type.OBJECT,
              properties: {
                tactics: { type: Type.ARRAY, items: { type: Type.STRING } },
                techniques: { type: Type.ARRAY, items: { type: Type.STRING } },
                stages: { type: Type.ARRAY, items: { type: Type.STRING } },
                mitreAlignment: { type: Type.STRING }
              },
              required: ['tactics', 'techniques', 'stages', 'mitreAlignment']
            },
            
            adaptiveThreatDetails: {
              type: Type.OBJECT,
              properties: {
                adaptabilityRisk: { type: Type.STRING, enum: ['low', 'medium', 'high', 'autonomous'] },
                payloadMutationPattern: { type: Type.STRING },
                behaviouralAdaptation: { type: Type.STRING }
              },
              required: ['adaptabilityRisk', 'behaviouralAdaptation']
            },

            replayAnalysis: {
              type: Type.OBJECT,
              properties: {
                isReplayContext: { type: Type.BOOLEAN },
                incidentDurationSeconds: { type: Type.NUMBER },
                timelineSummary: { type: Type.STRING },
                rootCauseReasoning: { type: Type.STRING }
              },
              required: ['isReplayContext']
            }
          },
          required: [
            'summary', 'reasoning', 'recommendations', 'threatLevel', 'confidence',
            'threatClassification', 'blastRadius', 'affectedInfrastructure', 
            'trustDegradation', 'propagationProbability', 'operationalImpact', 'mitigations',
            'adversaryBehavior', 'adaptiveThreatDetails', 'replayAnalysis'
          ]
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
    const prompt = this.buildPrompt(request) + "\n\nProvide the analysis in an elite technical operational format. Keep responses brief, authoritative, and structured without intro/outro fluff.";
    
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
    const { 
      nodes, 
      links, 
      events, 
      targetNode, 
      recentActivity, 
      graphAnalytics, 
      isReplayActive, 
      replaySessionId,
      simulationScenario 
    } = context;

    let prompt = `You are SentinelX Operational Intelligence Core - an elite CyOps Reasoning Runtime and infrastructure-aware cyber analyst.
    Classify, dissect, and reason over active threats in the digital twin namespace.
    
    === OPERATIONAL ENVIRONMENT ===
    OPERATION_TYPE: ${type.toUpperCase()}
    SIMULATION_SCENARIO: ${simulationScenario || 'Standard Operations'}
    REPLAY_CONTEXT_DECLARED: ${isReplayActive ? `TRUE (Session: ${replaySessionId})` : 'FALSE (Real-time stream/Digital Twin)'}
    NETWORK_NODES: ${nodes ? nodes.length : 0} nodes running
    NETWORK_LINKS: ${links ? links.length : 0} communication routes active
    INGESTED_ALERTS: ${events ? events.length : 0} active signals
    `;

    if (graphAnalytics) {
      prompt += `
      === GRAPH TOPOLOGY INTELLIGENCE ===
      We have compiled the active topological graph and evaluated critical paths.
      Critical Infrastructure Paths: ${JSON.stringify(graphAnalytics.criticalPaths || [])}
      Crown Jewel Exposure Weights: ${JSON.stringify(graphAnalytics.crownJewelRisk || [])}
      Lateral Propagation Vectors: ${JSON.stringify(graphAnalytics.lateralMovementProbability?.slice(0, 4) || [])}
      Resilience Index Baseline: ${graphAnalytics.resilienceIndex || 'Unknown'}
      Predicted Infrastructure Stress: ${JSON.stringify(graphAnalytics.infrastructurePressure?.slice(0, 4) || [])}
      `;
    }

    if (targetNode) {
      prompt += `
      === CURRENT FOCUS NODE ID: ${targetNode.id || targetNode.name} ===
      Label: ${targetNode.label || targetNode.name}
      Type: ${targetNode.type}
      Status: ${targetNode.status}
      Threat Score: ${targetNode.threatScore || targetNode.riskScore}/100
      Trust Evaluation Index: ${targetNode.trustScore ?? 'Pending'}
      Compromise Probability: ${targetNode.compromiseProbability ?? 'Pending'}
      Resilience Index: ${targetNode.resilienceScore ?? 'Pending'}
      Exposure Blast Radius: ${targetNode.exposureScore ?? 'Pending'}
      Criticality Scale: ${targetNode.criticality ?? targetNode.operationalCriticality ?? 0.5}
      Latency: ${targetNode.latency || 12}ms
      `;
    }

    if (recentActivity && recentActivity.length > 0) {
      prompt += `
      === ACTIVE TELEMETRY INGESTION STREAM ===
      ${JSON.stringify(recentActivity.slice(-8))}
      `;
    }

    prompt += `
    === CORE REASONING OBJECTIVES ===
    Analyze this cyber range state with full graph, telemetry, and mitigation awareness.
    
    1. THREAT CLASSIFICATION & MITRE ALIGNMENT: 
       Classify the incident strictly into one of: Ransomware Propagation, Credential Compromise, Insider Threat, Privilege Escalation, Lateral Movement, Runtime Compromise, AI-Assisted Attack, Cloud Abuse, or Adaptive Malware. Identify MITRE ATT&CK tactics (e.g. TA0008 Lateral Movement, TA0004 Privilege Escalation) and stages.
       
    2. GRAPH RELATIONSHIPS & ATTACK PROPAGATION: 
       Evaluate trust boundaries and determine which node is threatened next. Calculate blast radius (0-100) and identify exact impacted infrastructure components (e.g., k8s pods, payment gateways, active directory connectors).
       
    3. DETAILED DEFENSE RECOMMENDATIONS: 
       Recommend at least 2 distinct mitigations. For each mitigation, dictate:
       - Success probability (0% to 100%)
       - Rationale (WHY it mitigates the attack vector)
       - Side effects (Operational tradeoffs, performance bottlenecks, connection drops)
       - Infrastructure impact (Effect on topology path and lateral spread)
       
    4. REPLAY-AWARE FORENSICS (IF REPLAY IS ACTIVE):
       Detail the incident duration, summarize the attack timeline, and reconstruct how the threat evolved. Use historical data to evaluate.
       
    5. ADAPTIVE AI THREAT ANALYSIS (BEHAVIORAL ADAPTATION):
       Determine if the adversary is exhibiting autonomous, adaptive, or mutate-on-the-fly properties. Report adaptability risk as low, medium, high, or autonomous. State the payload mutation patterns or behavioral adaptation characteristics.

    === OUTPUT PROTOCOL ===
    - Produce highly precise, tactical, professional intelligence.
    - Sound authoritative, structured, and infrastructure-aware.
    - Zero conversational greetings or standard chat closures.
    `;

    return prompt;
  }
}
