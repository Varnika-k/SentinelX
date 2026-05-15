import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getThreatIntelligence(nodeId: string, status: string, type: string, label: string, context?: string) {
  if (!ai) return "AI Insights unavailable (check API key)";

  try {
    const contextPrompt = context ? `\nRecent Local Activity History:\n${context}` : "";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Sentinel X, an advanced cyber threat intelligence AI. 
      Analyze the current status of network node "${label}" (ID: ${nodeId}, Type: ${type}, Status: ${status}).
      ${contextPrompt}
      Provide a brief, futuristic, and technically-grounded analysis of the risk and a recommended action.
      Keep it under 3 sentences. Be high-tech and concise.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI intelligence report.";
  }
}

export async function getIncidentSummary(events: any[]) {
  if (!ai) return "Summary unavailable.";
  
  try {
    const recentEvents = events.slice(0, 10).map(e => `[${e.timestamp.toISOString()}] ${e.message}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a brief executive summary of recent cyber security events in our virtual network:
      ${recentEvents}
      Focus on impact and current posture.`,
    });
    return response.text;
  } catch (error) {
    return "Error summarizing incidents.";
  }
}
