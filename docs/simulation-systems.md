# SentinelX Digital Twin & Cyber Simulation Engine Documentation

Welcome to the internal engineering specifications for the SentinelX dynamic cyber range, autonomous infrastructure twin, and threat simulation orchestration pipeline.

---

## 1. Centralized Digital Twin Architecture

The SentinelX Digital Twin is a synchronous, state-aware replica of cloud-native infrastructure environments (Kubernetes namespaces, multi-region AWS/Azure VMs, serverless stacks, and network edge proxies).

```
   +-------------------------------------------------------------+
   |                SentinelX Digital Twin Engine                |
   +-------------------------------------------------------------+
                                  |
         +------------------------+------------------------+
         |                                                 |
         v                                                 v
+------------------+                             +-------------------+
|  Infrastructure  |                             |   Adaptive Threat |
|  State Modeling  |                             |   Campaign Loop   |
+------------------+                             +-------------------+
  (CPU, Latency,                                   (Ransomware, DDoS,
   Flow Rate, Status)                               Insider Threat...)
```

### State Representation
The core replica models every node with:
- `id` / `name` / `type` (e.g. `K8S_POD`, `CLOUD_EC2`)
- `namespace` / `environment` (e.g. `production`, `aws-east`)
- `status`: `healthy` | `warning` | `critical` | `infected` | `isolated`
- `metrics`: CPU usage, Network latency, ingress connections / flow-rate
- `riskScore`: Computed continuously based on adjacent threats and anomaly logs.

---

## 2. Dynamic Infrastructure & Threat Simulation System

The simulation engine runs a real-time orchestrator loop that executes state machine ticks every **3000ms**.

### Active Scenarios & Propagation Algorithms

1. **Ransomware Transmission Model**
   - **Contagion Rate:** Models recursive propagation along adjacent nodes.
   - **Quarantine Cut-off:** Actively checks if any targeted node has its status set to `isolated`. If yes, the infection vector fails to spread, rendering the system resilient.

2. **DDoS Flood Cascade Model**
   - Targets the default ingress nodes (e.g. `k8s-svc-ingress-nginx`), raising connections to **>6500 c/s**.
   - Spills overload pressure down to downstream endpoints, showing cascading CPU stress and warning-status triggers in core databases and payment-apis.

3. **Kubernetes Privilege Escalation**
   - Targets authentication namespaces. Compromised pods elevate role privileges to `cluster-admin` via RBAC access tokens, demonstrating realistic container escapes.

4. **Insider Threat Execution**
   - Simulates admin accounts scanning subnets and executing database dumps during anomalous off-hours.

---

## 3. Predictive "What-If" Projections & Branching

SentinelX simulates branching futures to model mitigation effectiveness. When requested,-it clones the in-memory Digital Twin and projects two parallel paths over **10 steps**:

```
                   +---> No Action: 100% infection spread, cascade crash
                   |
[Infected Node T=0] |
                   |
                   +---> Autonomous Isolation: Exposure restricted to 10%
```

- **Branch A (No Action):** Contagion propagates freely. High risk, leading to dependency collapse.
- **Branch B (Autonomous Defensive Isolation):** Activates physical port limits and pod isolation rules. Stabilizes metrics, leading to recovery.

---

## 4. Developer Tooling & APIs

The simulation engine exposes rich HTTP endpoints for debugging and scenario management:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/v1/simulation/status` | GET | Dump current active twin node states, session details and threat metrics. |
| `/api/v1/simulation/control` | POST | Trigger Start/Pause/Stop control sequences on active campaigns. |
| `/api/v1/simulation/node/action` | POST | Enforce manual/autonomous defense (Isolate, Scale Up, Inject Chaos). |
| `/api/v1/simulation/what-if/:nodeName` | GET | Plot 10-tick branch forecasts for risk management. |

---

## 5. Support Specs for Future Reinforcement Learning & Chaos Range

This architecture is built with decoupling in mind:
- **Telemetry-Safe Isolation:** Simulated states do not pollute live host telemetry unless marked.
- **Autonomous Gym interface:** APIs are ready to support synthetic RL environments (Reward = MTTR reduction; Actions = Node Isolation, Replica scaling).
- **Chaos Engineering Hook:** Supports arbitrary failure injection to stress-test high throughput systems.
