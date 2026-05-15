# SentinelX

SentinelX is a cyber defense simulation platform focused on real time threat visualization, attack propagation, and autonomous defense behavior inside a simulated enterprise network environment.

The idea behind the project is to build an interactive SOC style system that can visually represent how threats move across infrastructure, how defensive systems react, and how analysts can monitor and inspect incidents in real time.

The current version is simulation based, but the long-term direction is to evolve it into a real time AI driven cyber intelligence and defense platform capable of working with live telemetry and infrastructure data.

---

## Current Features

### Real Time Network Simulation
- Interactive infrastructure graph
- Connected enterprise style network topology
- Live node state transitions
- Animated packet movement
- Dynamic attack propagation

### Threat Simulation
Currently supported simulated attack types:
- Ransomware
- DDoS
- Phishing
- Insider Threat

Each attack behaves differently within the simulation.

### Defender System
- Automated node isolation
- Basic defender AI logic
- Threat containment flow
- Real time defensive actions

### Monitoring Dashboard
- Live threat metrics
- Dynamic severity levels
- Threat activity logs
- Infrastructure status tracking

### Node Inspection
Clicking on a node displays:
- system status
- risk level
- AI generated analysis
- infrastructure details

### Interactive Controls
- Launch attacks
- Activate defense systems
- Switch attack types
- Trigger live simulation events

---

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

### Visualization
- SVG based network rendering
- Motion driven packet animation
- Real time state updates

---

## Project Structure

```bash
frontend/
  src/
    app/
    components/
      NetworkGraph.tsx
      MetricsPanel.tsx
      EventPanel.tsx
      ControlPanel.tsx
      NodeDetails.tsx
      ThreatBanner.tsx
```
Running the Project
1) Install dependencies:

npm install

2) Start the development server:

npm run dev
