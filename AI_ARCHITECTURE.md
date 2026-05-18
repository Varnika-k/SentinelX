# SentinelX AI Intelligence Engine: Technical Overview

SentinelX features an enterprise-grade AI architecture designed for real-time threat analysis and infrastructure-aware reasoning.

## 1. Orchestration Architecture

The system uses a **Provider-Agnostic Orchestrator** pattern located on the server side to protect secrets and manage model lifecycles.

- **AIOrchestrator**: The central dispatcher (`src/server/ai/orchestrator.ts`). It handles request routing, provider selection, and fallback logic.
- **AIProvider Interface**: Defines the contract for all intelligence engines.
- **GeminiProvider**: Currently the primary intelligence source using the `@google/genai` SDK.

## 2. Reasoning Pipeline

When an analysis is triggered (e.g., node selection), the pipeline follows these steps:

1.  **Context Aggregation**: The client gathers the current network topology (nodes, links), recent telemetry events, and target system metrics.
2.  **API Proxying**: Request is sent to `/api/ai/analyze` (or `/api/ai/stream`).
3.  **Instruction Injection**: The server-side provider injects a "Sentinel Core" system persona and formats the context into an operational prompt.
4.  **Operational Synthesis**: The AI model performs a multi-step reasoning process (infrastructure risk -> propagation path -> remediation).
5.  **Structured Output**: Returns a validated JSON schema containing summary, reasoning steps, recommendations, and confidence scores.

## 3. Contextual Intelligence System

The engine is "infrastructure-aware":
- **Topology Awareness**: The prompt includes neighbor IDs and link states.
- **Attack History**: Recent telemetry is summarized for the model to detect patterns.
- **Node Specificity**: Criticality and vulnerability metrics are used to weight the threat level.

## 4. UI/UX Flow

- **Intelligence Panel**: A dedicated sidebar with streaming "live thinking" animations.
- **Operational Tone**: Outputs are technical, concise, and focused on SOC (Security Operations Center) workflows.
- **Caching Layer**: Prevents redundant requests for stagnant network states.

## 5. Adding New Providers

To add a new AI provider (e.g., Claude, OpenAI):
1. Create a new class implementing `AIProvider` in `src/server/ai/`.
2. Register it in `server.ts` using `orchestrator.registerProvider()`.
3. Set it as active via `orchestrator.setActiveProvider()`.
