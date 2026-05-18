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
*Powered by SentinelX Core - Enterprise Cyber Intelligence.*
