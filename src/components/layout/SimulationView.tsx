import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Network, LogOut, HelpCircle, Settings, Layout, Zap, BrainCircuit, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NetworkNode } from '../../types/network';
import { SimulationState } from '../../types/simulation';
import { NetworkGraph } from '../viz/NetworkGraph';
import { ControlPanel } from '../features/ControlPanel';
import { EventPanel } from '../features/EventPanel';
import { MetricsPanel } from '../features/MetricsPanel';
import { ThreatBanner } from '../features/ThreatBanner';
import { NodeDetails } from '../features/NodeDetails';
import { VisualControlPanel } from '../features/VisualControlPanel';
import { VisualSettings } from '../viz/NetworkGraph';
import { AIIntelligencePanel } from '../features/AIIntelligencePanel';
import { AnalyticsPanel } from '../features/AnalyticsPanel';
import { IdentityIntelligence } from '../features/IdentityIntelligence';
import { IntelligenceHub } from '../features/IntelligenceHub';
import { GraphIntelligenceEngine } from '../../lib/graph-intelligence';
import { SOCDashboard } from '../features/SOCDashboard';
import { AutonomousDefensePanel } from '../features/AutonomousDefensePanel';
import { AIOperationsCenter } from '../features/AIOperationsCenter';
import { DigitalTwinDashboard } from '../features/DigitalTwinDashboard';

