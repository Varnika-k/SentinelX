# SentinelX Incident Management & SOC Workflow

SentinelX has evolved from a pure visualization platform into a structured operational cyber intelligence system. This document outlines the architecture and workflows of the Incident Management system.

## 1. Incident Lifecycle

SentinelX enforces a structured lifecycle for every detected cyber event:

- **Detected**: Initial state when telemetry correlation identifies a potential threat.
- **Investigating**: Analyst has acknowledged the incident and is gathering evidence.
- **Escalated**: High-priority state requiring senior intervention or advanced containment.
- **Contained**: The immediate threat has been mitigated (e.g., node isolation).
- **Resolved**: Root cause identified and remediation confirmed.
- **Archived**: Incident closed and moved to historical records.

## 2. Correlation & Grouping Logic

The `IncidentManager` acts as the central correlation engine. It follows these rules:

- **Identity Correlation**: Events targeting the same node are grouped into the same incident.
- **Lateral Proximity**: Events on nodes that are directly linked or part of the same "Blast Radius" are assessed for grouping.
- **Temporal Windowing**: Related events occurring within a specific time window are merged to prevent alert fatigue.
- **De-duplication**: Repeated identical alerts are suppressed and added as metadata to the existing incident rather than creating new entries.

## 3. Workflow Architecture

SentinelX supports a multi-tier analyst workflow:

- **Incident Queue**: A centralized view of all active and historical incidents with severity-based sorting.
- **Investigation Terminal**: A deep-dive view for a single incident involving:
  - **Attack Chain Reconstruction**: Visual replay of how the breach propagated.
  - **Event Journal**: Low-level telemetry logs related specifically to the incident.
  - **Analyst Notebook**: Structured evidence collection and manual annotations.
  - **AI Cognitive Assessment**: Generative summaries and response recommendations based on the graph topology.

## 4. Operational State Management

The system uses an event-driven architecture powered by the `TelemetryBus`:

1. **Detection**: `SimulationEngine` emits `ATTACK_ALERT`.
2. **Correlation**: `TelemetryProcessor` passes the event to `IncidentManager`.
3. **State Sync**: `useTelemetryStore` updates the UI state with the new/updated Incident.
4. **Action**: Analyst interactions (e.g., "Mark as Resolved") emit `UI_ACTION` events.
5. **Feedback Loop**: Commands reach the `SimulationEngine` to apply containment or resets.

## 5. Metadata Schema

Each incident contains:
- **Blast Radius**: Quantitative impact assessment (0.0 to 1.0).
- **Risk Score**: Combined metric of severity, node criticality, and propagation speed.
- **Compromise Chain**: Ordered list of nodes affected in the attack sequence.
- **Evidence Collection**: All related telemetry events pinned to the incident record.
