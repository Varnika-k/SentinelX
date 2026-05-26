import { motion, AnimatePresence } from 'motion/react';
import { Shield, RotateCcw, AlertTriangle, Users, Bug, Search, FileText, Activity, ChevronDown, Zap, ShieldAlert, Gauge, ShieldCheck } from 'lucide-react';
import { AttackType, ScenarioType, DefenseModule, NetworkNode } from '../../types/simulation';
import { EnterpriseIdentity } from '../../types/iam';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

export function ControlPanel({ 
  nodes,
  identities = [],
  operatorRole = 'Administrator',
  onEscalateRole,
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
  onHighlightNode,
  spreadVelocity,
  onSetSpreadVelocity,
  isSimulating,
  onToggleSimulation
}: { 
  nodes: NetworkNode[],
  identities?: EnterpriseIdentity[],
  operatorRole?: string,
  onEscalateRole?: (role: string) => void,
  onLaunchAttack: (type: AttackType, targetId?: string, intensity?: number, identityId?: string) => void,
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
  onHighlightNode?: (nodeId: string | null) => void,
  spreadVelocity: number,
  onSetSpreadVelocity: (velocity: number) => void,
  isSimulating: boolean,
  onToggleSimulation: () => void
}) {
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [intensity, setIntensity] = useState(0.8);
  const [vulnValue, setVulnValue] = useState(0.5);
  const [nodeVulnValue, setNodeVulnValue] = useState(0.5);
  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [targetIdentityId, setTargetIdentityId] = useState<string>('');
  const [lastToggled, setLastToggled] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeActions, setActiveActions] = useState<Record<string, boolean>>({});

  const [isEscalating, setIsEscalating] = useState(false);
  const isRestrictedRole = operatorRole === 'Security Analyst' || operatorRole === 'Forensic Investigator';

  const handleRequestElevate = async () => {
    setIsEscalating(true);
    await new Promise(r => setTimeout(r, 1200));
    onEscalateRole?.('Administrator');
    setIsEscalating(false);
  };

  // Environmental Tune - Live update
  useEffect(() => {
    if (selectedZone) {
      onUpdateZoneVulnerability(selectedZone, vulnValue);
    }
  }, [vulnValue, selectedZone, onUpdateZoneVulnerability]);

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
    { id: 'traffic_scrubbing', label: 'Traffic Scrub' },
    { id: 'quantum_hardening', label: 'Quantum Shield' },
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

           {isRestrictedRole ? (
             <div className="bg-state-warning/10 border border-state-warning/30 p-3.5 rounded-sm text-[10px] space-y-3 font-mono">
               <div className="flex gap-2 items-center text-state-warning font-extrabold uppercase tracking-wider">
                 <AlertTriangle size={13} className="text-state-warning animate-pulse" />
                 <span>RESTRICTED TOPOLOGY WRITE BOUNDARY</span>
               </div>
               <p className="text-[9px] text-text-secondary leading-normal uppercase">
                 Clearance status [{operatorRole.toUpperCase()}] restricts simulation triggers. Access control (RBAC) overrides active.
               </p>
               <button
                 type="button"
                 onClick={handleRequestElevate}
                 disabled={isEscalating}
                 className="w-full text-center py-2.5 bg-state-warning text-void font-extrabold rounded-sm text-[9.5px] uppercase tracking-widest transition-all hover:bg-white hover:text-void cursor-pointer block"
               >
                 {isEscalating ? 'AUTHENTICATING OVERRIDE KEY...' : 'DEPLOY ONE-CLICK ELEVATION'}
               </button>
             </div>
           ) : (
             <button
               onClick={() => {
                 if (selectedAttack) {
                   onLaunchAttack(selectedAttack, targetNodeId || undefined, intensity, targetIdentityId || undefined);
                   triggerActionFeedback('strike');
                 }
               }}
               disabled={!selectedAttack}
               className={cn(
                 "w-full h-14 font-bold text-[13px] tracking-[0.2em] transition-all flex flex-col items-center justify-center group relative overflow-hidden uppercase cursor-pointer",
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
                 <span>{targetIdentityId ? `Compromise Identity [${targetIdentityId}]` : selectedNodeId ? `Execute_Strike [${selectedNodeId}]` : 'Authorize_Strike'}</span>
               </div>
               <div className="text-[8px] font-mono opacity-60 tracking-[0.3em] mt-0.5">Quantum_Sign_Validated</div>
             </button>
           )}
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
                     "precision-button h-10 flex items-center justify-between group transition-all duration-300 relative overflow-hidden px-3",
                     isActive
                       ? "border-accent-cyan/50 text-accent-cyan bg-accent-cyan/10"
                       : "text-text-tertiary",
                     isJustToggled && "border-white bg-white/10"
                   )}
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      {isActive ? (
                        <ShieldCheck size={10} className="text-accent-cyan" />
                      ) : (
                        <Shield size={10} className="text-text-tertiary/60" />
                      )}
                      <span className="text-[9px] font-bold tracking-wider uppercase">{module.label}</span>
                    </div>
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-all duration-500",
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
              <span className="text-[8px] font-mono text-accent-blue/60 uppercase">Manual_Override</span>
           </div>
           
           <div className="space-y-6 bg-panel/30 border border-border p-4 rounded-sm">
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                         {selectedZone ? `Zone_Flux: ${selectedZone}` : 'Regional_Flux'}
                       </span>
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
                          setSelectedZone(z.type);
                          onUpdateZoneVulnerability(z.type, vulnValue);
                          triggerActionFeedback(`zone-${z.type}`);
                        }}
                        className={cn(
                          "precision-button h-9 text-[10px] lowercase italic font-mono transition-all",
                          selectedZone === z.type ? "border-accent-blue text-accent-blue bg-accent-blue/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "text-text-tertiary"
                        )}
                       >
                         {z.label}
                       </button>
                    ))}
                 </div>
                 {selectedZone && (
                   <div className="text-[8px] font-mono text-accent-blue/60 text-center uppercase tracking-widest animate-pulse">
                     Zone_Calibration_Applied
                   </div>
                 )}
              </div>

                 <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Spread_Intensity</span>
                       <span className="text-[11px] text-accent-cyan font-mono font-bold">{spreadVelocity?.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="3.0" 
                      step="0.1" 
                      value={spreadVelocity || 1.0} 
                      onChange={(e) => onSetSpreadVelocity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-void rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                    />
                 </div>

                  <div className="pt-6 border-t border-border/50 flex flex-col gap-3">
                  <div className="space-y-1">
                    <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest pl-1">Network Target</span>
                    <select 
                      value={targetNodeId}
                      onChange={(e) => handleNodeSelect(e.target.value)}
                      className="w-full bg-void border border-border py-2 px-3 text-[10px] font-mono text-text-primary focus:outline-none focus:border-accent-cyan/50 uppercase"
                    >
                      <option value="">No Target</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.label} [{n.id.slice(0, 6)}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 mt-2">
                    <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest pl-1">Identity Target</span>
                    <select 
                      value={targetIdentityId}
                      onChange={(e) => setTargetIdentityId(e.target.value)}
                      className="w-full bg-void border border-border py-2 px-3 text-[10px] font-mono text-text-primary focus:outline-none focus:border-accent-cyan/50 uppercase"
                    >
                      <option value="">No Identity</option>
                      {identities.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center px-1 mt-2">
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

        {/* Section 4: Emergency Protocols */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">04. Emergency_Protocols</span>
              <span className="text-[8px] font-mono text-state-danger/60 uppercase">Auth: Level_3</span>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onToggleSimulation();
                  triggerActionFeedback('simulation-toggle');
                }}
                className={cn(
                  "precision-button h-16 flex flex-col items-center justify-center gap-2 text-center p-2 group transition-all",
                  isSimulating 
                    ? "border-state-warning/30 text-state-warning hover:bg-state-warning/10" 
                    : "border-state-safe/50 text-state-safe bg-state-safe/10 animate-pulse-precision"
                )}
              >
                {isSimulating ? <ShieldAlert size={16} /> : <Zap size={16} />}
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-tight">{isSimulating ? 'PAUSE_ENGINE' : 'RESUME_ENGINE'}</span>
                  <span className="text-[7px] opacity-60 font-mono">{isSimulating ? 'Halt_Propagation' : 'Initiate_Cycles'}</span>
                </div>
              </button>

              <button
                onClick={() => {
                  nodes.forEach(n => onUpdateNodeVulnerability(n.id, vulnValue));
                  setSelectedZone(null);
                  triggerActionFeedback('global-sync');
                }}
                className={cn(
                  "precision-button h-16 flex flex-col items-center justify-center gap-2 text-center p-2 border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 transition-all",
                  activeActions['global-sync'] && "bg-accent-blue text-white"
                )}
              >
                <Activity size={16} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-tight">GLOBAL_SYNC</span>
                  <span className="text-[7px] opacity-60 font-mono">Sync_All_Nodes</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onReset();
                  triggerActionFeedback('emergency-reset');
                }}
                className={cn(
                  "precision-button h-16 flex flex-col items-center justify-center gap-2 text-center p-2 border-state-danger/50 text-state-danger hover:bg-state-danger/10 group transition-all",
                  activeActions['emergency-reset'] && "bg-state-danger text-white col-span-2"
                )}
              >
                <RotateCcw size={16} className="group-hover:rotate-[-45deg] transition-transform" />
                <div className="flex flex-col text-center">
                  <span className="text-[9px] font-bold tracking-tight">SYSTEM_RESET</span>
                  <span className="text-[7px] opacity-60 font-mono">Flush_Neural_Buffer</span>
                </div>
              </button>
           </div>
        </section>

        {/* Section 5: Operational Presets */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">05. Field_Scenarios</span>
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

        {/* Section 6: Telemetry Ingest Pipeline Feeders */}
        <section className="space-y-4 pt-4 border-t border-border/50">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.2em]">06. Telemetry_Ingress_Feeds</span>
              <span className="text-[8px] font-mono text-accent-cyan/60 uppercase">Pipeline_Direct</span>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  try {
                    const target = targetNodeId || 'pc-admin-hq';
                    const response = await fetch('/api/v1/telemetry/wazuh', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        rule: { id: "100201", level: 10, description: "Wazuh SIEM alert: privilege escalation suspicious code run in powershell.exe" },
                        agent: { name: target },
                        data: { srcip: "185.220.101.5", user: "administrator", process: "powershell" }
                      })
                    });
                    if (response.ok) {
                      triggerActionFeedback('wazuh-trigger');
                    }
                  } catch (err) {
                    console.error('Wazuh ingest trigger error', err);
                  }
                }}
                className={cn(
                  "precision-button h-16 flex flex-col items-center justify-center gap-1.5 text-center p-2 hover:bg-accent-cyan/10 transition-all text-text-secondary",
                  activeActions['wazuh-trigger'] && "bg-accent-cyan text-void"
                )}
              >
                <Shield size={14} className="text-accent-cyan" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-inter font-bold tracking-tight">INGEST_WAZUH</span>
                  <span className="text-[7px] opacity-60 font-mono text-accent-cyan lowercase">Endpoint SIEM</span>
                </div>
              </button>

              <button
                onClick={async () => {
                  try {
                    const target = targetNodeId || 'k8s-pod-auth-api-559b';
                    const response = await fetch('/api/v1/telemetry/falco', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        time: new Date().toISOString(),
                        rule: "Falco Container Guard Hook: Interactive Shell Run",
                        priority: "Critical",
                        output: `Interactive bash shell opened in pod ${target} in production namespace by user root`,
                        container: "auth-api-container",
                        k8s: { pod: target, ns: "production" }
                      })
                    });
                    if (response.ok) {
                      triggerActionFeedback('falco-trigger');
                    }
                  } catch (err) {
                    console.error('Falco ingest trigger error', err);
                  }
                }}
                className={cn(
                  "precision-button h-16 flex flex-col items-center justify-center gap-1.5 text-center p-2 hover:bg-state-warning/10 transition-all text-text-secondary",
                  activeActions['falco-trigger'] && "bg-state-warning text-void"
                )}
              >
                <Bug size={14} className="text-state-warning" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-inter font-bold tracking-tight">INGEST_FALCO</span>
                  <span className="text-[7px] opacity-60 font-mono text-state-warning lowercase">Runtime eBPF</span>
                </div>
              </button>
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
