/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { useTelemetryStore } from './telemetry/store';
import { BootSequence } from './components/layout/BootSequence';
import { ThreatBanner } from './components/features/ThreatBanner';
import { MetricsPanel } from './components/features/MetricsPanel';
import { NetworkGraph } from './components/viz/NetworkGraph';
import { ControlPanel } from './components/features/ControlPanel';
import { EventPanel } from './components/features/EventPanel';
import { SimulationView } from './components/layout/SimulationView';
import { BattleManual } from './components/features/BattleManual';
import { NodeDetails } from './components/features/NodeDetails';
import { IncidentReport } from './components/features/IncidentReport';
import { LandingPage } from './components/layout/LandingPage';
import { TutorialOverlay } from './components/features/TutorialOverlay';
import { LoginTerminal } from './components/layout/LoginTerminal';
import { TelemetryDiagnostics } from './components/features/TelemetryDiagnostics';
import { AttackTimeline } from './components/layout/AttackTimeline';
import { TelemetryErrorBoundary } from './components/layout/TelemetryErrorBoundary';
import { NetworkNode } from './types/network';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, Cpu, Network, FileText, ArrowLeft, LogOut } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'booting' | 'landing' | 'simulation'>('booting');
  const [showManual, setShowManual] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  
  // The Telemetry Store (Listens to Bus - Source of Truth for UI)
  const { state: telemetryState, isOnline } = useTelemetryStore();
  
  // The Simulation Controller (Emits to Bus)
  const { 
    state: simState, 
    launchAttack, 
    launchScenario, 
    activateDefense, 
    isolateNode, 
    resetSimulation,
    setSimulationSpeed,
    toggleDefenseModule,
    updateNodeVulnerability,
    updateZoneVulnerability,
    updateIncidentStatus,
    addIncidentNote,
    applyDefenseRecommendation,
    dismissDefenseRecommendation,
    setSpreadVelocity,
    toggleSimulation
  } = useSimulation(telemetryState);

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // We use the telemetry state for rendering to ensure architecture is event-driven
  const activeState = view === 'simulation' ? telemetryState : simState;

  if (view === 'booting') {
    return <LoginTerminal onComplete={() => setView('landing')} />;
  }

  return (
    <TelemetryErrorBoundary>
      <div className="bg-void text-text-primary selection:bg-accent-cyan/30 font-body uppercase min-h-screen">
        {view === 'landing' ? (
          <LandingPage 
            onEnterSimulation={() => setView('simulation')}
            onOpenManual={() => setShowManual(true)}
          />
        ) : (
          <SimulationView 
            simulationState={activeState}
            isOnline={isOnline}
            simulationActions={{
              launchAttack,
              launchScenario,
              activateDefense,
              isolateNode,
              resetSimulation,
              setSimulationSpeed,
              toggleDefenseModule,
              updateNodeVulnerability,
              updateZoneVulnerability,
              updateIncidentStatus,
              addIncidentNote,
              applyDefenseRecommendation,
              dismissDefenseRecommendation,
              setSpreadVelocity,
              toggleSimulation
            }}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            showReport={showReport}
            onSetShowReport={setShowReport}
            onExit={() => setView('landing')}
            onOpenManual={() => setShowManual(true)}
          />
        )}

        <AnimatePresence>
          {showManual && <BattleManual onClose={() => setShowManual(false)} />}
        </AnimatePresence>

        <IncidentReport 
          events={activeState.events}
          isOpen={showReport}
          onClose={() => setShowReport(false)}
        />

        {showDiagnostics && <TelemetryDiagnostics />}

        <AttackTimeline />

        {/* Global Cinematic Accents */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent animate-scanline" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,255,209,0.02)_0%,transparent_70%)]" />
        </div>
      </div>
    </TelemetryErrorBoundary>
  );
}
