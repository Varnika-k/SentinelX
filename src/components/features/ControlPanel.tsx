import { motion, AnimatePresence } from 'motion/react';
import { Shield, RotateCcw, AlertTriangle, Users, Bug, Search, FileText, Activity, ChevronDown, Zap, ShieldAlert, Gauge, ShieldCheck } from 'lucide-react';
import { AttackType, ScenarioType, DefenseModule, NetworkNode } from '../../types/simulation';
import { cn } from '../../lib/utils';
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
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-2">
         <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-4 h-4 text-accent-cyan" />
              <div className="absolute inset-0 bg-accent-cyan/30 blur-md rounded-full animate-pulse-precision" />
            </div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Neural_Link_Commands</h3>
         </div>
         <div className="px-2 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-sm">
            <span className="text-[8px] font-mono text-accent-cyan font-bold tracking-widest uppercase">Root_Auth</span>
         </div>
      </div>
      
      <div className="space-y-8">
        {/* Section 1: Strike Authorization */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">01. Offensive_Vectors</span>
            <span className="text-[8px] font-mono text-state-danger/60 uppercase">Warning: Active_Unit</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {attackTypes.map((a) => (
               <button
                key={a.type}
                onClick={() => setSelectedAttack(a.type)}
                className={cn(
                  "precision-button h-10 flex flex-col items-center justify-center gap-0.5 transition-all text-[10px]",
                  selectedAttack === a.type 
                    ? "border-state-danger/50 text-state-danger bg-state-danger/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                    : "text-text-tertiary"
                )}
              >
                <span className="font-mono text-[8px] opacity-40">ST_</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-void/50 p-3 border border-border rounded-sm">
             <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <Gauge size={12} className="text-text-tertiary" />
                  <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Strike_Magnitude</span>
                </div>
                <span className="text-[12px] text-state-danger font-mono font-bold tracking-tight">{(intensity * 100).toFixed(0)}%</span>
             </div>
             <input 
               type="range" 
               min="0.1" 
               max="1.0" 
               step="0.05" 
               value={intensity} 
               onChange={(e) => setIntensity(parseFloat(e.target.value))}
               className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-state-danger"
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
              "w-full h-14 font-bold text-[13px] tracking-[0.2em] transition-all flex flex-col items-center justify-center group relative overflow-hidden uppercase",
              selectedAttack 
                ? "bg-state-danger text-void font-inter font-black shadow-lg shadow-state-danger/10 active:scale-[0.99] hover:bg-state-danger/90" 
                : "bg-faint/30 text-text-tertiary cursor-not-allowed border border-border"
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
            <div className="flex items-center gap-3 relative z-10">
              <Zap size={16} fill="currentColor" />
              <span>{selectedNodeId ? `Execute_Strike [${selectedNodeId}]` : 'Authorize_Strike'}</span>
            </div>
            <div className="text-[8px] font-mono opacity-60 tracking-[0.3em] mt-0.5">Quantum_Sign_Validated</div>
          </button>
        </section>

        {/* Section 2: Deflection Protocols */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">02. Counter_Measures</span>
              <span className="text-[8px] font-mono text-accent-cyan/60 uppercase">Status: Nominal</span>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
             {defenseModules.map(module => {
                const isActive = activeDefenseModules.includes(module.id);
                const isJustToggled = lastToggled === module.id;
                 return (
                  <button
                   key={module.id}
                   onClick={() => handleDefenseToggle(module.id)}
                   className={cn(
                     "precision-button h-12 flex items-center justify-between group transition-all duration-300 relative overflow-hidden px-4",
                     isActive
                       ? "border-accent-cyan/50 text-accent-cyan bg-accent-cyan/10"
                       : "text-text-tertiary",
                     isJustToggled && "border-white bg-white/10"
                   )}
                  >
                    <div className="flex items-center gap-2.5 relative z-10">
                      {isActive ? (
                        <ShieldCheck size={12} className="text-accent-cyan" />
                      ) : (
                        <Shield size={12} className="text-text-tertiary/60" />
                      )}
                      <span className="text-[10px] font-bold tracking-wider uppercase">{module.label}</span>
                    </div>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-500",
                      isActive ? "bg-accent-cyan shadow-[0_0_10px_#00f2ff]" : "bg-text-tertiary/20"
                    )} />
                  </button>
                );
             })}
           </div>
        </section>

        {/* Section 3: System Calibration */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">03. Environmental_Tune</span>
           </div>
           
           <div className="space-y-6 bg-panel/30 border border-border p-4 rounded-sm">
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Regional_Flux</span>
                       <span className="text-[11px] text-accent-blue font-mono font-bold">{(vulnValue * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.0" 
                      max="1.0" 
                      step="0.05" 
                      value={vulnValue} 
                      onChange={(e) => setVulnValue(parseFloat(e.target.value))}
                      className="w-full h-1 bg-void rounded-lg appearance-none cursor-pointer accent-accent-blue"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {zones.map(z => (
                     <button
                        key={z.type}
                        onClick={() => {
                          onUpdateZoneVulnerability(z.type, vulnValue);
                          triggerActionFeedback(`zone-${z.type}`);
                        }}
                        className="precision-button h-9 text-[10px] lowercase italic font-mono"
                       >
                         {z.label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                 <select 
                    value={targetNodeId}
                    onChange={(e) => handleNodeSelect(e.target.value)}
                    className="w-full bg-void border border-border py-2 px-3 text-[10px] font-mono text-text-primary focus:outline-none focus:border-accent-cyan/50 uppercase"
                  >
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.label} [{n.id.slice(0, 6)}]</option>
                    ))}
                 </select>

                 <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest">Selected_Node_Exposure</span>
                    <span className="text-[11px] text-accent-cyan font-mono font-bold">{(nodeVulnValue * 100).toFixed(0)}%</span>
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
                    className="w-full h-1 bg-void rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                 />

                 <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        if (targetNodeId) {
                          onUpdateNodeVulnerability(targetNodeId, nodeVulnValue);
                          triggerActionFeedback('patch-node');
                        }
                      }}
                      className="precision-button border-accent-blue/30 text-accent-blue h-9 flex items-center justify-center gap-2"
                    >
                      <Activity size={12} />
                      Sync_Node
                    </button>
                    <button
                      onClick={() => {
                        onReset();
                        triggerActionFeedback('reset');
                      }}
                      className="precision-button border-state-danger/30 text-state-danger h-9 flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={12} />
                      Flush
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* Section 4: Operational Presets */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">04. Field_Scenarios</span>
           </div>
           
           <div className="grid grid-cols-3 gap-2">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onLaunchScenario(s.id);
                    triggerActionFeedback(`scenario-${s.id}`);
                  }}
                  className="precision-button h-16 flex flex-col items-center justify-center gap-2 text-center p-2"
                >
                  <Bug size={14} className="opacity-40" />
                  <span className="text-[9px] font-bold tracking-tight">{s.label}</span>
                </button>
              ))}
           </div>
        </section>
      </div>

      {/* Footer Diagnostic Panel */}
      <div className="mt-4 pt-6 border-t border-border flex flex-col gap-4">
         <div className="flex items-center justify-between text-[10px] font-bold text-text-tertiary tracking-[0.2em] uppercase">
           <span>Log_Stream</span>
           <button onClick={onShowReport} className="text-accent-cyan hover:underline transition-all font-mono lowercase tracking-normal">extract.dbg</button>
         </div>
         <div className="bg-void/50 p-3 rounded-sm border border-border h-24 overflow-hidden relative group">
            <div className="font-mono text-[9px] text-text-tertiary space-y-1">
               <div className="flex gap-2">
                 <span className="text-accent-cyan opacity-60 font-bold">[SYS]</span>
                 <span className="animate-pulse">Monitoring telemetry flux...</span>
               </div>
               <div className="flex gap-2 opacity-40">
                 <span>[IO]</span>
                 <span>Handshake with 0xA4F2 complete</span>
               </div>
               <div className="flex gap-2 opacity-40">
                 <span>[NET]</span>
                 <span>Subspace topology validated</span>
               </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent pointer-events-none" />
         </div>
         
         <div className="grid grid-cols-4 gap-2">
            {[0.5, 1, 2, 4].map(s => (
              <button 
                key={s}
                onClick={() => onSetSimulationSpeed(s === 1 ? 3000 : 3000 / s)}
                className={cn(
                  "py-1.5 text-[9px] font-mono border transition-all rounded-sm",
                  (s === 1 && simulationSpeed === 3000) || (s !== 1 && simulationSpeed === 3000 / s)
                    ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10" 
                    : "border-border text-text-tertiary hover:text-white"
                )}
              >
                {s}X
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
