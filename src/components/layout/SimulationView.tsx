import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Network, LogOut, HelpCircle, Settings, Layout, Zap, BrainCircuit, 
  Activity as ActivityIcon, Maximize2, Minimize2, Filter, Clock, Compass, 
  Crosshair, Key, WifiOff, Terminal, Lock, ShieldAlert, ShieldCheck 
} from 'lucide-react';
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
    orchestrateDefense?: (action: string, targetId?: string) => void;
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

  // State Extensions
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIncidentFocusMode, setIsIncidentFocusMode] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [showCommunicationInstability, setShowCommunicationInstability] = useState(false);

  // UTC Ticking Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setUtcTime(d.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const engine = useMemo(() => new GraphIntelligenceEngine(simulationState.nodes, simulationState.links), [simulationState.nodes, simulationState.links]);
  const criticalPaths = useMemo(() => engine.findCriticalAttackPaths().map(p => p.path), [engine]);

  // Integrated Tactical Metrics Calculations
  const dynamicLatency = useMemo(() => {
    const defaultLat = 14.2;
    const compromisedCount = simulationState.nodes.filter(n => n.status === 'compromised').length;
    const degradedCount = simulationState.nodes.filter(n => n.status === 'degraded').length;
    return (defaultLat + (compromisedCount * 128.5) + (degradedCount * 42.1)).toFixed(1);
  }, [simulationState.nodes]);

  const securityPostureIndex = useMemo(() => {
    const total = simulationState.nodes.length;
    const compromised = simulationState.nodes.filter(n => n.status === 'compromised').length;
    const degraded = simulationState.nodes.filter(n => n.status === 'degraded').length;
    if (total === 0) return 100;
    const score = ((total - compromised - (degraded * 0.4)) / total) * 100;
    return Math.max(0, Math.floor(score));
  }, [simulationState.nodes]);

  const platformIntegrity = useMemo(() => {
    const total = simulationState.nodes.length;
    if (total === 0) return '100.0';
    const highThreatQty = simulationState.nodes.filter(n => n.threatScore > 50).length;
    return Math.max(12, 100 - (highThreatQty * 8.5)).toFixed(1);
  }, [simulationState.nodes]);

  // Nodes Filtration for Triage Focus Mode
  const filteredNodes = useMemo(() => {
    if (!isIncidentFocusMode) return simulationState.nodes;
    
    const activeThreatIds = new Set(
      simulationState.nodes
        .filter(n => n.status === 'compromised' || n.status === 'quarantined' || n.status === 'degraded' || n.threatScore > 0)
        .map(n => n.id)
    );
    
    // Include immediate connected neighbors
    simulationState.links.forEach(l => {
      const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      if (activeThreatIds.has(srcId)) activeThreatIds.add(tgtId);
      if (activeThreatIds.has(tgtId)) activeThreatIds.add(srcId);
    });

    if (activeThreatIds.size === 0) return simulationState.nodes;

    return simulationState.nodes.map(n => {
      if (activeThreatIds.has(n.id)) return n;
      return { ...n, isDimmed: true };
    });
  }, [simulationState.nodes, simulationState.links, isIncidentFocusMode]);

  const handleSelectNode = (node: NetworkNode | null) => {
    onSelectNode(node);
    if (node) {
      // Auto-disclose details tab
      if (activeSidePanel === 'analytics' || activeSidePanel === 'twin') {
        setActiveSidePanel('details');
      }
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
      className="fixed inset-0 z-[150] bg-void flex flex-col overflow-hidden font-sans select-none"
    >
      {/* Dynamic Elite Operational Status Bar */}
      <nav className="h-14 border-b border-border bg-panel/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onExit}>
            <div className="relative">
              <Shield className="w-5 h-5 text-accent-cyan transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-accent-cyan/20 blur-md rounded-full animate-pulse-precision" />
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-[13px] tracking-[0.12em] text-white leading-tight uppercase font-sans">
                SENTINEL<span className="text-accent-cyan">X</span>
              </div>
              <div className="text-[7.5px] font-mono text-text-tertiary tracking-[0.2em] uppercase leading-none">Command Grid v4.1</div>
            </div>
          </div>

          <div className="h-4 w-px bg-border-bright/20" />

          {/* Core Telemetry Indicators */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-void/50 border border-border/80 rounded-sm">
              <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-state-safe shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-state-danger")} />
              <span className="font-mono text-[9px] tracking-wider text-text-secondary uppercase">
                {isOnline ? 'Network_Sync: Online' : 'Network_Sync: Standby'}
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-5">
               <div className="flex flex-col">
                  <span className="text-[7.5px] text-text-tertiary font-bold uppercase tracking-wider">SECURE SCORE</span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold leading-tight",
                    securityPostureIndex > 80 ? "text-state-safe" : securityPostureIndex > 50 ? "text-state-warning" : "text-state-danger animate-pulse"
                  )}>{securityPostureIndex}%</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[7.5px] text-text-tertiary font-bold uppercase tracking-wider">INTEGRITY</span>
                  <span className="text-[10px] font-mono font-bold text-accent-cyan leading-tight">{platformIntegrity}%</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[7.5px] text-text-tertiary font-bold uppercase tracking-wider">LATENCY</span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold leading-tight",
                    Number(dynamicLatency) > 100 ? "text-rose-400 font-extrabold" : "text-state-safe"
                  )}>{dynamicLatency}ms</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[7.5px] text-text-tertiary font-bold uppercase tracking-wider">OPERATIONAL CLOCK UTC</span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-text-primary leading-tight">
                    <Clock size={10} className="text-accent-cyan opacity-80" />
                    <span>{utcTime || 'SYNCHRONIZING...'}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Premium Control Center Controls */}
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsIncidentFocusMode(!isIncidentFocusMode)}
             className={cn(
               "precision-button flex items-center gap-2 transition-all duration-300",
               isIncidentFocusMode 
                 ? "border-rose-500/60 text-rose-400 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse" 
                 : "text-text-secondary"
             )}
             title="Toggle Incident Response Focus Mode: Fades secure node groups to emphasize threatened elements."
           >
             <Filter size={11} className={isIncidentFocusMode ? "text-rose-400" : ""} />
             <span className="text-[9px] font-mono font-bold tracking-wider font-mono">INCIDENT_FOCUS: {isIncidentFocusMode ? 'ACTIVE' : 'MUTED'}</span>
           </button>

           <div className="w-px h-4 bg-border/40" />

           <button 
             onClick={() => setIsFullscreen(!isFullscreen)}
             className={cn(
               "precision-button flex items-center gap-2",
               isFullscreen ? "border-accent-cyan text-accent-cyan bg-accent-cyan/5" : "text-text-secondary"
             )}
             title="Toggle immersive Fullscreen Battlespace mode."
           >
             {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
             <span className="text-[9px] font-mono font-bold tracking-wider font-mono">{isFullscreen ? 'COLLAPSE' : 'FULLSCREEN'}</span>
           </button>

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
        {/* Command Side - Dynamic Progressive Disclosure Layout */}
        <AnimatePresence>
          {!isFullscreen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="border-r border-border bg-surface flex flex-col overflow-hidden relative shadow-2xl z-20 shrink-0"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battlespace Visualization */}
        <div className="flex-1 relative bg-void overflow-hidden flex font-sans">
           <div className="flex-1 relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
              
              {/* Header Label inside Visualization */}
              <div className="absolute top-8 left-8 z-10 flex flex-col gap-1.5 pointer-events-none">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-accent-cyan/50" />
                    <span className="text-[10px] font-bold tracking-[0.4em] text-text-secondary uppercase">Spatial_Topology_Alpha</span>
                 </div>
                 <div className="text-[8px] font-mono text-text-tertiary uppercase ml-12">Cluster ID: SENTINEL_MESH_01</div>
              </div>

              {/* Bento Radar Minimap Grid */}
              <div className="absolute top-20 left-8 z-10 p-3 bg-void/90 border border-border/80 backdrop-blur-md rounded-sm flex flex-col gap-2 min-w-[155px] pointer-events-auto shadow-xl">
                <div className="flex items-center gap-1">
                  <Compass size={11} className="text-accent-cyan opacity-80" />
                  <span className="text-[8px] font-bold text-text-tertiary tracking-widest uppercase font-mono">RADAR SUMMARY</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-state-safe" />
                      <span className="text-[8px] font-mono font-bold text-text-secondary uppercase">Healthy</span>
                    </div>
                    <span className="text-[8.5px] font-mono font-bold text-white">
                      {simulationState.nodes.filter(n => n.status === 'safe').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[8px] font-mono font-bold text-text-secondary uppercase">Breached</span>
                    </div>
                    <span className="text-[8.5px] font-mono font-bold text-rose-500">
                       {simulationState.nodes.filter(n => n.status === 'compromised').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[8px] font-mono font-bold text-text-secondary uppercase">Quarantine</span>
                    </div>
                    <span className="text-[8.5px] font-mono font-bold text-amber-500">
                      {simulationState.nodes.filter(n => n.status === 'quarantined').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                      <span className="text-[8px] font-mono font-bold text-text-secondary uppercase">Degraded</span>
                    </div>
                    <span className="text-[8.5px] font-mono font-bold text-rose-300">
                      {simulationState.nodes.filter(n => n.status === 'degraded').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* TACTICAL TELEMETRY LAYERS */}
              <div className="absolute top-[185px] left-8 z-10 p-3 bg-void/90 border border-border/80 backdrop-blur-md rounded-sm flex flex-col gap-2 min-w-[155px] pointer-events-auto shadow-xl">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-accent-cyan rounded-full animate-ping" />
                  <span className="text-[8px] font-bold text-text-tertiary tracking-widest uppercase font-mono">TACTICAL LAYERS</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {/* Heatmap Layer */}
                  <button 
                    onClick={onToggleHeatmap}
                    className={cn(
                      "w-full flex items-center justify-between text-[8px] font-mono font-bold py-1 px-1.5 border rounded-sm transition-all",
                      showHeatmap 
                        ? "bg-state-danger/15 border-state-danger/60 text-state-danger shadow-[0_0_8px_rgba(239,68,68,0.2)]" 
                        : "bg-void/50 border-white/5 text-text-secondary hover:border-white/15"
                    )}
                  >
                    <span>RISK_HEATMAP</span>
                    <span className="text-[7.5px] opacity-75">{showHeatmap ? "ON" : "OFF"}</span>
                  </button>

                  {/* Trust Segmentation Boundaries */}
                  <button 
                    onClick={() => setShowSegmentation(!showSegmentation)}
                    className={cn(
                      "w-full flex items-center justify-between text-[8px] font-mono font-bold py-1 px-1.5 border rounded-sm transition-all",
                      showSegmentation 
                        ? "bg-accent-cyan/15 border-accent-cyan/60 text-accent-cyan shadow-[0_0_8px_rgba(0,255,209,0.2)]" 
                        : "bg-void/50 border-white/5 text-text-secondary hover:border-white/15"
                    )}
                  >
                    <span>SEC_SEGMENT</span>
                    <span className="text-[7.5px] opacity-75">{showSegmentation ? "ON" : "OFF"}</span>
                  </button>

                  {/* Communication Instability */}
                  <button 
                    onClick={() => setShowCommunicationInstability(!showCommunicationInstability)}
                    className={cn(
                      "w-full flex items-center justify-between text-[8px] font-mono font-bold py-1 px-1.5 border rounded-sm transition-all",
                      showCommunicationInstability 
                        ? "bg-state-warning/15 border-state-warning/60 text-state-warning shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                        : "bg-void/50 border-white/5 text-text-secondary hover:border-white/15"
                    )}
                  >
                    <span>LATENCY_JITTER</span>
                    <span className="text-[7.5px] opacity-75">{showCommunicationInstability ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>

              {/* The Core Visualization Diagram Component */}
              <div className="flex-1 relative">
                <NetworkGraph 
                  nodes={filteredNodes}
                  links={simulationState.links}
                  onNodeClick={handleSelectNode}
                  selectedNodeId={selectedNode?.id}
                  showHeatmap={showHeatmap}
                  showSegmentation={showSegmentation}
                  showCommunicationInstability={showCommunicationInstability}
                  highlightedNodeId={highlightedNodeId}
                  highlightedPaths={criticalPaths}
                  visualSettings={visualSettings}
                />
              </div>

              {/* Dynamic Interactive Tactical Command Menu Dial (Shows on Node Select) */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-void/90 backdrop-blur-md border border-accent-cyan/40 p-3 rounded-md shadow-2xl flex items-center gap-4 pointer-events-auto max-w-[90%] md:max-w-2xl"
                  >
                    <div className="flex flex-col border-r border-border/60 pr-4 shrink-0">
                      <span className="text-[7px] font-mono text-accent-cyan tracking-widest uppercase">TACTICAL OPERATIONS</span>
                      <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px] font-sans">{selectedNode.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { action: 'quarantine_workload', label: 'Quarantine', icon: ShieldAlert, color: 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10' },
                        { action: 'terminate_process', label: 'Kill Process', icon: Terminal, color: 'text-rose-400 border-rose-400/30 hover:bg-rose-400/10' },
                        { action: 'rotate_credentials', label: 'Rotate Secrets', icon: Key, color: 'text-sky-400 border-sky-400/30 hover:bg-sky-400/10' },
                        { action: 'block_traffic', label: 'Drop Traffic', icon: WifiOff, color: 'text-red-400 border-red-400/30 hover:bg-red-400/10' },
                        { action: 'isolate_node', label: 'Isolate Route', icon: Shield, color: 'text-slate-300 border-slate-500/30 hover:bg-slate-500/10' },
                        { action: 'increase_monitoring', label: 'Escalate Logs', icon: ActivityIcon, color: 'text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10' },
                      ].map((item) => (
                        <button
                          key={item.action}
                          onClick={() => {
                            if (simulationActions.orchestrateDefense) {
                              simulationActions.orchestrateDefense(item.action, selectedNode.id);
                            } else {
                              simulationActions.isolateNode(selectedNode.id);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 text-[8.5px] font-mono font-bold uppercase border rounded-sm transition-all",
                            item.color
                          )}
                        >
                          <item.icon size={11} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visual Settings Overlay */}
              <AnimatePresence>
                {showVisualSettings && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-20 right-8 z-30 w-64 pointer-events-auto"
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
                      <span className="w-1 h-3 bg-accent-cyan/15" />
                      <span className="font-mono text-[8px] tracking-[0.2em] text-accent-cyan/60 uppercase">Telemetry_Flux: 2.1kb/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-3 bg-accent-blue/15" />
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

           {/* Integrated Drawer / Side Panel with Progressive detail disclosure */}
           <AnimatePresence>
             {activeSidePanel && (
              <motion.div 
                key="side-panel"
                initial={{ x: 450, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 450, opacity: 0 }}
                className="w-[440px] border-l border-border bg-surface h-full z-10 relative shadow-2xl flex flex-col shrink-0"
              >
                {/* Panel Selector Tabs - Enterprise Style */}
                 <div className="flex bg-void/50 p-1 m-6 rounded-sm border border-border pb-1 shrink-0">
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
                         "flex-1 py-1.5 text-[8px] font-bold tracking-[1px] uppercase transition-all relative",
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