interface SimulationViewProps {
  simulationState: SimulationState;
  isOnline: boolean;
  simulationActions: {
    launchAttack: (type: any, targetId?: string, intensity?: number, identityId?: string) => void;
    launchScenario: (id: string) => void;
    activateDefense: () => void;
    isolateNode: (id: string) => void;
    resetSimulation: () => void;
    setSimulationSpeed: (speed: number) => void;
    toggleDefenseModule: (module: any) => void;
    updateNodeVulnerability: (nodeId: string, vuln: number) => void;
    updateZoneVulnerability: (type: string, vuln: number) => void;
    updateIncidentStatus: (id: string, status: any) => void;
    addIncidentNote: (id: string, note: string) => void;
    applyDefenseRecommendation: (rec: any) => void;
    dismissDefenseRecommendation: (recId: string) => void;
    setSpreadVelocity: (velocity: number) => void;
    toggleSimulation: () => void;
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
  isOnline,
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
  const [showVisualSettings, setShowVisualSettings] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'details' | 'ai' | 'analytics' | 'defense' | 'identity' | 'intelligence' | 'ops' | 'twin'>('twin');
  const [showSOC, setShowSOC] = useState(false);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>({
    intensity: 1,
    speed: 1,
    glow: 1,
    heatmapOpacity: 0.15,
    pulseFrequency: 1
  });

  const engine = useMemo(() => new GraphIntelligenceEngine(simulationState.nodes, simulationState.links), [simulationState.nodes, simulationState.links]);
  const criticalPaths = useMemo(() => engine.findCriticalAttackPaths().map(p => p.path), [engine]);

  const handleSelectNode = (node: NetworkNode | null) => {
    onSelectNode(node);
    if (node && activeSidePanel === 'analytics') {
      setActiveSidePanel('details');
    }
  };

  const renderSidePanelContent = () => {
    switch (activeSidePanel) {
      case 'details':
        return (
          <motion.div 
            key="details-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full"
          >
            {selectedNode ? (
              <NodeDetails 
                node={selectedNode} 
                nodes={simulationState.nodes}
                events={simulationState.events}
                links={simulationState.links}
                onIsolate={simulationActions.isolateNode}
                onClose={() => handleSelectNode(null)} 
                onViewAI={() => setActiveSidePanel('ai')}
                isPanel={true}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-void/30 border border-dashed border-border rounded-sm group">
                <ActivityIcon className="w-12 h-12 text-text-tertiary opacity-20 mb-6 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">
                  Select target node to stream <span className="text-accent-cyan">Telemetry_Diagnostics</span>
                </p>
              </div>
            )}
          </motion.div>
        );
      case 'ai':
        return (
          <motion.div 
            key="ai-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4"
          >
            <AIIntelligencePanel 
              selectedNode={selectedNode}
              allNodes={simulationState.nodes}
              allLinks={simulationState.links}
              knowledgeBase={simulationState.knowledgeBase}
              defenseRecommendations={simulationState.defenseRecommendations}
            />
          </motion.div>
        );
      case 'defense':
        return (
          <motion.div 
            key="defense-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4"
          >
            <AutonomousDefensePanel 
              recommendations={simulationState.defenseRecommendations}
              onApplyAction={simulationActions.applyDefenseRecommendation}
              onDismissAction={simulationActions.dismissDefenseRecommendation}
            />
          </motion.div>
        );
      case 'identity':
        return (
          <motion.div 
            key="identity-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4"
          >
            <IdentityIntelligence 
              state={simulationState}
              onHighlightIdentity={(id) => {
                if (id) {
                  const identity = simulationState.identities.find(i => i.id === id);
                  if (identity && identity.accessibleNodes.length > 0) {
                    setHighlightedNodeId(identity.accessibleNodes[0]);
                  }
                } else {
                  setHighlightedNodeId(null);
                }
              }}
            />
          </motion.div>
        );
      case 'intelligence':
        return (
          <motion.div 
            key="intelligence-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4"
          >
            <IntelligenceHub state={simulationState} />
          </motion.div>
        );
      case 'ops':
        return (
          <motion.div 
            key="ops-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4"
          >
            <AIOperationsCenter state={simulationState} />
          </motion.div>
        );
      case 'twin':
        return (
          <motion.div 
            key="twin-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4 overflow-y-auto custom-scrollbar"
          >
            <DigitalTwinDashboard onHighlightNode={setHighlightedNodeId} />
          </motion.div>
        );
      case 'analytics':
      default:
        return (
          <motion.div 
            key="analytics-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-full p-4"
          >
            <AnalyticsPanel 
              nodes={simulationState.nodes}
              links={simulationState.links}
            />
          </motion.div>
        );
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] bg-void flex flex-col overflow-hidden font-sans"
    >
      <nav className="h-14 border-b border-border bg-panel/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="w-5 h-5 text-accent-cyan transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-accent-cyan/20 blur-md rounded-full animate-pulse-precision" />
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-[13px] tracking-tight text-white leading-tight">
                SENTINEL<span className="text-accent-cyan">X</span>
              </div>
              <div className="text-[8px] font-mono text-text-tertiary tracking-[0.2em] uppercase">Enterprise Ops v4.0</div>
            </div>
          </div>

          <div className="h-4 w-px bg-border-bright/20" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-void/50 border border-border rounded-sm">
              <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-state-safe shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-state-danger")} />
              <span className="font-mono text-[9px] tracking-wider text-text-secondary uppercase">
                {isOnline ? 'Network_Sync: Active' : 'Network_Sync: Internal_Only'}
              </span>
            </div>
            
            <div className="hidden lg:flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider">Session Key</span>
                  <span className="text-[9px] font-mono text-text-secondary">0xFD29..A4B1</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider">Latency</span>
                  <span className="text-[9px] font-mono text-state-safe">14.2ms</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowVisualSettings(!showVisualSettings)}
             className={cn(
               "precision-button flex items-center gap-2",
               showVisualSettings ? "border-accent-cyan text-accent-cyan bg-accent-cyan/5" : "text-text-secondary"
             )}
           >
             <Settings size={12} />
             Visual_Config
           </button>
           <button 
             onClick={onOpenManual}
             className="precision-button text-text-secondary flex items-center gap-2"
           >
             <HelpCircle size={12} />
             Guide
           </button>
           <button 
              onClick={() => setShowSOC(true)}
              className="precision-button border-accent-blue/30 text-accent-blue hover:text-white hover:bg-accent-blue/10 flex items-center gap-2"
            >
              <Layout size={12} />
              Command_Center
            </button>
           <button 
             onClick={onExit}
             className="precision-button border-state-danger/30 text-state-danger hover:bg-state-danger/10 flex items-center gap-2"
           >
             <LogOut size={12} />
             Disconnect
           </button>
        </div>
      </nav>

      <ThreatBanner level={simulationState.threatLevel} />

      <div className="flex-1 flex overflow-hidden">
        {/* Command Side */}
        <div className="w-[420px] border-r border-border bg-surface flex flex-col overflow-hidden relative shadow-2xl z-20">
           <div className="p-6 border-b border-border bg-panel/20">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Live Intelligence Metrics</h2>
                 <span className="text-[9px] font-mono text-accent-cyan opacity-50">SYNC_OK</span>
              </div>
              <MetricsPanel metrics={simulationState.metrics} threatLevel={simulationState.threatLevel} />
           </div>
           
           <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-10">
              <section>
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
                    spreadVelocity={simulationState.spreadVelocity}
                    onSetSpreadVelocity={simulationActions.setSpreadVelocity}
                    isSimulating={simulationState.isSimulating}
                    onToggleSimulation={simulationActions.toggleSimulation}
                 />
              </section>
              
              <section className="pt-4 border-t border-border/50">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Operational Ledger</h3>
                    <div className="flex gap-2">
                       <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse" />
                       <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse [animation-delay:0.2s]" />
                    </div>
                 </div>
                 <EventPanel events={simulationState.events} />
              </section>
           </div>

           {/* Console Footer */}
           <div className="h-10 px-6 border-t border-border bg-void/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <span className="text-[8px] font-mono text-state-safe uppercase">CPU: 12%</span>
                 <span className="text-[8px] font-mono text-text-tertiary uppercase">RAM: 4.2GB</span>
              </div>
              <div className="text-[8px] font-mono text-text-tertiary">0x7F...9A2C</div>
           </div>
        </div>

        {/* Battlespace Visualization */}
        <div className="flex-1 relative bg-void overflow-hidden flex">
           <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 cyber-grid opacity-20" />
              
              <div className="absolute top-10 left-10 z-10 flex flex-col gap-2 pointer-events-none">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-accent-cyan/50" />
                    <span className="text-[10px] font-bold tracking-[0.4em] text-text-secondary uppercase">Spatial_Topology_Alpha</span>
                 </div>
                 <div className="text-[8px] font-mono text-text-tertiary uppercase ml-12">Cluster ID: SENTINEL_MESH_01</div>
              </div>

              <NetworkGraph 
                  nodes={simulationState.nodes}
                  links={simulationState.links}
                  onNodeClick={handleSelectNode}
                  selectedNodeId={selectedNode?.id}
                  showHeatmap={showHeatmap}
                  highlightedNodeId={highlightedNodeId}
                  highlightedPaths={criticalPaths}
                  visualSettings={visualSettings}
                />

                {/* Visual Settings Overlay */}
                <AnimatePresence>
                  {showVisualSettings && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute top-20 right-8 z-30 w-64"
                    >
                       <VisualControlPanel 
                          settings={visualSettings} 
                          onChange={setVisualSettings} 
                       />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI HUD Overlay - Refined for precision */}
                <div className="absolute bottom-8 right-8 flex gap-8 items-end pointer-events-none">
                   <div className="flex flex-col items-end gap-1.5 translate-y-[-2px]">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-3 bg-accent-cyan/40" />
                        <span className="font-mono text-[8px] tracking-[0.2em] text-accent-cyan/60 uppercase">Telemetry_Flux: 2.1kb/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-3 bg-accent-blue/40" />
                        <span className="font-mono text-[8px] tracking-[0.2em] text-accent-blue/60 uppercase">Heuristic_Load: 31%</span>
                      </div>
                   </div>
                   
                   <div className="w-px h-12 bg-border-bright/20" />
                   
                   <div className="flex flex-col items-end gap-1 text-right">
                      <div className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Node_Health_Index</div>
                      <div className="flex gap-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className={cn(
                            "w-1 h-3 rounded-full transition-all",
                            i < 9 ? "bg-state-safe/30" : i < 11 ? "bg-state-warning/30" : "bg-state-danger/30 animate-pulse"
                          )} />
                        ))}
                      </div>
                   </div>
                </div>
           </div>

           {/* Integrated side panel (Details / AI / Analytics / Defense) */}
           <AnimatePresence>
             {activeSidePanel && (
               <motion.div 
                 key="side-panel"
                 initial={{ x: 450, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: 450, opacity: 0 }}
                 className="w-[440px] border-l border-border bg-surface h-full z-10 relative shadow-2xl flex flex-col"
               >
                 {/* Panel Selector Tabs - Enterprise Style */}
                  <div className="flex bg-void/50 p-1 m-6 rounded-sm border border-border">
                    {[
                      { id: 'twin', label: 'Twin_Range' },
                      { id: 'details', label: 'Telemetry', alert: selectedNode?.status === 'compromised' },
                      { id: 'ai', label: 'AI_Intel', alert: selectedNode?.status === 'compromised' },
                      { id: 'ops', label: 'AI_Ops' },
                      { id: 'identity', label: 'Identity' },
                      { id: 'intelligence', label: 'Intel' },
                      { id: 'analytics', label: 'Analytics' },
                      { id: 'defense', label: 'Defense', alert: simulationState.defenseRecommendations.filter(r => r.status === 'pending').length > 0 }
                    ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveSidePanel(tab.id as any)}
                        className={cn(
                          "flex-1 py-1.5 text-[9px] font-bold tracking-[2px] uppercase transition-all relative",
                          activeSidePanel === tab.id 
                            ? "bg-accent-cyan/10 text-accent-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)] border-b border-accent-cyan" 
                            : "text-text-tertiary hover:text-text-primary"
                        )}
                      >
                        {tab.label}
                        {tab.alert && activeSidePanel !== tab.id && (
                          <span className="absolute top-1 right-1.5 w-1 h-1 bg-accent-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
                        )}
                      </button>
                    ))}
                 </div>

                 <div className="flex-1 min-h-0">
                    <AnimatePresence mode="wait">
                      {renderSidePanelContent()}
                    </AnimatePresence>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </motion.div>
    
    <AnimatePresence>
      {showSOC && (
        <SOCDashboard 
          incidents={simulationState.incidents}
          onUpdateIncidentStatus={simulationActions.updateIncidentStatus}
          onAddIncidentNote={simulationActions.addIncidentNote}
          onClose={() => setShowSOC(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
