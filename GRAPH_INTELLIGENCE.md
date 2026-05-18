# SentinelX Graph Intelligence Engine: Technical Overview

SentinelX transforms infrastructure into an intelligent relationship graph, enabling advanced attack path reasoning and risk propagation analysis.

## 1. Graph Architecture

The system utilizes a centralized **Graph Intelligence Engine** (`src/lib/graph-intelligence.ts`) that builds an in-memory representation of the network topology.

- **Nodes**: Represent infrastructure assets with metadata (vulnerability, criticality, threat state).
- **Links**: Represent active communication paths and trust relationships.
- **Adjacency Modeling**: Uses dual adjacency lists (forward/reverse) to enable bidirectional traversal.

## 2. Intelligence Capabilities

### A. Attack Path Reasoning
The engine uses Breadth-First Search (BFS) to identify the shortest paths between compromised nodes and "Crown Jewels" (nodes with criticality > 0.8). Each path is weighted by the vulnerability of its constituent nodes.

### B. Blast Radius Estimation
Calculates the theoretical maximum impact of a node compromise by determining the set of all reachable infrastructure from that specific node.

### C. Lateral Movement Prediction
A heuristic model that predicts the likely next targets for an attack based on:
- Neighboring node vulnerability.
- Current source threat intensity.
- Link risk weights.

### D. Crown Jewel Risk Analysis
Real-time monitoring of the "distance to compromise" for critical assets. A distance < 3 steps is flagged as a rising risk trend.

## 3. Propagation & Risk Engine

- **Risk Clusters**: Dynamically detects zones of high risk by identifying nodes within N-steps of an active compromise.
- **Influence Scoring**: Nodes are prioritized by their connectivity and criticality, determining their "influence" on overall network stability.

## 4. AI Integration

The Graph Intelligence Engine feeds structured metrics directly into the **AI Orchestration Layer**. The AI models don't just see a list of nodes; they receive:
- Shortest path summaries to critical assets.
- Propagation probability matrices.
- High-level topology risk assessments.

## 5. Developer Guide: Traversal Utilities

The engine provides reusable graph primitives:
- `findShortestPath(start, end)`: Standard BFS implementation.
- `getReachableNodes(start, maxDepth)`: Sets the boundary of influence.
- `calculatePathRisk(path)`: Context-aware weighting of infrastructure chains.
