# SentinelX Telemetry Architecture

SentinelX uses a fully decoupled, event-driven telemetry architecture designed for scalable real-time monitoring and high-fidelity attack simulation.

## Core Components

### 1. Telemetry Bus (`bus.ts`)
A centralized pub/sub engine that facilitates communication between simulation sources (local or remote) and the UI.
- Use `telemetryBus.subscribe(topic, callback)` to listen.
- Use `telemetryBus.publish(topic, payload)` to broadcast.
- Supports wildcard `*` subscriptions for global monitoring.

### 2. Telemetry Processor (`processor.ts`)
A dedicated reducer that defines state transitions for every telemetry topic.
- Transforms `SimulationState` based on incoming `TelemetryEnvelope`.
- Keeps state mutation logic centralized and testable outside of React.

### 3. Telemetry Store (`store.ts`)
The primary source of truth for the UI components.
- Implements **requestAnimationFrame batching** to handle high-velocity streams.
- Buffers events into queues before applying state updates to optimize React rendering performance.

### 4. Teleplay Engine (`replay.ts`)
Enables re-streaming of historical telemetry data.
- Can be used for post-incident analysis and training scenarios.
- Integrated into the **Diagnostics Panel**.

## Event Topics (`schemas.ts`)
- `node:update`: Changes to specific node properties (status, threat score).
- `attack:alert`: Notifications of detected adversarial activity.
- `metric:tick`: Aggregated network health metrics.
- `defense:action`: Results of automated or manual defense counter-measures.
- `system:log`: General infrastructure and connection metadata.

## Update Flow
1. **Source** (e.g., `useSimulation`) performs logic and identifies changes.
2. **Source** publishes events to the `telemetryBus`.
3. **TelemetryStore** pushes events into its internal `eventQueue`.
4. On the next animation frame, **TelemetryStore** drains the queue, processes events through the **TelemetryProcessor**, and updates React state.
5. **NetworkGraph** and other components react to the updated state. Memoized sub-components (`GraphNode`, `GraphLink`) ensure only changed elements re-render.
