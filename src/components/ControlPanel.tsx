import { motion, AnimatePresence } from 'motion/react';
import { Shield, RotateCcw, AlertTriangle, Users, Bug, Search, FileText, Activity, ChevronDown, Zap, ShieldAlert, Gauge, ShieldCheck } from 'lucide-react';
import { AttackType, ScenarioType, DefenseModule, NetworkNode } from '../types/simulation';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export function ControlPanel({ 
  nodes,
  onLaunchAttack, 
  onLaunchScenario,
  onActivateDefense, 
  onReset,
  onToggleHeatmap,
  onShowReport,
  showHeatmap,
  selectedNodeId,
  simulationSpeed,
  onSetSimulationSpeed,
  activeDefenseModules,
  onToggleDefenseModule,
  onOpenManual,
  onUpdateNodeVulnerability,
  onUpdateZoneVulnerability,
  onHighlightNode
}: { 
  nodes: NetworkNode[],
  onLaunchAttack: (type: AttackType, targetId?: string, intensity?: number) => void,
  onLaunchScenario: (scenario: ScenarioType) => void,
  onActivateDefense: () => void,
  onReset: () => void,
  onToggleHeatmap: () => void,
  onShowReport: () => void,
  showHeatmap: boolean,
  selectedNodeId?: string,
  simulationSpeed: number,
  onSetSimulationSpeed: (speed: number) => void,
  activeDefenseModules: DefenseModule[],
  onToggleDefenseModule: (module: DefenseModule) => void,
  onOpenManual: () => void,
  onUpdateNodeVulnerability: (nodeId: string, vuln: number) => void,
  onUpdateZoneVulnerability: (type: string, vuln: number) => void,
  onHighlightNode?: (nodeId: string | null) => void
}) {
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [intensity, setIntensity] = useState(0.8);
  const [vulnValue, setVulnValue] = useState(0.5);
  const [nodeVulnValue, setNodeVulnValue] = useState(0.5);
  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [lastToggled, setLastToggled] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeActions, setActiveActions] = useState<Record<string, boolean>>({});

  const triggerActionFeedback = (actionId: string) => {
    setActiveActions(prev => ({ ...prev, [actionId]: true }));
    setTimeout(() => {
      setActiveActions(prev => ({ ...prev, [actionId]: false }));
    }, 600);
  };

  // Sync node vulnerability slider with selection
  useEffect(() => {
    if (selectedNodeId) {
      setTargetNodeId(selectedNodeId);
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) setNodeVulnValue(node.vulnerability);
    } else if (!targetNodeId && nodes.length > 0) {
      setTargetNodeId(nodes[0].id);
      setNodeVulnValue(nodes[0].vulnerability);
    }
  }, [selectedNodeId, nodes.length]);

  const handleNodeSelect = (id: string) => {
    setTargetNodeId(id);
    const node = nodes.find(n => n.id === id);
    if (node) setNodeVulnValue(node.vulnerability);
  };

  const handleDefenseToggle = (id: DefenseModule) => {
    onToggleDefenseModule(id);
    setLastToggled(id);
    setTimeout(() => setLastToggled(null), 1000);
  };

  const attackTypes: { type: AttackType; label: string }[] = [
    { type: 'ransomware', label: 'RANSOM' },
    { type: 'ddos', label: 'DDOS' },
    { type: 'phishing', label: 'PHISH' },
    { type: 'insider', label: 'INSIDER' },
    { type: 'zeroday', label: 'ZERO-DAY' },
    { type: 'apt', label: 'APT' },
  ];

  const zones: { type: string; label: string }[] = [
    { type: 'gateway', label: 'GATEWAY' },
    { type: 'database', label: 'DATABASE' },
    { type: 'firewall', label: 'FIREWALL' },
    { type: 'workstation', label: 'ENDPOINTS' },
  ];

  const defenseModules: { id: DefenseModule; label: string }[] = [
    { id: 'firewall', label: 'Active Firewall' },
    { id: 'neural_isolation', label: 'Neural Isolation' },
    { id: 'heuristic_scanner', label: 'Heuristic Scan' },
    { id: 'auto_containment', label: 'Auto Contain' },
  ];

  const scenarios: { id: ScenarioType; label: string }[] = [
    { id: 'corporate_espionage', label: 'ESPIONAGE' },
    { id: 'critical_infrastructure', label: 'INFRA_CRIT' },
    { id: 'ransomware_storm', label: 'RANSOM_STORM' }
  ];

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-panel border border-border">
      <div className="flex items-center justify-between mb-1">
         <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
           <h3 className="text-[10px] font-display font-black tracking-[3px] text-white uppercase">SENTINEL_X_COMMAND</h3>
         </div>
      </div>
      
      <div className="space-y-5">
        <div>
          <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[4px] mb-2 block">1. ATTACK VECTORS</span>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {attackTypes.map((a) => (
               <button
                key={a.type}
                onClick={() => setSelectedAttack(a.type)}
                className={cn(
                  "py-2 border text-[11px] font-display font-bold tracking-[1px] transition-all uppercase relative overflow-hidden",
                  selectedAttack === a.type 
                    ? "bg-state-danger/30 border-state-danger text-state-danger shadow-[0_0_15px_rgba(255,17,68,0.3)] scale-[1.05] z-10" 
                    : "bg-void border-border text-text-secondary hover:text-white"
                )}
              >
                {selectedAttack === a.type && (
                  <motion.div 
                    layoutId="attack-glow"
                    className="absolute inset-0 bg-state-danger/10 animate-pulse"
                  />
                )}
                <span className="relative z-10">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-4 bg-void/30 p-2 border border-white/5 rounded-sm">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Gauge size={12} className="text-state-danger" />
                  <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[1px]">Attack Intensity</span>
                </div>
                <span className="text-[12px] text-state-danger font-display font-black">{(intensity * 100).toFixed(0)}%</span>
             </div>
             <input 
               type="range" 
               min="0.1" 
               max="1.0" 
               step="0.05" 
               value={intensity} 
               onChange={(e) => setIntensity(parseFloat(e.target.value))}
               className="w-full h-1.5 bg-void/50 rounded-lg appearance-none cursor-pointer accent-state-danger shadow-[0_0_15px_rgba(255,17,68,0.4)] transition-all hover:bg-state-danger/20"
             />
          </div>

          <button
            onClick={() => {
              if (selectedAttack) {
                onLaunchAttack(selectedAttack, selectedNodeId, intensity);
                triggerActionFeedback('strike');
              }
            }}
            disabled={!selectedAttack}
            className={cn(
              "w-full py-4 font-display text-[12px] tracking-[3px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 group relative overflow-hidden",
              selectedAttack 
                ? "bg-state-danger text-void hover:shadow-[0_0_25px_rgba(255,17,68,0.5)] active:scale-[0.98]" 
                : "bg-void text-text-secondary/20 cursor-not-allowed border border-border"
            )}
            style={selectedAttack ? { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' } : {}}
          >
            {activeActions['strike'] && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.5, 0], scale: [1, 2] }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-white pointer-events-none z-20"
              />
            )}
            <div className="flex items-center gap-2 relative z-10">
              <Zap size={16} fill="currentColor" />
              <span className="text-[13px]">{selectedNodeId ? `EXEC_STRIKE [${selectedNodeId}]` : 'LAUNCH_STRIKE'}</span>
            </div>
            {selectedNodeId && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-white/20 skew-x-12 opacity-30 pointer-events-none"
              />
            )}
            <span className="text-[8px] font-bold opacity-60 relative z-10">{selectedNodeId ? 'ORTHOGONAL_TARGET_LOCKED' : 'SYSTEM_AWAITING_COORDINATES'}</span>
          </button>
        </div>

        <div>
           <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[4px] mb-2 block">2. DEFENSE MODULES</span>
           <div className="grid grid-cols-2 gap-2">
             {defenseModules.map(module => {
                const isActive = activeDefenseModules.includes(module.id);
                const isJustToggled = lastToggled === module.id;
                 return (
                  <button
                   key={module.id}
                   onClick={() => handleDefenseToggle(module.id)}
                   className={cn(
                     "px-3 py-3 border text-left flex items-center justify-between group transition-all duration-300 relative overflow-hidden",
                     isActive
                       ? "bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_20px_rgba(0,255,209,0.15)] ring-1 ring-accent-cyan/40"
                       : "bg-void border-border text-text-secondary hover:text-white/60 hover:bg-white/5",
                     isJustToggled && "scale-[1.05] z-20 border-white shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                   )}
                  >
                    {isActive && (
                      <motion.div
                        animate={{ 
                          opacity: [0.05, 0.2, 0.05],
                          boxShadow: ["inset 0 0 0px #00FFD1", "inset 0 0 20px #00FFD1", "inset 0 0 0px #00FFD1"]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-accent-cyan pointer-events-none"
                      />
                    )}
                    {isJustToggled && (
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.8, scale: 4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 bg-white rounded-full pointer-events-none"
                       />
                    )}
                    <div className="flex items-center gap-2 relative z-10 overflow-hidden">
                      {isActive ? (
                        <ShieldCheck size={12} className="shrink-0 text-accent-cyan animate-in fade-in zoom-in duration-300" />
                      ) : (
                        <Shield size={12} className="shrink-0 text-text-secondary" />
                      )}
                      <span className="text-[10px] font-display font-black tracking-[1px] uppercase truncate">{module.label}</span>
                    </div>
                    <div className="flex items-center gap-2 relative z-10 shrink-0">
                       {isActive && (
                         <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-ping opacity-75 mr-0.5" />
                       )}
                       <div className={cn(
                         "w-2 h-2 rounded-full transition-all duration-500",
                         isActive ? "bg-accent-cyan shadow-[0_0_15px_#00FFD1] ring-2 ring-accent-cyan/20 scale-110" : "bg-white/10"
                       )} />
                    </div>
                  </button>
                );
             })}
           </div>
        </div>

        <div>
           <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[4px] mb-2 block">3. EXPOSURE CONTROL</span>
           <div className="space-y-6">
              {/* Global Zone Vulnerability */}
              <div className="space-y-3">
                 <div className="px-1">
                    <div className="flex justify-between items-center mb-1.5">
                       <span className="text-[9px] text-text-secondary font-heading font-black uppercase tracking-[1px]">Zone Vulnerability Scalar</span>
                       <span className="text-[11px] text-accent-blue font-display font-black">{(vulnValue * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.0" 
                      max="1.0" 
                      step="0.05" 
                      value={vulnValue} 
                      onChange={(e) => setVulnValue(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-void rounded-lg appearance-none cursor-pointer accent-accent-blue"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-1.5">
                    {zones.map(z => (
                     <button
                        key={z.type}
                        onClick={() => {
                          onUpdateZoneVulnerability(z.type, vulnValue);
                          triggerActionFeedback(`zone-${z.type}`);
                        }}
                        className="py-2 border border-border bg-void text-text-secondary hover:text-white hover:border-white/20 transition-all uppercase relative overflow-hidden"
                       >
                        {activeActions[`zone-${z.type}`] && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.2, 0] }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-accent-blue pointer-events-none"
                          />
                        )}
                        <span className="text-[10px] font-heading font-black tracking-[1px] relative z-10">CALIBRATE_{z.label}</span>
                       </button>
                    ))}
                 </div>
              </div>

              {/* Individual Node Vulnerability */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                 <span className="text-[9px] text-text-secondary font-heading font-black tracking-[1px] uppercase block">Node Vulnerability</span>
                 
                 <div className="space-y-2">
                    <select 
                      value={targetNodeId}
                      onChange={(e) => handleNodeSelect(e.target.value)}
                      className="w-full bg-void border border-border py-2 px-3 text-[11px] font-display font-black tracking-[1px] text-white focus:outline-none focus:border-accent-blue/50 uppercase"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.label} [{n.type}]</option>
                      ))}
                    </select>

                    <div className="px-1">
                      <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[8px] text-text-secondary font-heading font-black uppercase tracking-[1px]">Exposure Rating</span>
                          <span className="text-[11px] text-accent-cyan font-display font-black">{(nodeVulnValue * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.0" 
                        max="1.0" 
                        step="0.05" 
                        value={nodeVulnValue} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNodeVulnValue(val);
                          onHighlightNode?.(targetNodeId);
                        }}
                        onBlur={() => onHighlightNode?.(null)}
                        className="w-full h-1.5 bg-void rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (targetNodeId) {
                          onUpdateNodeVulnerability(targetNodeId, nodeVulnValue);
                          triggerActionFeedback('patch-node');
                        }
                      }}
                      disabled={!targetNodeId}
                      className="w-full py-3 border border-accent-blue/30 bg-accent-blue/5 text-[10px] font-heading font-black tracking-[1px] text-accent-blue hover:bg-accent-blue/10 transition-all uppercase relative overflow-hidden"
                    >
                      {activeActions['patch-node'] && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.2, 0] }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-accent-blue pointer-events-none"
                        />
                      )}
                      <span className="relative z-10">PATCH_NODE_{targetNodeId || 'NONE'}</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div>
           <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[4px] mb-2 block">4. SIMULATION CLOCK</span>
           <div className="flex items-center gap-4">
              <div className="flex-1 flex gap-1.5">
                 {[
                   { label: '0.5X', value: 6000 },
                   { label: '1X', value: 3000 },
                   { label: '2X', value: 1500 },
                   { label: '4X', value: 750 }
                 ].map(speed => (
                   <button
                    key={speed.value}
                    onClick={() => onSetSimulationSpeed(speed.value)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-heading font-black border transition-all",
                      simulationSpeed === speed.value
                        ? "bg-accent-blue/20 border-accent-blue text-accent-blue"
                        : "bg-void border-border text-text-secondary hover:text-white"
                    )}
                   >
                     {speed.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div>
              <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[4px] mb-2 block">5. PRESETS</span>
              <div className="flex flex-col gap-1.5">
                 {scenarios.map(s => (
                   <button
                    key={s.id}
                    onClick={() => {
                      onLaunchScenario(s.id);
                      triggerActionFeedback(`scenario-${s.id}`);
                    }}
                    className="w-full px-3 py-2 border border-border bg-void text-text-secondary hover:text-white hover:border-white/20 transition-all text-[10px] font-heading font-black tracking-[1px] uppercase text-left relative overflow-hidden"
                   >
                     {activeActions[`scenario-${s.id}`] && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: [0.2, 0] }}
                         transition={{ duration: 0.5 }}
                         className="absolute inset-0 bg-accent-cyan pointer-events-none"
                       />
                     )}
                     <span className="relative z-10">{s.label}</span>
                   </button>
                 ))}
              </div>
           </div>
           <div>
              <span className="text-[10px] text-text-secondary font-heading font-black uppercase tracking-[4px] mb-2 block">6. UTILS</span>
              <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      onToggleHeatmap();
                      triggerActionFeedback('heatmap');
                    }}
                    className={cn(
                      "w-full px-3 py-2 border text-left flex items-center justify-between group transition-all relative overflow-hidden",
                      showHeatmap
                        ? "bg-state-warning/20 border-state-warning text-state-warning shadow-[0_0_15px_#FF950033]"
                        : "bg-void border-border text-text-secondary hover:text-white/60"
                    )}
                  >
                    {activeActions['heatmap'] && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-state-warning pointer-events-none"
                      />
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                       <Activity size={12} className={cn(showHeatmap && "animate-pulse")} />
                       <span className="text-[10px] font-display font-black tracking-[1px] uppercase">HEATMAP</span>
                    </div>
                  </button>
                  <button
                    onClick={runScan}
                    className={cn(
                      "w-full px-3 py-2 border text-left flex items-center justify-between group transition-all",
                      isScanning
                        ? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan"
                        : "bg-void border-border text-text-secondary hover:text-white/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                       <Search size={12} />
                       <span className="text-[10px] font-display font-black tracking-[1px] uppercase">{isScanning ? 'SCANNING...' : 'SCAN_NODES'}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full px-3 py-2 bg-void border border-border text-state-danger hover:bg-state-danger/10 transition-all font-display text-[10px] tracking-[1px] font-black flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={12} />
                    RESET_OS
                  </button>
              </div>
           </div>
        </div>

        {/* Reset Confirmation Overlay */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-void/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              <AlertTriangle size={32} className="text-state-danger mb-4 animate-bounce" />
              <h4 className="text-[12px] font-display font-black text-white uppercase tracking-[4px] mb-2">CRITICAL_WARNING</h4>
              <p className="text-[8px] text-text-secondary leading-relaxed uppercase mb-6 font-body">
                Initiating total system purge. All simulation states, logs, and network topology will be permanently recalibrated.
                <br /><br />
                COGNIZANT_APPROVAL_REQUIRED
              </p>
              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={() => {
                    onReset();
                    setShowResetConfirm(false);
                  }}
                  className="w-full py-3 bg-state-danger text-void font-display font-black text-[10px] tracking-[2px] uppercase shadow-[0_0_20px_rgba(255,17,68,0.3)]"
                >
                  CONFIRM_PURGE
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-3 bg-void border border-border text-text-secondary font-display font-black text-[10px] tracking-[2px] uppercase"
                >
                  ABORT_RESET
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <button 
            onClick={onOpenManual}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-display font-bold text-[11px] tracking-[2px] uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <FileText size={16} />
            OPEN_OPERATIONS_MANUAL
          </button>
        </div>

        <div className="h-px bg-border/50" />

        <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between text-[10px] font-black font-heading text-text-secondary tracking-[2px] uppercase">
             <span>INTELLIGENCE_FEED</span>
             <button onClick={onShowReport} className="text-accent-cyan hover:underline">EXTRACT_JSON</button>
           </div>
           <div className="text-[9px] text-text-secondary font-body leading-tight space-y-1 opacity-60 uppercase">
              <div className="flex gap-2">
                <span className="text-state-safe">[LOG]</span>
                <span>CORE_v4 NOMINAL</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
