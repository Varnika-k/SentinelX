# SentinelX: Technical Intelligence Report & Documentation

## 1. Project Identity
**SentinelX** is an AI-Native Cyber Intelligence & Autonomous Defense Platform. It utilizes an event-driven architecture to visualize and mitigate synthetic and real-world cyber threats.

## 2. Enterprise Architecture
The system follows a **Flux-inspired Telemetry Pipeline**:
*   **Backend (FastAPI-Style Node.js)**: A high-performance Express server managing a WebSocket gateway.
*   **Real-Time Gateway**: Streams telemetry events (Attacks, Logs, Metrics) directly to connected SOC consoles.
*   **Telemetry Bus**: A centralized frontend pub/sub system that decouples the data source from the UI components.
*   **Visualization Layer**: D3.js powered "Battlespace" for tactical network awareness.
*   **AI Layer**: Gemini-integrated threat analysis for rapid incident response.

## 3. Data Infrastructure

### A. Telemetry Bus (`src/telemetry/bus.ts`)
The central nervous system of the SOC.
*   **Topics**: `node:update`, `attack:alert`, `metric:tick`, `system:log`, `threat:escalation`.
*   **Subscription**: UI components subscribe to specific topics to react to incoming telemetry.

### B. Telemetry Store (`src/telemetry/store.ts`)
The single source of truth for the application state. It listens to the Telemetry Bus and maintains the current "world view."

### C. Live Backend (`server.ts`)
A simulation-ready backend that:
*   Generates synthetic infrastructure events.
*   Broadcasts events over WebSockets.
*   Supports future integration with Kafka, SIEMs, or CloudWatch via the "Normalization Layer".

## 4. Operational Flow
1.  **Ingestion**: Backend detects a "Brute Force" attempt on `fw-1`.
2.  **Broadcast**: Server sends a JSON envelope via WebSocket.
3.  **Client normalization**: `TelemetryClient` receives the frame and publishes to the local bus.
4.  **UI Reaction**: 
    *   `ThreatBanner` updates to "High".
    *   `EventPanel` logs the IDS alert.
    *   `NetworkGraph` pulses `fw-1` red.
    *   `MetricsPanel` reflects the security score drop.

---

## 5. Developer Guide: Unified Telemetry Architecture

### A. The Pure-Functional Telemetry Event Lifecycle
In SentinelX, **everything is driven by telemetry events**. Client panels, state tables, and alerts never mutate shared memory or states directly. State mutations follow an immutable unidirectional flow:
1. **Creation**: An action (operator manual trigger or automated crawler interval) publishes an envelope onto the global `telemetryBus`.
2. **Normalisation / Validation**: Each payload adheres strictly to typing declarations in `src/telemetry/schemas.ts`.
3. **Queueing & Batching**: The core react store `useTelemetryStore` intercepts events, queuing them to prevent layout thrashing and processing them in order.
4. **Pure Functional Reduction**: The pure `TelemetryProcessor.process(state, envelope)` reducer computes state transitions, generating a new, immutable `SimulationState`.
5. **Operational Synchronization**: All UI components (graphs, metrics, timelines) observe the state in the store, guaranteeing visual alignment.

### B. Controlled Simulation Ticks
The `useSimulation` hook acts as a stateless event coordinator:
* It reads the current system layout from `useTelemetryStore` via reference.
* On tick intervals, it calculates lateral movement and defense mitigation transitions, immediately publishing them as granular event updates (`NODE_UPDATE`, `METRIC_TICK`, `DEFENSE_UPDATE`).
* It maintains **zero local duplicate React state**, removing potential divergence bugs.

### C. Replay Determinism & State Safety
The platform features an enterprise-grade playback simulation:
* **No Side-Effects**: During playback (`isPlaying` or when scrubbed historical-index is behind live timestamp), the central simulation scheduler freezes live intervals, ensuring historical events can be debugged without live interference.
* **State Isolation**: Rewinding/Seeking triggers a `REPLAY_RESET` event, cleaning state managers and fast-forwarding telemetry queues up to the target index in high-speed, making replay a pure function of event-history reconstruction.
* **No Loopback Emissions**: Events played back are clearly annotated with an `_isReplay: true` marker, preventing telemetry circular-injection.

### D. Graph and AI Interaction Boundaries
* **Graph as Visual Client**: The tactical battlefield visualization consumes raw node/link states of the telemetry store under a read-only rendering paradigm.
* **AI Cortex Constraints**: AI analysis operates strictly on read-only queries with zero authority to write to states. It queries topology graphs and baselines, feeding natural-language reasoning back into context containers.

---
*Powered by SentinelX Core - Enterprise Cyber Intelligence.*
