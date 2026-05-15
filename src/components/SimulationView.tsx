import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Network, LogOut, Info, Settings, Layout, Search, Maximize2, Zap, HelpCircle } from 'lucide-react';
import { NetworkNode, SimulationState } from '../types/simulation';
import { NetworkGraph } from './NetworkGraph';
import { ControlPanel } from './ControlPanel';
import { EventPanel } from './EventPanel';
import { MetricsPanel } from './MetricsPanel';
import { ThreatBanner } from './ThreatBanner';
import { NodeDetails } from './NodeDetails';

interface SimulationViewProps {
  simulationState: SimulationState;
  simulationActions: {
    launchAttack: (type: any, targetId?: string, intensity?: number) => void;
    launchScenario: (id: string) => void;
    activateDefense: () => void;
    isolateNode: (id: string) => void;
    resetSimulation: () => void;
    setSimulationSpeed: (speed: number) => void;
    toggleDefenseModule: (module: any) => void;
    updateNodeVulnerability: (nodeId: string, vuln: number) => void;
    updateZoneVulnerability: (type: string, vuln: number) => void;
  };
  selectedNode: NetworkNode | null;
  onSelectNode: (node: NetworkNode | null) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showReport: boolean;
  onSetShowReport: (show: boolean) => void;
  onExit: () => void;
  onOpenManual: () => void;
}

export function SimulationView({
  simulationState,
  simulationActions,
  selectedNode,
  onSelectNode,
  showHeatmap,
  onToggleHeatmap,
  showReport,
  onSetShowReport,
  onExit,
  onOpenManual
}: SimulationViewProps) {
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] bg-void flex flex-col overflow-hidden"
    >
      <nav className="h-16 border-b border-border bg-panel flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-cyan" />
            <div className="font-display font-black text-[12px] tracking-[4px] text-white uppercase">
              SENTINEL <span className="text-accent-cyan">//</span> X
            </div>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
            <span className="font-heading text-[10px] tracking-[2px] text-text-secondary uppercase">OPERATIONAL_MODE: ACTIVE_SIMULATION_v3.4</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={onOpenManual}
             className="px-4 py-2 text-text-secondary hover:text-accent-cyan transition-colors font-heading text-[10px] tracking-[2px] uppercase flex items-center gap-2"
           >
             <HelpCircle size={14} />
             MANUAL
           </button>
           <button 
             onClick={onExit}
             className="px-6 py-2 border border-state-danger/30 text-state-danger font-display text-[10px] tracking-[2px] font-bold hover:bg-state-danger/10 transition-all uppercase flex items-center gap-2"
             style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
           >
             <LogOut size={14} />
             EXIT_UNIT
           </button>
        </div>
      </nav>

      <ThreatBanner level={simulationState.threatLevel} />

      <div className="flex-1 flex overflow-hidden">
        {/* Command Side */}
        <div className="w-[500px] border-r border-border bg-surface flex flex-col overflow-hidden relative shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20">
           <div className="p-8 pb-4 shrink-0 border-b border-border bg-panel/30">
              <MetricsPanel metrics={simulationState.metrics} threatLevel={simulationState.threatLevel} />
           </div>
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <ControlPanel 
                nodes={simulationState.nodes}
                onLaunchAttack={simulationActions.launchAttack}
                onLaunchScenario={simulationActions.launchScenario}
                onActivateDefense={simulationActions.activateDefense}
                onReset={simulationActions.resetSimulation}
                onToggleHeatmap={onToggleHeatmap}
                showHeatmap={showHeatmap}
                onShowReport={() => onSetShowReport(true)}
                selectedNodeId={selectedNode?.id}
                simulationSpeed={simulationState.simulationSpeed}
                onSetSimulationSpeed={simulationActions.setSimulationSpeed}
                activeDefenseModules={simulationState.activeDefenseModules}
                onToggleDefenseModule={simulationActions.toggleDefenseModule}
                onOpenManual={onOpenManual}
                onUpdateNodeVulnerability={simulationActions.updateNodeVulnerability}
                onUpdateZoneVulnerability={simulationActions.updateZoneVulnerability}
                onHighlightNode={setHighlightedNodeId}
              />
              <div className="pt-4">
                 <EventPanel events={simulationState.events} />
              </div>
           </div>
        </div>

        {/* Battlespace Visualization */}
        <div className="flex-1 relative bg-void overflow-hidden flex">
           <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 cyber-grid opacity-10" />
              <div className="absolute top-8 left-8 z-10 flex flex-col gap-1 pointer-events-none opacity-40">
                 <div className="flex items-center gap-3">
                    <Network className="w-3 h-3 text-accent-cyan" />
                    <span className="text-[10px] font-heading tracking-[4px] text-text-secondary uppercase">TOPOLOGY_MAP_BATTLESYNC_0x3FF</span>
                 </div>
                 <div className="w-48 h-px bg-border" />
              </div>

              <NetworkGraph 
                  nodes={simulationState.nodes}
                  links={simulationState.links}
                  onNodeClick={onSelectNode}
                  selectedNodeId={selectedNode?.id}
                  showHeatmap={showHeatmap}
                  highlightedNodeId={highlightedNodeId}
                />

                {/* AI HUD Overlay */}
                <div className="absolute bottom-10 right-10 flex gap-10 items-end opacity-40 pointer-events-none">
                   <div className="flex flex-col items-end gap-2">
                      <span className="font-heading text-[8px] tracking-[4px] text-accent-blue uppercase">LATENCY_SYNC: 12ms</span>
                      <span className="font-heading text-[8px] tracking-[4px] text-accent-blue uppercase">NETWORK_LOAD: 42%</span>
                   </div>
                   <div className="w-px h-10 bg-border" />
                   <div className="flex flex-col items-end gap-2 text-right">
                      <span className="font-heading text-[8px] tracking-[4px] text-text-secondary uppercase">CRYPTO_SYMMETRIC: ACTIVE</span>
                      <span className="font-heading text-[8px] tracking-[4px] text-text-secondary uppercase">CORE_UPTIME: 99.9%</span>
                   </div>
                </div>
           </div>

           {/* Integrated Node Details side panel */}
           <AnimatePresence>
             {selectedNode && (
               <motion.div 
                 key="node-details"
                 initial={{ x: 450, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: 450, opacity: 0 }}
                 className="w-[450px] border-l border-border bg-surface h-full z-10 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
               >
                  <NodeDetails 
                    node={selectedNode} 
                    nodes={simulationState.nodes}
                    events={simulationState.events}
                    links={simulationState.links}
                    onIsolate={simulationActions.isolateNode}
                    onClose={() => onSelectNode(null)} 
                    isPanel={true}
                  />
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
