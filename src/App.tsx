/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { BootSequence } from './components/BootSequence';
import { ThreatBanner } from './components/ThreatBanner';
import { MetricsPanel } from './components/MetricsPanel';
import { NetworkGraph } from './components/NetworkGraph';
import { ControlPanel } from './components/ControlPanel';
import { EventPanel } from './components/EventPanel';
import { SimulationView } from './components/SimulationView';
import { BattleManual } from './components/BattleManual';
import { NodeDetails } from './components/NodeDetails';
import { IncidentReport } from './components/IncidentReport';
import { LandingPage } from './components/LandingPage';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoginTerminal } from './components/LoginTerminal';
import { NetworkNode } from './types/simulation';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, Cpu, Network, FileText, ArrowLeft, LogOut } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'booting' | 'landing' | 'simulation'>('booting');
  const [showManual, setShowManual] = useState(false);
  const { 
    state, 
    launchAttack, 
    launchScenario, 
    activateDefense, 
    isolateNode, 
    resetSimulation,
    setSimulationSpeed,
    toggleDefenseModule,
    updateNodeVulnerability,
    updateZoneVulnerability
  } = useSimulation();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showReport, setShowReport] = useState(false);

  if (view === 'booting') {
    return <LoginTerminal onComplete={() => setView('landing')} />;
  }

  return (
    <div className="bg-void text-text-primary selection:bg-accent-cyan/30 font-body uppercase min-h-screen">
      {view === 'landing' ? (
        <LandingPage 
          onEnterSimulation={() => setView('simulation')}
          onOpenManual={() => setShowManual(true)}
        />
      ) : (
        <SimulationView 
          simulationState={state}
          simulationActions={{
            launchAttack,
            launchScenario,
            activateDefense,
            isolateNode,
            resetSimulation,
            setSimulationSpeed,
            toggleDefenseModule,
            updateNodeVulnerability,
            updateZoneVulnerability
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
        events={state.events}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />

      {/* Global Cinematic Accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent animate-scanline" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,255,209,0.02)_0%,transparent_70%)]" />
      </div>
    </div>
  );
}
