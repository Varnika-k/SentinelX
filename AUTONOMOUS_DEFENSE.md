# SentinelX Autonomous Defense & Decision Engine

SentinelX features an intelligent autonomous defense layer that analyzes network risk and topology to provide proactive security recommendations.

## 1. Defense Architecture

The **Defense Engine** (`src/core/defense-engine.ts`) works in conjunction with the Graph Intelligence Engine to perform operational reasoning.

- **Topology Awareness**: Uses graph traversal to identify next-step targets for active attacks.
- **Incident Context**: Monitors current SIEM incidents to prioritize containment.
- **Probabilistic Modeling**: Calculates confidence scores based on blast radius and threat velocity.

## 2. Decision Logic

The engine generates recommendations across several categories:

### A. Dynamic Containment (Isolate Node)
- **Trigger**: Compromised nodes.
- **Logic**: Calculates the `Blast Radius`. If the node exceeds a threshold or is adjacent to a Crown Jewel, isolation is proposed with high confidence.

### B. Proactive Monitoring (Increase Monitoring)
- **Trigger**: Uncompromised nodes on active attack paths.
- **Logic**: Identifies nodes that are 1-2 hops away from a compromise point. Recommends increased logging to detect lateral movement early.

### C. Operational Escalation
- **Trigger**: High-velocity or high-severity incidents.
- **Logic**: Determines if an incident exceeds the "Standard Operating Procedure" (SOP) threshold, recommending escalation to senior analysts.

## 3. Explainable Reasoning

Every recommendation includes a human-readable `reasoning` string derived from the following factors:
- **Blast Radius**: Potential impact if left uncontained.
- **Topology Proximity**: Distance to critical infrastructure.
- **Node Importance**: The `criticality` score of the target node.

## 4. Workflow Integration

Analysts can interact with the Defense Engine through the **Defense Panel**:
- **Authorize Action**: Instantly applies the containment or configuration change.
- **Dismiss**: Ignores the recommendation for the current analysis cycle.
- **Confidence Scoring**: Helps analysts prioritize high-fidelity signals.

## 5. Future Extensibility

The architecture includes hooks for:
- **Reinforcement Learning (RL)**: Training agents on successful containment sequences.
- **Multi-Agent Defense**: Coordinating multiple autonomous agents across distinct infrastructure zones.
- **Auto-Apply Mode**: Enabling full autonomous response for low-latency scenarios.
