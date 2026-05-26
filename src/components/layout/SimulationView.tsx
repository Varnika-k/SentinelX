import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { telemetryBus } from '../../telemetry/bus';
import { TelemetryTopic } from '../../telemetry/schemas';
import { ReplayEngine, ReplayStatus } from '../../telemetry/replay';
import { 
  Shield, Network, LogOut, HelpCircle, Settings, Layout, Zap, BrainCircuit, 
  Activity as ActivityIcon, Maximize2, Minimize2, Filter, Clock, Compass, 
  Crosshair, Key, WifiOff, Terminal, Lock, ShieldAlert, ShieldCheck, LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NetworkNode } from '../../types/network';
import { SimulationState } from '../../types/simulation';
import { NetworkGraph } from '../viz/NetworkGraph';
import { AttackTimeline } from './AttackTimeline';
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
    setDefenseStrategyMode?: (mode: 'balanced' | 'aggressive' | 'forensics' | 'resilience') => void;
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
  operatorRole?: string;
  activeTenant?: string;
  onEscalateRole?: (role: string) => void;
}

export function SimulationView({
  simulationState,
  isOnline,
  operatorRole = 'Administrator',
  activeTenant = 'CORE_INTEL_US_EAST',
  onEscalateRole,
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
  const [activeWorkspace, setActiveWorkspace] = useState<'operations' | 'forensics' | 'defense' | 'twin' | 'ai'>('operations');
  const [activeNodeTab, setActiveNodeTab] = useState<'details' | 'ai' | 'analytics'>('details');
  const [activeSidePanel, setActiveSidePanel] = useState<'details' | 'ai' | 'analytics' | 'defense' | 'identity' | 'intelligence' | 'ops' | 'twin'>('twin');
  const [showSOC, setShowSOC] = useState(false);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>({
    intensity: 1,
    speed: 1,
    glow: 1,
    heatmapOpacity: 0.15,
    pulseFrequency: 1,
    collisionRadius: 25,
    graphForce: -120
  });

  // State Extensions
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIncidentFocusMode, setIsIncidentFocusMode] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [showCommunicationInstability, setShowCommunicationInstability] = useState(false);

  const [replayStatus, setReplayStatus] = useState<ReplayStatus>(ReplayEngine.getStatus());

  useEffect(() => {
    const unsubStatus = telemetryBus.subscribe(TelemetryTopic.UI_ACTION, (env) => {
      const payload = env.payload as any;
      if (payload.action === 'REPLAY_STATUS' && payload.source === 'replay_engine') {
        setReplayStatus(payload.payload);
      }
    });
    return unsubStatus;
  }, []);

  const isHistoricalMode = useMemo(() => {
    return replayStatus.isPlaying || (replayStatus.totalEvents > 0 && replayStatus.currentIndex < replayStatus.totalEvents);
  }, [replayStatus]);

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

  // Sector integrity metrics for Strategic Situational Awareness (Infrastructure Cognition)
  const sectorWeights = useMemo(() => {
    const zones = {
      perimeter: { total: 0, compromised: 0 },
      core: { total: 0, compromised: 0 },
      app: { total: 0, compromised: 0 },
      data: { total: 0, compromised: 0 },
    };

    simulationState.nodes.forEach(node => {
      let zone: keyof typeof zones = 'app';
      if (node.id.startsWith('gw') || node.id.includes('gateway')) {
        zone = 'perimeter';
      } else if (node.id.startsWith('core') || node.id.includes('switch')) {
        zone = 'core';
      } else if (node.id.startsWith('db') || node.type === 'database') {
        zone = 'data';
      } else {
        zone = 'app';
      }
      zones[zone].total++;
      if (node.status === 'compromised' || node.status === 'degraded') {
        zones[zone].compromised++;
      }
    });

    return {
      perimeter: zones.perimeter.total > 0 ? Math.round(((zones.perimeter.total - zones.perimeter.compromised) / zones.perimeter.total) * 100) : 100,
      core: zones.core.total > 0 ? Math.round(((zones.core.total - zones.core.compromised) / zones.core.total) * 100) : 100,
      app: zones.app.total > 0 ? Math.round(((zones.app.total - zones.app.compromised) / zones.app.total) * 100) : 100,
      data: zones.data.total > 0 ? Math.round(((zones.data.total - zones.data.compromised) / zones.data.total) * 100) : 100,
    };
  }, [simulationState.nodes]);

  // Estimated Operational Cognitive survivability timeline
  const survivalTimeFrame = useMemo(() => {
    switch (simulationState.threatLevel) {
      case 'critical':
        return '02:45m - IMPENDING EXPLOIT DEGRADATION';
      case 'high':
        return '14:30m - ACTIVE LATERAL PROPAGATION';
      case 'medium':
        return '45:15m - MITIGABLE ESCALATIONS DETECTED';
      case 'low':
      default:
        return '99:00m+ - SYSTEM SYMMETRICAL HEURISTICS SECURE';
    }
  }, [simulationState.threatLevel]);

  // Replay Attack campaign path highlights
  const compromiseSequences = useMemo(() => {
    return simulationState.events
      .filter(ev => ev.severity === 'high' || ev.severity === 'critical')
      .slice(-4)
      .reverse();
  }, [simulationState.events]);

  // Dynamic offset tracking for precision viewport centering
  const { leftOffset, rightOffset } = useMemo(() => {
    if (isFullscreen) {
      return { leftOffset: 0, rightOffset: 0 };
    }
    
    let left = 0;
    let right = 0;
    
    // Left sidebar width calculations
    if (activeWorkspace === 'operations') left = 340;
    else if (activeWorkspace === 'forensics') left = 340;
    else if (activeWorkspace === 'defense') left = 340;
    else if (activeWorkspace === 'twin') left = 340;
    else if (activeWorkspace === 'ai') left = 370;
    
    // Right sidebar or overlay panel width calculations
    if (selectedNode) {
      right = 390; // Selective inspector drawer
    } else {
      if (activeWorkspace === 'twin') right = 390;
      else if (activeWorkspace === 'ai') right = 390;
      else if (activeWorkspace === 'forensics') right = 340; // top-right chronological timeline
      else if (activeWorkspace === 'defense') right = 340; // top-right containment panel card
    }
    
    return {
      leftOffset: left > 0 ? left + 24 : 16,
      rightOffset: right > 0 ? right + 24 : 16
    };
  }, [activeWorkspace, selectedNode, isFullscreen]);

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
              onHighlightNode={setHighlightedNodeId}
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
              activeStrategyMode={simulationState.defenseStrategyMode}
              onStrategyChange={simulationActions.setDefenseStrategyMode}
              containmentStability={simulationState.containmentStability}
              propagationReductionIndex={simulationState.propagationReductionIndex}
              recoveryTrackingRating={simulationState.recoveryTrackingRating}
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

          {/* Core Clearance Level & Tenant Domain info */}
          <div className="flex items-center gap-2 font-mono relative">
            <div 
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="bg-accent-cyan/15 border border-accent-cyan/35 cursor-pointer hover:bg-accent-cyan/25 px-2.5 py-1 rounded text-[8.5px] leading-tight text-accent-cyan font-bold flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,255,209,0.06)] select-none transition-all z-20"
            >
              <span className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
              <span>SEC CLEARANCE: {operatorRole.toUpperCase()}</span>
              <ChevronDown size={11} className={cn("text-accent-cyan opacity-80 transition-transform", isRoleDropdownOpen ? "rotate-180" : "rotate-0")} />
            </div>

            <AnimatePresence>
              {isRoleDropdownOpen && (
                <>
                  {/* Backdrop trap */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsRoleDropdownOpen(false)}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.98 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-panel/95 border border-accent-cyan/30 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-1 z-30 backdrop-blur-lg"
                  >
                    <div className="px-2 py-1 border-b border-border/20 mb-1 text-[7px] text-text-tertiary tracking-widest font-black uppercase">
                      SELECT DEPLOYMENT POSTURE (RBAC)
                    </div>
                    {[
                      {
                        name: 'Administrator',
                        desc: 'Full command and control authorization root clearance.'
                      },
                      {
                        name: 'Security Analyst',
                        desc: 'Active monitoring and lateral analysis clearance level.'
                      },
                      {
                        name: 'Incident Commander',
                        desc: 'Tactical response, escalation, and containment control.'
                      },
                      {
                        name: 'Forensic Investigator',
                        desc: 'Temporal freeze, telemetry query & raw log inspector.'
                      }
                    ].map((role) => (
                      <button
                        key={role.name}
                        onClick={() => {
                          onEscalateRole?.(role.name);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded flex flex-col gap-0.5 hover:bg-white/5 transition-colors group",
                          operatorRole === role.name ? "bg-accent-cyan/10 border-l border-accent-cyan" : "border-l border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[8.5px] font-bold tracking-wider",
                            operatorRole === role.name ? "text-accent-cyan" : "text-white group-hover:text-accent-cyan"
                          )}>
                            {role.name.toUpperCase()}
                          </span>
                          {operatorRole === role.name && (
                            <span className="text-[7px] px-1 bg-accent-cyan/20 text-accent-cyan rounded border border-accent-cyan/30 font-bold whitespace-nowrap">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[6.5px] font-mono text-text-secondary leading-normal normal-case">
                          {role.desc}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[8.5px] leading-tight text-white/70 select-none">
              TENANT: <span className="text-white font-bold">{activeTenant}</span>
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

      {isHistoricalMode && (
        <div className="bg-amber-950/25 border-b border-amber-500/35 px-6 py-2 flex items-center justify-between text-xs font-mono text-amber-400 select-none animate-pulse z-40 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30">HISTORICAL WORKLOAD RECONSTRUCTION WORKING</span>
              <span className="text-[9.5px] opacity-80">Telemetry flow suspended • Simulation mutations isolated</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px]">
              <span className="text-text-tertiary font-bold">SEQUENCE_INDEX:</span>
              <span className="text-white font-extrabold">{replayStatus.currentIndex} / {replayStatus.totalEvents}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px]">
              <span className="text-text-tertiary font-bold">TEMPORAL_CAPSULE:</span>
              <span className="text-accent-cyan font-bold leading-none">
                {simulationState.events[replayStatus.currentIndex - 1]?.timestamp 
                  ? new Date(simulationState.events[replayStatus.currentIndex - 1].timestamp).toUTCString().replace('GMT', 'UTC')
                  : 'BOOT_STATE_RECORD'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px]">
              <span className="text-text-tertiary">INFRA_INTEGRITY:</span>
              <span className="text-rose-400 font-bold">{platformIntegrity}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ELITE OPERATIONAL WORKSPACE SWITCHER */}
      <div className="h-11 border-b border-border bg-panel/30 flex items-center justify-between px-6 shrink-0 relative z-40">
        <div className="flex items-center gap-1 h-full">
          {[
            { id: 'operations', label: 'OPERATIONS MAP', icon: Network },
            { id: 'forensics', label: 'INCIDENT & FORENSIC', icon: Clock },
            { id: 'defense', label: 'DEFENSE ORCHESTRATION', icon: Shield },
            { id: 'twin', label: 'DIGITAL TWIN LAB', icon: Zap },
            { id: 'ai', label: 'AI INTELLIGENCE', icon: BrainCircuit }
          ].map((ws) => {
            const Icon = ws.icon;
            const isActive = activeWorkspace === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id as any);
                  onSelectNode(null); // Reset detail selections for workspaces cleaner transition
                }}
                className={cn(
                  "flex items-center gap-2 px-4 h-full text-[9px] font-mono tracking-widest font-bold uppercase transition-all relative border-r border-border/10",
                  isActive 
                    ? "text-accent-cyan bg-accent-cyan/10 shadow-[inner_0_0_12px_rgba(0,255,209,0.05)] font-black" 
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <Icon size={12} />
                <span>{ws.label}</span>
                {isActive && (
                  <motion.span 
                    layoutId="activeWorkspaceBorder" 
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-cyan shadow-[0_0_8px_#00FFD1]" 
                  />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-4 text-[9px] font-mono">
          <div className="flex items-center gap-1.5 bg-black/40 border border-border/80 px-3 py-1 rounded">
            <span className="text-text-tertiary">DOMAIN:</span>
            <span className="text-white font-extrabold uppercase tracking-widest">{activeWorkspace}_domain</span>
          </div>
        </div>
      </div>

      {/* WORKSPACE ROUTING VIEW */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Dynamic Left Sidebar Overlay Panel */}
        <AnimatePresence mode="wait">
          {!isFullscreen && (
            <motion.div 
              key={`left-sidebar-${activeWorkspace}`}
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={cn(
                "absolute left-6 top-6 transition-all duration-300 border border-white/5 bg-[#05070f]/75 backdrop-blur-md flex flex-col overflow-hidden rounded-md shadow-2xl z-25",
                activeWorkspace === 'forensics' ? "bottom-[295px]" : "bottom-6",
                activeWorkspace === 'ai' ? "w-[370px]" : "w-[340px]"
              )}
            >
              {activeWorkspace === 'operations' && (
                <>
                   <div className="p-5 border-b border-border bg-panel/10">
                      <div className="flex items-center justify-between mb-3">
                         <h2 className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Operational Status</h2>
                         <span className="text-[8px] font-mono text-state-safe">SYNC_OK</span>
                      </div>
                      <div className="text-[14px] font-mono font-bold text-white mb-2 uppercase tracking-wide">
                        Live Telemetry Stream
                      </div>
                      <p className="text-[9.5px] text-text-secondary leading-relaxed mb-1">
                        Real-time visual node matrix mapping live threat scenarios, latency metrics, and trust boundary segmentations.
                      </p>
                   </div>
                   
                   <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-6">
                      <section>
                         <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[8.5px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Active Incidents</h3>
                            <span className="w-1.5 h-1.5 rounded-full bg-state-danger animate-pulse" />
                         </div>
                         <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                           {simulationState.incidents.filter(i => i.status !== 'resolved').slice(0, 4).map(inc => {
                             const targetNode = simulationState.nodes.find(n => n.id === inc.affectedNodeIds[0]);
                             const targetNodeLabel = targetNode ? targetNode.label : 'N/A';
                             return (
                               <div key={inc.id} className="p-2 border border-border bg-void/50 rounded-sm flex flex-col gap-1 hover:border-border-bright transition-all">
                                 <div className="flex items-center justify-between">
                                   <span className="text-[8.5px] font-mono text-state-danger-bright font-black">[{inc.severity.toUpperCase()}]</span>
                                   <span className="text-[8px] font-mono text-text-tertiary">{new Date(inc.detectionTime).toLocaleTimeString()}</span>
                                 </div>
                                 <div className="text-[9px] text-white font-bold leading-none truncate uppercase">{inc.title}</div>
                                 <div className="text-[8px] text-text-secondary truncate">{targetNodeLabel} • {inc.attackType}</div>
                               </div>
                             );
                           })}
                           {simulationState.incidents.filter(i => i.status !== 'resolved').length === 0 && (
                             <div className="text-[9px] text-text-tertiary italic text-center py-4 border border-dashed border-border rounded">No active incidents detected. SYSTEM_SECURE.</div>
                           )}
                         </div>
                      </section>

                      <section className="pt-4 border-t border-border/50">
                         <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[8.5px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Ledger Stream</h3>
                            <div className="flex gap-1">
                               <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse" />
                               <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse [animation-delay:0.2s]" />
                            </div>
                         </div>
                         <EventPanel events={simulationState.events} />
                      </section>
                   </div>

                   {/* Console Footer */}
                   <div className="h-10 px-5 border-t border-border bg-void/50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                         <span className="text-[8px] font-mono text-state-safe uppercase">CPU: 12%</span>
                         <span className="text-[8px] font-mono text-text-tertiary uppercase">RAM: 4.2GB</span>
                      </div>
                      <div className="text-[8px] font-mono text-text-tertiary">0x7F...9A2C</div>
                   </div>
                </>
              )}

              {activeWorkspace === 'forensics' && (
                <>
                  <div className="p-5 border-b border-border bg-panel/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-amber-500 animate-pulse mt-0.5" />
                      <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Forensic Timeline Logger</h2>
                    </div>
                    <p className="text-[9.5px] text-text-secondary leading-relaxed">
                      Historical breach auditing, scenario replays, and incident note-taking. Select an attack sequence below to inspect.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider mb-2">SECURITY BREACH ARCHIVES</div>
                      {simulationState.incidents.map((inc) => {
                        const targetNodeId = inc.affectedNodeIds?.[0];
                        const targetNode = simulationState.nodes.find(n => n.id === targetNodeId);
                        const targetNodeLabel = targetNode ? targetNode.label : 'N/A';
                        return (
                          <div 
                            key={inc.id}
                            onClick={() => {
                              if (targetNodeId && targetNode) {
                                handleSelectNode(targetNode);
                              }
                            }}
                            className={cn(
                              "p-3 border rounded-sm flex flex-col gap-2 transition-all cursor-pointer",
                              inc.severity === 'critical' ? 'border-red-500/30 bg-red-950/20' : 
                              inc.severity === 'high' ? 'border-amber-500/30 bg-amber-950/20' : 'border-border bg-panel/10',
                              selectedNode?.id === targetNodeId ? 'border-accent-cyan ring-1 ring-accent-cyan/10' : 'hover:border-border-bright'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "text-[8.5px] font-mono uppercase font-black",
                                inc.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                              )}>[{inc.severity.toUpperCase()}]</span>
                              <span className="text-[8px] font-mono text-text-tertiary">{new Date(inc.detectionTime).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-[10px] text-white font-bold uppercase tracking-tight">{inc.title}</div>
                            <div className="text-[9.5px] text-text-secondary leading-tight bg-void/50 p-1.5 border border-white/5 font-mono overflow-x-hidden text-ellipsis whitespace-nowrap">
                              TARGET: {targetNodeLabel} • STATUS: {inc.status}
                            </div>
                            
                            {inc.analystNotes && inc.analystNotes.length > 0 && (
                              <div className="border-t border-border/40 pt-1.5 mt-0.5">
                                <div className="text-[7.5px] font-mono text-accent-cyan uppercase tracking-wider mb-1">Operator Notes ({inc.analystNotes.length})</div>
                                <div className="text-[9px] text-text-secondary italic line-clamp-2">"{inc.analystNotes[inc.analystNotes.length - 1]}"</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {simulationState.incidents.length === 0 && (
                        <div className="text-center py-8 text-[10px] font-mono text-text-tertiary">
                          No security incidents registered yet.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeWorkspace === 'defense' && (
                <>
                  <div className="p-5 border-b border-border bg-panel/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={13} className="text-accent-cyan mt-0.5" />
                      <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Defense Orchestrator</h2>
                    </div>
                    <p className="text-[9.5px] text-text-secondary leading-relaxed">
                      Review, approve, and deploy autonomous threat response protocols. Configure isolation barriers below.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <AutonomousDefensePanel 
                      recommendations={simulationState.defenseRecommendations}
                      onApplyAction={simulationActions.applyDefenseRecommendation}
                      onDismissAction={simulationActions.dismissDefenseRecommendation}
                      activeStrategyMode={simulationState.defenseStrategyMode}
                      onStrategyChange={simulationActions.setDefenseStrategyMode}
                      containmentStability={simulationState.containmentStability}
                      propagationReductionIndex={simulationState.propagationReductionIndex}
                      recoveryTrackingRating={simulationState.recoveryTrackingRating}
                    />
                  </div>
                </>
              )}

              {activeWorkspace === 'twin' && (
                <>
                  <div className="p-5 border-b border-border bg-panel/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={12} className="text-amber-500 animate-pulse mt-0.5" />
                      <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Chaos Sandbox & Stress Dial</h2>
                    </div>
                    <p className="text-[9.5px] text-text-secondary leading-relaxed">
                      Simulate hostile breaches, modify system vulnerabilities, or introduce zero-day workloads inside this twin container.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <ControlPanel 
                      nodes={simulationState.nodes}
                      operatorRole={operatorRole}
                      onEscalateRole={onEscalateRole}
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
                  </div>
                </>
              )}

              {activeWorkspace === 'ai' && (
                <>
                   <div className="p-5 border-b border-border bg-panel/20 shrink-0">
                     <div className="flex items-center gap-2 mb-2">
                       <BrainCircuit size={13} className="text-accent-cyan mt-0.5" />
                       <h2 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">LLM Diagnostic Agents</h2>
                     </div>
                     <p className="text-[9.5px] text-text-secondary leading-relaxed">
                       Observe dynamic LLM consensus scores and individual reasoning loops computed globally by autonomous audit agents.
                     </p>
                   </div>
                   <div className="flex-1 overflow-hidden p-5">
                     <AIOperationsCenter state={simulationState} />
                   </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Persistent Battlespace / Graph Core - THE ENVIRONMENT ITSELF */}
        <div className="absolute inset-0 bg-void overflow-hidden flex flex-col font-sans z-0">
           <div className="absolute inset-0 cyber-grid opacity-[0.12] pointer-events-none" />
           
           {/* Horizontal Metrics Panel (Decluttered Centered HUD Positioning) */}
           <div className="px-6 pt-4 pb-1 z-10 shrink-0 max-w-4xl w-full mx-auto relative">
              <MetricsPanel metrics={simulationState.metrics} threatLevel={simulationState.threatLevel} />
           </div>

           {/* Space label inside visualization */}
           <div className={cn(
              "absolute top-[125px] z-10 flex flex-col gap-1 transition-all duration-300 pointer-events-none",
              isFullscreen ? "left-8" : "left-[370px]"
           )}>
              <div className="flex items-center gap-3">
                 <div className="w-6 h-[1px] bg-accent-cyan/40" />
                 <span className="text-[9px] font-bold tracking-[0.3em] text-text-secondary uppercase">
                    {activeWorkspace === 'operations' && 'OPERATIONAL_TOPOLOGY'}
                    {activeWorkspace === 'forensics' && 'TEMPORAL_FORENSICS_MAP'}
                    {activeWorkspace === 'defense' && 'CONTAINMENT_VECTORS'}
                    {activeWorkspace === 'twin' && 'CHAOS_SANDBOX_SIMULATION'}
                    {activeWorkspace === 'ai' && 'COGNITIVE_HEURISTICS_MAP'}
                 </span>
              </div>
           </div>

           {/* Bento Radar Minimap Grid */}
           <div className={cn(
              "absolute top-[175px] z-10 p-3 bg-[#05070f]/90 border border-white/5 backdrop-blur-md rounded-md flex flex-col gap-2 min-w-[155px] pointer-events-auto shadow-xl transition-all duration-300",
              isFullscreen ? "left-8" : "left-[370px]"
           )}>
             <div className="flex items-center gap-1">
               <Compass size={11} className="text-accent-cyan opacity-80" />
               <span className="text-[8px] font-bold text-text-tertiary tracking-widest uppercase font-mono mt-0.5">RADAR SUMMARY</span>
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
           <div className={cn(
              "absolute top-[315px] z-10 p-3 bg-[#05070f]/90 border border-white/5 backdrop-blur-md rounded-md flex flex-col gap-2 min-w-[155px] pointer-events-auto shadow-xl transition-all duration-300",
              isFullscreen ? "left-8" : "left-[370px]"
           )}>
             <div className="flex items-center gap-1">
               <span className="w-1 h-1 bg-accent-cyan rounded-full animate-ping" />
               <span className="text-[8px] font-bold text-text-tertiary tracking-widest uppercase font-mono">TACTICAL LAYERS</span>
             </div>
             <div className="space-y-1.5 pt-1">
               <button 
                 onClick={onToggleHeatmap}
                 className={cn(
                   "w-full flex items-center justify-between text-[8px] font-mono font-bold py-1 px-1.5 border rounded-sm transition-all",
                   (activeWorkspace === 'defense' || showHeatmap)
                     ? "bg-state-danger/15 border-state-danger/60 text-state-danger shadow-[0_0_8px_rgba(239,68,68,0.2)]" 
                     : "bg-void/50 border-white/5 text-text-secondary hover:border-white/15"
                 )}
               >
                 <span>RISK_HEATMAP</span>
                 <span className="text-[7.5px] opacity-75">{(activeWorkspace === 'defense' || showHeatmap) ? "ON" : "OFF"}</span>
               </button>

               <button 
                 onClick={() => setShowSegmentation(!showSegmentation)}
                 className={cn(
                   "w-full flex items-center justify-between text-[8px] font-mono font-bold py-1 px-1.5 border rounded-sm transition-all",
                   (activeWorkspace === 'defense' || showSegmentation)
                     ? "bg-accent-cyan/15 border-accent-cyan/60 text-accent-cyan shadow-[0_0_8px_rgba(0,255,209,0.2)]" 
                     : "bg-void/50 border-white/5 text-text-secondary hover:border-white/15"
               )}
             >
               <span>SEC_SEGMENT</span>
               <span className="text-[7.5px] opacity-75">{(activeWorkspace === 'defense' || showSegmentation) ? "ON" : "OFF"}</span>
             </button>

             <button 
               onClick={() => setShowCommunicationInstability(!showCommunicationInstability)}
               className={cn(
                 "w-full flex items-center justify-between text-[8px] font-mono font-bold py-1 px-1.5 border rounded-sm transition-all",
                 (activeWorkspace === 'forensics' || showCommunicationInstability)
                   ? "bg-state-warning/15 border-state-warning/60 text-state-warning shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                   : "bg-void/50 border-white/5 text-text-secondary hover:border-white/15"
               )}
             >
               <span>LATENCY_JITTER</span>
               <span className="text-[7.5px] opacity-75">{(activeWorkspace === 'forensics' || showCommunicationInstability) ? "ON" : "OFF"}</span>
             </button>
           </div>
         </div>

         {/* Core Map Graphic Container */}
         <div className="flex-1 min-h-0 relative overflow-hidden">
           {/* 1. Subtle Matrix Grid Scan Line Overlay */}
           <div className="absolute inset-0 hidden pointer-events-none z-10 bg-void" />

           {/* 2. Operational Tension Pulse layer */}
           <div 
             className={cn(
               "absolute inset-0 pointer-events-none transition-all duration-1000 z-10 rounded-sm",
               simulationState.threatLevel === 'critical' ? "shadow-[inset_0_0_120px_rgba(239,68,68,0.22)] bg-red-950/[0.03]" :
               simulationState.threatLevel === 'high' ? "shadow-[inset_0_0_80px_rgba(245,158,11,0.12)] bg-amber-950/[0.01]" :
               activeWorkspace === 'forensics' ? "shadow-[inset_0_0_100px_rgba(245,158,11,0.08)] bg-amber-950/[0.02]" : ""
             )}
           />

           {/* 3. Elite Tactical Situational HUD Overlay Panel (Operations Only) */}
           {activeWorkspace === 'operations' && (
             <div className="absolute top-4 left-4 z-20 pointer-events-none max-w-[280px] flex flex-col gap-2.5">
               {/* Sector Resilience Panel */}
               <div className="bg-[#040813]/90 border border-white/5 p-3 rounded shadow-xl pointer-events-auto backdrop-blur-md">
                 <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                   <div className="flex items-center gap-1.5">
                     <LayoutGrid size={11} className="text-accent-cyan" />
                     <span className="text-[9.5px] font-black uppercase tracking-wider text-white">INFRASTRUCTURE SECTORS</span>
                   </div>
                   <span className="text-[7.5px] font-mono text-[#5A7FA8] uppercase tracking-widest font-bold">COGNITION ON</span>
                 </div>
                 
                 <div className="space-y-2">
                   {[
                     { key: 'perimeter', label: 'PERIMETER EDGE GATEWAYS', score: sectorWeights.perimeter },
                     { key: 'core', label: 'INTERNAL ROUTER FABRIC', score: sectorWeights.core },
                     { key: 'app', label: 'WORKSTATIONS & APP CORE', score: sectorWeights.app },
                     { key: 'data', label: 'DATA REPOSITORIES', score: sectorWeights.data },
                   ].map(sector => (
                     <div key={sector.key} className="space-y-1">
                       <div className="flex justify-between items-center text-[8.5px] font-mono">
                         <span className="text-text-secondary">{sector.label}</span>
                         <span className={cn("font-bold", sector.score > 80 ? "text-state-safe" : sector.score > 40 ? "text-state-warning" : "text-state-danger")}>
                           {sector.score}%
                         </span>
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full transition-all duration-500", 
                             sector.score > 80 ? "bg-state-safe" : sector.score > 40 ? "bg-state-warning" : "bg-state-danger"
                           )}
                           style={{ width: `${sector.score}%` }}
                         />
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Systemic Survivability Predictor */}
               <div className="bg-[#040813]/90 border border-white/5 p-3 rounded shadow-xl pointer-events-auto backdrop-blur-md font-mono text-[9px] text-text-secondary leading-normal">
                 <div className="flex items-center gap-2 mb-2">
                   <ActivityIcon size={11} className="text-accent-cyan animate-pulse" />
                   <span className="text-[9.5px] font-black text-white uppercase tracking-wider">PREDICTIVE COGNITION</span>
                 </div>
                 <div className="space-y-1.5 text-[8.5px]">
                   <div className="flex justify-between">
                     <span>STRESS TIPPING FORCE:</span>
                     <span className={cn("font-extrabold", simulationState.threatLevel === 'critical' ? 'text-state-danger' : 'text-accent-cyan')}>
                       {simulationState.threatLevel === 'critical' ? 'CRITICAL LIMIT' : '0.41% NOMINAL'}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span>SURVIVABILITY CAP:</span>
                     <span className="text-white font-extrabold">{survivalTimeFrame}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>PROPAGATION SPEED:</span>
                     <span className="text-white font-extrabold uppercase">{simulationState.spreadVelocity?.toFixed(2) || '0.00'}/s LATERAL</span>
                   </div>
                 </div>
               </div>
             </div>
           )}
           <NetworkGraph 
             nodes={filteredNodes}
             links={simulationState.links}
             onNodeClick={handleSelectNode}
             selectedNodeId={selectedNode?.id}
             showHeatmap={activeWorkspace === 'defense' ? true : showHeatmap}
             showSegmentation={activeWorkspace === 'defense' ? true : showSegmentation}
             showCommunicationInstability={activeWorkspace === 'forensics' ? true : showCommunicationInstability}
             highlightedNodeId={highlightedNodeId}
             highlightedPaths={criticalPaths}
             visualSettings={visualSettings}
             isReplay={activeWorkspace === 'forensics' ? true : isHistoricalMode} leftOffset={leftOffset} rightOffset={rightOffset} activeWorkspace={activeWorkspace} threatLevel={simulationState.threatLevel}
           />
         </div>

         {/* Dynamic Interactive Tactical Command Menu Dial (Shows on Node Select) */}
         <AnimatePresence>
           {selectedNode && (
             <motion.div
               initial={{ y: 80, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 80, opacity: 0 }}
               className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-void/95 backdrop-blur-md border border-accent-cyan/40 p-3 rounded-md shadow-2xl flex items-center gap-4 pointer-events-auto max-w-[95%] md:max-w-2xl"
             >
               <div className="flex flex-col border-r border-border/60 pr-4 shrink-0">
                 <span className="text-[7px] font-mono text-accent-cyan tracking-widest uppercase font-mono">TACTICAL OPERATIONS</span>
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
                     disabled={activeWorkspace === 'forensics'}
                     onClick={() => {
                       if (activeWorkspace === 'forensics') return;
                       if (simulationActions.orchestrateDefense) {
                         simulationActions.orchestrateDefense(item.action, selectedNode.id);
                       } else {
                         simulationActions.isolateNode(selectedNode.id);
                       }
                     }}
                     className={cn(
                       "flex items-center gap-1.5 px-2.5 py-1 text-[8.5px] font-mono font-bold uppercase border rounded-sm transition-all",
                       activeWorkspace === 'forensics' 
                         ? "opacity-40 cursor-not-allowed border-white/5 bg-void/30 text-text-tertiary" 
                         : item.color
                     )}
                     title={activeWorkspace === 'forensics' ? "Actions disabled in Replay Mode" : `Execute ${item.label}`}
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
               className="absolute top-[125px] right-8 z-30 w-64 pointer-events-auto"
             >
                <VisualControlPanel 
                   settings={visualSettings} 
                   onChange={setVisualSettings} 
                />
             </motion.div>
           )}
         </AnimatePresence>

         {/* Context-Aware Overlay Cards for Different Workspaces */}
         <AnimatePresence>
           {activeWorkspace === 'forensics' && (
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 30 }}
               className="absolute top-6 right-6 z-10 bg-[#0e0406]/95 border border-amber-500/30 p-4 rounded backdrop-blur-md shadow-2xl flex flex-col gap-2.5 max-w-[340px] pointer-events-auto"
             >
               <div className="flex items-center justify-between pb-1 text-[8.5px] font-mono border-b border-amber-500/10">
                 <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-[10px] font-black text-amber-300 tracking-widest uppercase">TEMPORAL RECONSTRUCTION</span>
                 </div>
                 <span className="text-[7.5px] bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded px-1.5 py-0.5 select-none font-bold">HISTORIC_FLOW</span>
               </div>
               <p className="text-[9.5px] text-text-secondary leading-relaxed">
                 System is operating in forensic workload reconstruction mode. Telemetry changes represent historic logs mapping precise compromise pathways.
               </p>

               {/* Tactical incident sequence map */}
               <div className="space-y-1.5 pt-1.5 border-t border-white/5 font-mono text-[8.5px]">
                 <span className="text-[7.5px] text-amber-400 font-semibold uppercase tracking-wider">CHRONOLOGICAL CAMPAIGN FLOW:</span>
                 {compromiseSequences.length === 0 ? (
                   <div className="text-text-tertiary text-[7.5px] italic">Awaiting historic event stream correlation...</div>
                 ) : (
                   <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                     {compromiseSequences.map((ev, idx) => (
                       <div key={idx} className="flex gap-2 items-start bg-white/[0.01] hover:bg-white/[0.03] p-1.5 border border-white/5 rounded-xs transition-colors">
                         <span className="text-amber-500 font-extrabold mt-0.5">●</span>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between font-semibold text-white text-[8px]">
                             <span className="truncate max-w-[125px]">{ev.nodeId || ev.origin || 'SYSTEM'}</span>
                             <span className="text-[7.5px] text-text-tertiary font-normal text-right font-mono">
                               {ev.timestamp instanceof Date ? ev.timestamp.toLocaleTimeString() : String(ev.timestamp)}
                             </span>
                           </div>
                           <p className="text-text-secondary text-[8px] leading-snug line-clamp-2 mt-0.5">{ev.message}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </motion.div>
           )}

           {activeWorkspace === 'defense' && (
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 30 }}
               className="absolute top-6 right-6 z-10 bg-void/80 border border-accent-cyan/35 p-4 rounded backdrop-blur max-w-[340px] shadow-2xl"
             >
               <div className="text-[7.5px] font-mono text-accent-cyan tracking-widest uppercase mb-1">Defense Containment Summary</div>
               <div className="text-[11px] font-bold text-white uppercase tracking-tight mb-2">CONTAINMENT FIELD LAYER</div>
               <p className="text-[9px] text-text-secondary leading-normal mb-3">
                 Mitigated zones are surrounded by glowing isolation fields. Watch live threat containment vectors mapping to network endpoints.
               </p>
               
               <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                 <div>
                   <div className="text-[8px] font-mono text-text-tertiary uppercase">PENDING_RECS</div>
                   <div className="text-xs font-mono font-bold text-amber-500">
                     {simulationState.defenseRecommendations.filter(r => r.status === 'pending').length} Actions
                   </div>
                 </div>
                 <div>
                   <div className="text-[8px] font-mono text-text-tertiary uppercase">APPLIED_SHIELDS</div>
                   <div className="text-xs font-mono font-bold text-accent-cyan">
                     {simulationState.defenseRecommendations.filter(r => r.status === 'applied').length} Active
                   </div>
                 </div>
               </div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* Forensic Timeline Controls (ONLY when forensic mode is selected!) */}
         <AnimatePresence>
           {activeWorkspace === 'forensics' && (
             <AttackTimeline simulationState={simulationState} />
           )}
         </AnimatePresence>

         {/* AI HUD Overlay */}
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

      {/* Right Overlay Panels Column */}
      <AnimatePresence mode="wait">
        {/* If selectedNode is active, show the details drawer regardless, as it is the supreme tactical inspector */}
        {selectedNode ? (
          <motion.div
            key="node-inspector-drawer"
            initial={{ x: 455, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 455, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "absolute right-6 top-6 transition-all duration-300 border border-white/5 bg-[#05070f]/75 backdrop-blur-md z-25 shadow-2xl flex flex-col overflow-hidden rounded-md",
              activeWorkspace === 'forensics' ? "bottom-[295px]" : "bottom-6",
              "w-[390px]"
            )}
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-panel/30">
              <div className="flex items-center gap-2">
                <ActivityIcon size={12} className="text-accent-cyan animate-pulse mt-0.5" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">TACTICAL INSPECTOR</span>
              </div>
              <button 
                onClick={() => handleSelectNode(null)} 
                className="text-[9px] font-mono text-text-tertiary hover:text-white px-2 py-0.5 border border-border hover:border-border-bright rounded transition-colors"
              >
                COLLAPSE
              </button>
            </div>
            
            <div className="flex bg-void/50 p-1 m-4 rounded-sm border border-border pb-1 shrink-0">
              {[
                { id: 'details', label: 'Telemetry' },
                { id: 'ai', label: 'AI_Insight' },
                { id: 'analytics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveNodeTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-1 text-[8.5px] font-mono font-bold tracking-[1px] uppercase transition-all relative",
                    activeNodeTab === tab.id
                      ? "bg-accent-cyan/10 text-accent-cyan border-b border-accent-cyan"
                      : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {activeNodeTab === 'details' && (
                <NodeDetails 
                  node={selectedNode} 
                  nodes={simulationState.nodes}
                  events={simulationState.events}
                  links={simulationState.links}
                  onIsolate={simulationActions.isolateNode}
                  onClose={() => handleSelectNode(null)} 
                  onViewAI={() => setActiveNodeTab('ai')}
                  isPanel={true}
                />
              )}
              {activeNodeTab === 'ai' && (
                <div className="h-full p-4 overflow-y-auto">
                  <AIIntelligencePanel 
                    selectedNode={selectedNode}
                    allNodes={simulationState.nodes}
                    allLinks={simulationState.links}
                    knowledgeBase={simulationState.knowledgeBase}
                    defenseRecommendations={simulationState.defenseRecommendations}
                    onHighlightNode={setHighlightedNodeId}
                  />
                </div>
              )}
              {activeNodeTab === 'analytics' && (
                <div className="h-full p-4 overflow-y-auto">
                  <AnalyticsPanel 
                    nodes={simulationState.nodes}
                    links={simulationState.links}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Workspace specific right sidebars when no node is selected */
          <>
            {activeWorkspace === 'twin' && (
              <motion.div 
                key="workspace-right-twin"
                initial={{ x: 455, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 455, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "absolute right-6 top-6 transition-all duration-300 border border-white/5 bg-[#05070f]/75 backdrop-blur-md z-25 shadow-2xl flex flex-col overflow-hidden rounded-md",
                  "bottom-6",
                  "w-[390px]"
                )}
              >
                <div className="p-6 border-b border-border bg-panel/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider font-mono">SIMULATION RESILIENCE CORES</span>
                    <span className="text-[8px] font-mono text-state-warning flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-state-warning animate-pulse" />
                      SIMULATION_CONTAINER: DEPLOYED
                    </span>
                  </div>
                  <h3 className="text-xs font-bold font-sans text-white uppercase tracking-tight">INFRASTRUCTURE TWIN RESILIENCE MONITOR</h3>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <DigitalTwinDashboard onHighlightNode={setHighlightedNodeId} />
                </div>
              </motion.div>
            )}

            {activeWorkspace === 'ai' && (
              <motion.div 
                key="workspace-right-ai"
                initial={{ x: 455, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 455, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "absolute right-6 top-6 transition-all duration-300 border border-white/5 bg-[#05070f]/75 backdrop-blur-md z-25 shadow-2xl flex flex-col overflow-hidden rounded-md",
                  "bottom-6",
                  "w-[390px]"
                )}
              >
                <div className="p-5 border-b border-border bg-panel/10 shrink-0">
                  <div className="text-[7.5px] font-mono text-text-tertiary tracking-widest uppercase mb-1">Knowledge Synthesis Ledger</div>
                  <h1 className="text-xs font-bold text-white uppercase">SYNTHESIZED INTEL HEURISTICS HUB</h1>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                  <IntelligenceHub state={simulationState} />
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
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
