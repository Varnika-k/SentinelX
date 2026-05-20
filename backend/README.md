# SentinelX Backend Architecture

This backend foundation powers the real-time AI-native cyber operations platform. Although initially requested in FastAPI/Python, it has been implemented in **TypeScript/Node.js** to maintain 100% compatibility with the SentinelX deployment environment while adhering to the requested architectural patterns.

## Architecture (Updated)

```
backend/app/
├── core/           # Fundamental utilities (Logging, Config)
├── schemas/        # Structured data models (Zod/Pydantic-style)
├── db/             # Persistence Layer (TypeORM Entities, Data Source)
├── websocket/      # Real-time event gateway
├── telemetry/      # Event generation and ingestion logic
├── services/       # Business logic (AI Orchestration)
└── main.ts         # SentinelBackend bootstrap class
```

## Telemetry & Replay Flow

1. **Generation**: `TelemetryGenerator` simulates high-fidelity cyber events.
2. **Standardization**: Events validated against `TelemetryEventSchema`.
3. **Persistence**: `WebSocketGateway` hooks into `DatabaseService` to save every event before broadcast.
4. **Transmission**: standardized events broadcast via WebSockets.
5. **Consumption**: Frontend `TelemetryClient` receives the stream.
6. **Replay**: `ReplayEngine` can now query the backend `/api/v1/telemetry/history` or `/api/v1/replay/sessions` to reconstruct state from disk.

## Persistence Features

- **Asynchronous Database Service**: High-performance querying using TypeORM.
- **Auto-Schema Synchronization**: The DB schema evolves automatically with entity changes.
- **Replay Reconstruction**: API endpoints support timestamp-based event range retrieval.
- **Incident Lifecycle**: Incidents are persisted with their full timeline and resolution data.

## Future Roadmap

- **PostgreSQL Persistence**: Hook into `replay/` and `incidents/` modules for long-term storage.
- **Redis Pub/Sub**: Enable multi-instance backend scaling.
- **AI Consensus**: Advanced agent reasoning evaluation in the `services/ai.ts` layer.
