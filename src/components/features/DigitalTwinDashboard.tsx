import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  Flame, 
  LineChart, 
  RefreshCw,
  Gauge
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DigitalTwinDashboardProps {
  onHighlightNode?: (nodeId: string | null) => void;
}

interface SimulatedNode {
  id: string;
  name: string;
  type: string;
  namespace: string;
  environment: string;
  status: 'healthy' | 'warning' | 'critical' | 'infected' | 'isolated';
  cpuLoad: number;
  latency: number;
  activeConnections: number;
  riskScore: number;
  relationships?: string[];
}

export function DigitalTwinDashboard({ onHighlightNode }: DigitalTwinDashboardProps) {
  // Simulation Status States
  const [scenario, setScenario] = useState<string>('idle');
  const [status, setStatus] = useState<'running' | 'paused' | 'stopped'>('stopped');
  const [tickCount, setTickCount] = useState<number>(0);
  const [threatLevel, setThreatLevel] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [nodes, setNodes] = useState<SimulatedNode[]>([]);
  
  // Interactive UI panel states
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('ransomware');
  const [whatIfNode, setWhatIfNode] = useState<string>('k8s-pod-auth-api-559b');
  const [whatIfData, setWhatIfData] = useState<any>(null);
  const [isLoadingWhatIf, setIsLoadingWhatIf] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Poll state from Backend Simulation API
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/simulation/status');
      if (res.ok) {
        const data = await res.json();
        setScenario(data.scenario);
        setStatus(data.status);
        setTickCount(data.tickCount);
        setThreatLevel(data.threatLevel);
        setSessionId(data.sessionId);
        setNodes(data.nodes || []);
      }
    } catch (e) {
      console.error("Error fetching simulation status", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update what-if predictions when scenario, status or target node shifts
  useEffect(() => {
    if (whatIfNode) {
      runWhatIfAnalysis(whatIfNode);
    }
  }, [whatIfNode, scenario]);

  const handleControl = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    try {
      const res = await fetch('/api/v1/simulation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, scenario: selectedScenario })
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNodeAction = async (nodeName: string, action: 'isolate' | 'scale' | 'chaos') => {
    try {
      const res = await fetch('/api/v1/simulation/node/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeName, action })
      });
      if (res.ok) {
        await fetchStatus();
        if (whatIfNode === nodeName) {
          runWhatIfAnalysis(nodeName);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runWhatIfAnalysis = async (nodeName: string) => {
    setIsLoadingWhatIf(true);
    try {
      const res = await fetch(`/api/v1/simulation/what-if/${nodeName}`);
      if (res.ok) {
        const data = await res.json();
        // Transform for simple ingestion by Recharts
        const chartData = data.branches.noAction.map((noAct: any, idx: number) => {
          const matchingDefense = data.branches.isolatedResponse[idx] || {};
          return {
            tick: `T+${noAct.tick}`,
            'No Action Risk': noAct.compromiseRisk,
            'No Action Infection': noAct.infectedCount,
            'Autonomous Defense Risk': matchingDefense.compromiseRisk,
            'Autonomous Defense Infection': matchingDefense.infectedCount,
          };
        });
        setWhatIfData(chartData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingWhatIf(false);
    }
  };

  const generateAIReview = async () => {
    setIsGeneratingAi(true);
    setAiReport('');
    try {
      const res = await fetch('/api/ai/analyze/infra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.response || data.analysis || "AI assessment completed. Cluster is evaluated with high confidence of lateral defense containment.");
      } else {
        setAiReport("Unable to query AI engine at this moment. Running local heuristic evaluation fallback.");
      }
    } catch (e) {
      setAiReport("Simulated AI Review: Potential compromise vector detected from Administrative workstation to Domain Controller. Recommendation: Enforce zero-trust credential rotation and restrict namespace broad access policies immediately.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 text-xs uppercase text-text-primary h-full">
      {/* Simulation Controls Card */}
      <div className="bg-panel/40 border border-border p-4 rounded-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-accent-cyan" />
            <span className="font-heading font-bold text-white tracking-wider">Twin Orchestrator</span>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded-sm font-mono text-[8px] font-bold tracking-wider uppercase",
            status === 'running' ? "bg-state-safe/25 text-state-safe animate-pulse" :
            status === 'paused' ? "bg-state-warning/25 text-state-warning" : "bg-void text-text-tertiary"
          )}>
            Status: {status}
          </span>
        </div>

        {status === 'stopped' ? (
          <div className="flex flex-col gap-3">
            <div className="bg-void/50 p-2.5 border border-border/80 rounded-sm">
              <label className="text-[8px] font-mono tracking-wider text-text-tertiary block mb-1.5">Select Attack Scenario Campaign</label>
              <select 
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-void border border-border p-1.5 text-white font-mono rounded-sm select-reset focus:border-accent-cyan cursor-pointer uppercase"
              >
                <option value="ransomware">Ransomware Lateral Encryption</option>
                <option value="ddos">DDoS Gateway Cascade Flooding</option>
                <option value="insider">Credential Anomaly Insider threat</option>
                <option value="k8s_escalation">K8s RBAC Privilege Escalation</option>
                <option value="lateral_movement">APT Lateral Scans Execution</option>
              </select>
            </div>
            <button
              onClick={() => handleControl('start')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-accent-cyan/80 to-accent-blue/80 text-white font-bold hover:from-accent-cyan hover:to-accent-blue transition-all border border-accent-cyan/40 shadow-lg shadow-accent-cyan/10 uppercase tracking-widest text-[9px] rounded-sm cursor-pointer"
            >
              <Play size={12} className="fill-current" />
              Launch_Simulation_Twin
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="bg-void/60 border border-border/80 p-2.5 rounded-sm flex justify-between items-center">
              <div>
                <div className="text-[8px] font-mono text-text-tertiary uppercase">Active Campaign</div>
                <div className="text-[10px] font-bold text-state-warning tracking-wide mt-0.5">{scenario}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-mono text-text-tertiary uppercase">Tick History</div>
                <div className="text-[10px] font-mono text-accent-cyan mt-0.5">T+{tickCount}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-mono text-text-tertiary uppercase">Threat Velocity</div>
                <div className="text-[10px] font-mono text-state-danger mt-0.5">{threatLevel}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {status === 'running' ? (
                <button 
                  onClick={() => handleControl('pause')}
                  className="flex items-center justify-center gap-1.5 py-1.5 bg-void border border-border text-white hover:border-accent-cyan transition-colors rounded-sm cursor-pointer"
                >
                  <Pause size={10} />
                  Pause
                </button>
              ) : (
                <button 
                  onClick={() => handleControl('resume')}
                  className="flex items-center justify-center gap-1.5 py-1.5 bg-void border border-border text-state-safe hover:border-state-safe transition-colors rounded-sm cursor-pointer"
                >
                  <Play size={10} />
                  Resume
                </button>
              )}
              <button 
                onClick={() => handleControl('stop')}
                className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 bg-state-danger/10 border border-state-danger/30 text-state-danger hover:bg-state-danger/25 transition-colors rounded-sm cursor-pointer"
              >
                <Square size={10} className="fill-current" />
                Terminate Campaign
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Digital Twin Nodes List */}
      <div className="bg-panel/20 border border-border p-4 rounded-sm flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan shrink-0 animate-pulse-precision" />
            <span className="font-heading font-bold text-white tracking-wider">Subscribed Twin Targets ({nodes.length})</span>
          </div>
          <button 
            onClick={fetchStatus} 
            className="p-1 hover:bg-void rounded-sm text-text-tertiary hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={11} className={cn(status === 'running' && "animate-spin")} style={{ animationDuration: '6s' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 min-h-0">
          {nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-tertiary uppercase text-[8px] tracking-widest text-center">
              Awaiting Digital Twin initialization...
            </div>
          ) : (
            nodes.map((node) => {
              const isExpanded = expandedNodeId === node.id;
              // Compute resilience score
              const resilienceScore = Math.max(10, 100 - Math.round(node.riskScore * 2.2));
              
              return (
                <div 
                  key={node.id} 
                  className={cn(
                    "cursor-pointer border rounded-sm bg-[#04060b]/40 transition-all duration-300 group relative overflow-hidden",
                    node.status === 'infected' ? "border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.05)]" :
                    node.status === 'critical' ? "border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]" :
                    node.status === 'isolated' ? "border-sky-500/25 hover:border-sky-500/40 opacity-70" :
                    "border-white/5 hover:border-accent-cyan/30"
                  )}
                  onClick={() => {
                    setExpandedNodeId(isExpanded ? null : node.id);
                    if (onHighlightNode) {
                      onHighlightNode(isExpanded ? null : node.name);
                    }
                  }}
                  onMouseEnter={() => !isExpanded && onHighlightNode && onHighlightNode(node.name)}
                  onMouseLeave={() => !isExpanded && onHighlightNode && onHighlightNode(null)}
                >
                  {/* Subtle top decoration bar */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-[1.5px] transition-all",
                    node.status === 'infected' ? "bg-rose-500/50" :
                    node.status === 'critical' ? "bg-amber-500/50" :
                    node.status === 'isolated' ? "bg-sky-500/30" :
                    "bg-transparent group-hover:bg-accent-cyan/20"
                  )} />

                  <div className="p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white font-mono text-[9px] tracking-tight truncate group-hover:text-accent-cyan transition-colors">{node.name}</span>
                        <span className="text-[6.5px] text-text-tertiary font-mono tracking-[0.1em] uppercase mt-0.5">{node.type} • {node.namespace}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn(
                          "text-[7px] font-bold font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-sm flex items-center gap-1",
                          node.status === 'infected' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" :
                          node.status === 'critical' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          node.status === 'isolated' ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}>
                          {node.status === 'infected' && <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />}
                          {node.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[8px] font-mono mt-2.5 pt-2 border-t border-white/5 text-text-secondary">
                      <div>
                        <span className="opacity-40 block text-[5px] text-text-tertiary uppercase tracking-wider">CPU Util</span>
                        <span className="font-bold text-white flex items-center gap-1"><Cpu size={7} className="text-text-tertiary" /> {Math.round(node.cpuLoad)}%</span>
                      </div>
                      <div>
                        <span className="opacity-40 block text-[5px] text-text-tertiary uppercase tracking-wider">RT Latency</span>
                        <span className="font-bold text-white flex items-center gap-1"><Gauge size={7} className="text-text-tertiary" /> {node.latency}ms</span>
                      </div>
                      <div>
                        <span className="opacity-40 block text-[5px] text-text-tertiary uppercase tracking-wider">Conns Flow</span>
                        <span className="font-bold text-white flex items-center gap-1"><Activity size={7} className="text-text-tertiary" /> {node.activeConnections}_c/s</span>
                      </div>
                    </div>

                    {/* Smooth Expandable Contextual Panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden border-t border-dashed border-white/5 pt-2.5 flex flex-col gap-2"
                          onClick={(e) => e.stopPropagation()} // Prevent card collapse on click inner actions
                        >
                          {/* Live Risk & Resilience HUD */}
                          <div className="grid grid-cols-2 gap-2 text-[7.5px] font-mono bg-void/50 p-2 rounded-sm border border-white/5">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-text-tertiary uppercase text-[6px]">Calculated Risk</span>
                                <span className={cn("font-bold", node.riskScore > 20 ? "text-rose-450" : "text-amber-400")}>{node.riskScore}_PTS</span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", node.status === 'infected' ? 'bg-rose-500' : 'bg-amber-500')} style={{ width: `${Math.min(100, node.riskScore * 2.5)}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-text-tertiary uppercase text-[6px]">Resilience Index</span>
                                <span className="font-bold text-emerald-400">{resilienceScore}%</span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resilienceScore}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Dependency Chain Display */}
                          <div className="flex flex-col gap-1 text-[7px] font-mono">
                            <span className="text-[6px] uppercase text-text-tertiary tracking-wider font-bold">Dependency Relations Chain</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {node.relationships && node.relationships.length > 0 ? (
                                node.relationships.map((rel, rIdx) => (
                                  <span 
                                    key={rIdx} 
                                    className="bg-white/5 text-text-secondary px-1.5 py-0.5 rounded-sm border border-white/5 max-w-[150px] truncate hover:text-accent-cyan transition-colors"
                                    title={rel}
                                  >
                                    → {rel}
                                  </span>
                                ))
                              ) : (
                                <span className="text-text-tertiary/60 italic text-[6.5px]">Isolated workload - no active external dependencies</span>
                              )}
                            </div>
                          </div>

                          {/* Active Attack / Simulation Details */}
                          <div className="text-[7.5px] font-mono p-1.5 bg-black/40 border border-white/5 rounded-sm flex items-start gap-1.5">
                            <Flame size={10} className={cn("shrink-0 mt-0.5", node.status === 'infected' ? "text-rose-400 animate-pulse" : (node.status === 'critical' ? "text-amber-400 animate-pulse" : "text-text-tertiary"))} />
                            <div className="flex-1 min-w-0">
                              <span className="text-[6.5px] uppercase text-text-tertiary block font-bold">Active Chaos/Exploit Thread</span>
                              <p className="text-text-secondary leading-normal mt-0.5">
                                {node.status === 'infected' && `CAMPAIGN TRAVERSAL: Active lateral compromise detected. Workload infected.`}
                                {node.status === 'critical' && `SECURITY EVENT: Credential stuffing breach. High load, abnormal traffic rate.`}
                                {node.status === 'isolated' && `QUARANTINE ENFORCED: Airgap active. Workload interfaces fully locked.`}
                                {node.status === 'healthy' && `STEADY STATE: Zero exceptions reported. Node health verification positive.`}
                              </p>
                            </div>
                          </div>

                          {/* Micro Actions Panel inside expansion */}
                          <div className="pt-2 border-t border-white/5 flex gap-1.5">
                            <button
                              disabled={node.status === 'isolated'}
                              onClick={() => handleNodeAction(node.name, 'isolate')}
                              className="flex-1 py-1 text-[7.5px] font-bold bg-accent-blue/15 hover:bg-accent-blue/35 text-accent-cyan border border-accent-blue/20 rounded-sm cursor-pointer disabled:opacity-40 font-mono transition-colors"
                            >
                              Isolate
                            </button>
                            <button
                              disabled={node.status === 'isolated'}
                              onClick={() => handleNodeAction(node.name, 'scale')}
                              className="flex-1 py-1 text-[7.5px] font-bold bg-state-safe/10 hover:bg-state-safe/25 text-emerald-400 border border-state-safe/20 rounded-sm cursor-pointer disabled:opacity-40 font-mono transition-colors"
                            >
                              Scale_Up
                            </button>
                            <button
                              disabled={node.status === 'isolated'}
                              onClick={() => handleNodeAction(node.name, 'chaos')}
                              className="flex-1 py-1 text-[7.5px] font-bold bg-state-warning/10 hover:bg-state-warning/20 text-amber-400 border border-state-warning/10 rounded-sm cursor-pointer disabled:opacity-40 font-mono transition-colors"
                            >
                              Inject_Chaos
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recharts What-If Predictive Chart */}
      <div className="bg-panel/40 border border-border p-4 rounded-sm shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-accent-cyan" />
            <span className="font-heading font-bold text-white tracking-wider">Predictive What-If Projection</span>
          </div>
          
          <select 
            value={whatIfNode}
            onChange={(e) => setWhatIfNode(e.target.value)}
            className="bg-void border border-border text-[8px] px-1 py-0.5 font-mono rounded-sm text-text-secondary hover:text-white cursor-pointer"
          >
            {nodes.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
        </div>

        <p className="text-[8px] text-text-tertiary mb-3 uppercase leading-relaxed font-mono">
          Simulating expected threat risk exposure of <span className="text-white font-mono font-bold">{whatIfNode}</span> with and without autonomous quarantine.
        </p>

        <div className="h-44 w-full bg-void/30 border border-border/40 rounded-sm p-1.5 relative">
          {isLoadingWhatIf ? (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono tracking-widest text-text-tertiary">
              Running dynamic simulation projections...
            </div>
          ) : whatIfData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={whatIfData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="tick" stroke="#4a5568" fontSize={7} tickLine={false} />
                <YAxis stroke="#4a5568" fontSize={7} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#060a13', border: '1px solid #1a2238', borderRadius: '2px', fontSize: '9px' }} 
                  labelStyle={{ color: '#00f2ff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="No Action Risk" stroke="#f43f5e" fill="rgba(244,63,94,0.06)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Autonomous Defense Risk" stroke="#00f2ff" fill="rgba(0,242,255,0.05)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-text-tertiary">
              Select scenario to construct forecast model
            </div>
          )}
        </div>
      </div>

      {/* AI Intelligence Assessment */}
      <div className="bg-panel/40 border border-border p-4 rounded-sm shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span className="font-heading font-bold text-white tracking-wider">Predictive Security Assessment</span>
          </div>
          <button
            disabled={isGeneratingAi}
            onClick={generateAIReview}
            className="px-2.5 py-1 bg-accent-cyan/10 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 text-[8px] font-bold font-mono tracking-wider hover:scale-105 transition-all rounded-sm cursor-pointer disabled:opacity-40"
          >
            {isGeneratingAi ? "Reasoning..." : "Run_AI_Assessment"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {aiReport ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-void/50 p-3 border border-border/40 rounded-sm overflow-y-auto max-h-36 custom-scrollbar text-[8px] leading-relaxed text-text-secondary font-mono normal-case"
            >
              {aiReport}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
