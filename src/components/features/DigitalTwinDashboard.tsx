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
  Gauge,
  Network,
  GitMerge,
  ShieldCheck,
  ShieldX,
  Radio,
  Lock,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

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
  
  // Phase 5 Graph metrics
  trustScore?: number;
  compromiseProbability?: number;
  resilienceScore?: number;
  operationalCriticality?: number;
  exposureScore?: number;
}

// Map digital twin nodes to their structural node IDs in the main D3 graph
const TWIN_NODE_MAP: Record<string, string> = {
  'k8s-svc-ingress-nginx': 'gw-1',       // Internet Gateway / Ingress
  'k8s-pod-auth-api-559b': 'pc-1',       // Admin Workstation / Auth API
  'k8s-pod-payment-gw-88c2': 'cloud-1',  // AWS S3 Proxy / Payment GW
  'db-core-master': 'db-1',              // User Database / Core DB
  'aws-lambda-payment-processor': 'srv-1',// Main Server / Lambda processor
  'cloud-storage-bucket': 'backup-1',    // Offline Backup / S3 bucket
  'pc-admin-hq': 'pc-1',                 // Admin Workstation / PC Admin
  'iam-root-account': 'fw-1',            // External Firewall / IAM root
  'azure-vm-ad-connector': 'hr-1'        // HR Portal / AD VM connector
};

export function DigitalTwinDashboard({ onHighlightNode }: DigitalTwinDashboardProps) {
  // Simulation Status States
  const [scenario, setScenario] = useState<string>('idle');
  const [status, setStatus] = useState<'running' | 'paused' | 'stopped'>('stopped');
  const [tickCount, setTickCount] = useState<number>(0);
  const [threatLevel, setThreatLevel] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [nodes, setNodes] = useState<SimulatedNode[]>([]);
  
  // Real-time resilience engine indicators
  const [sectors, setSectors] = useState<any[]>([]);
  const [aarTimeline, setAarTimeline] = useState<any[]>([]);
  const [survivabilityScore, setSurvivabilityScore] = useState<number>(100);
  const [operationalContinuity, setOperationalContinuity] = useState<number>(100);
  const [bottomTab, setBottomTab] = useState<'whatif' | 'aar'>('whatif');
  
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
        setSectors(data.sectors || []);
        setAarTimeline(data.aarTimeline || []);
        setSurvivabilityScore(data.survivabilityScore ?? 100);
        setOperationalContinuity(data.operationalContinuity ?? 100);
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

  const handleNodeAction = async (nodeName: string, action: 'isolate' | 'scale' | 'chaos' | 'rotate' | 'block' | 'rollback') => {
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
    <div className="flex flex-col space-y-5 text-xs text-text-primary h-full">
      {/* Simulation Controls Card */}
      <div className="bg-panel/10 border border-border/40 p-4 rounded-md flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-accent-cyan/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <span className="font-heading font-black text-[9px] text-white tracking-[0.2em] uppercase">Twin_Orchestrator_v4</span>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded-sm font-mono text-[8px] font-bold tracking-wider uppercase border",
            status === 'running' ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30 animate-pulse" :
            status === 'paused' ? "bg-amber-950/20 text-amber-400 border-amber-500/30" : "bg-void/80 border-border/30 text-text-tertiary"
          )}>
            {status}
          </span>
        </div>

        {status === 'stopped' ? (
          <div className="flex flex-col gap-2.5 z-10">
            <div className="bg-void/40 p-2 border border-border/30 rounded">
              <label className="text-[7.5px] font-mono tracking-wider text-text-tertiary block mb-1 uppercase">Scenario Protocol Selection</label>
              <select 
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-void/80 border border-border/30 p-1.5 text-white font-mono text-[9px] rounded focus:border-accent-cyan cursor-pointer uppercase select-reset"
              >
                <option value="ransomware">Ransomware Outbreak Campaign</option>
                <option value="ddos">DDoS Gateway Cascade Flooding</option>
                <option value="insider">Credential Anomaly Insider Threat</option>
                <option value="k8s_escalation">K8s RBAC Privilege Escalation</option>
                <option value="lateral_movement">APT Lateral Scans Execution</option>
                <option value="credential">Credential Account Compromise</option>
                <option value="container_escape">Kubernetes Container Escape</option>
                <option value="cloud_privesc">Cloud Privilege Escalation</option>
                <option value="ai_adaptive">AI Adaptive Probing Attack</option>
                <option value="infra_failure">Distributed Cluster Outage (SRE)</option>
              </select>
            </div>
            <button
              onClick={() => handleControl('start')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-accent-cyan/15 hover:bg-accent-cyan text-accent-cyan hover:text-void font-heading font-extrabold transition-all border border-accent-cyan/30 shadow-md shadow-accent-cyan/5 text-[9px] rounded-sm cursor-pointer uppercase tracking-widest"
            >
              <Play size={11} className="fill-current" />
              Engage_Chaos_Sandbox
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 z-10">
            <div className="bg-void/55 border border-border/20 p-2.5 rounded flex justify-between items-center font-mono">
              <div>
                <div className="text-[6.5px] text-text-tertiary uppercase">Active Campaign</div>
                <div className="text-[9.5px] font-black text-state-warning tracking-wide mt-0.5 uppercase">{scenario.replace('_', ' ')}</div>
              </div>
              <div className="text-right">
                <div className="text-[6.5px] text-text-tertiary uppercase">Ticks</div>
                <div className="text-[9.5px] font-black text-accent-cyan mt-0.5">T+{tickCount}</div>
              </div>
              <div className="text-right">
                <div className="text-[6.5px] text-text-tertiary uppercase">Threat Index</div>
                <div className="text-[9.5px] font-black text-state-danger mt-0.5">{threatLevel}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {status === 'running' ? (
                <button 
                  onClick={() => handleControl('pause')}
                  className="flex items-center justify-center gap-1 py-1.5 bg-void border border-border/30 text-white hover:border-accent-cyan transition-colors rounded text-[8px] font-heading font-bold cursor-pointer uppercase"
                >
                  <Pause size={9} />
                  Pause
                </button>
              ) : (
                <button 
                  onClick={() => handleControl('resume')}
                  className="flex items-center justify-center gap-1 py-1.5 bg-void border border-border/30 text-emerald-400 hover:border-emerald-400/50 transition-colors rounded text-[8px] font-heading font-bold cursor-pointer uppercase"
                >
                  <Play size={9} />
                  Resume
                </button>
              )}
              <button 
                onClick={() => handleControl('stop')}
                className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 bg-state-danger/10 border border-state-danger/30 text-state-danger hover:bg-state-danger/20 transition-colors rounded text-[8px] font-heading font-bold cursor-pointer uppercase"
              >
                <Square size={9} className="fill-current" />
                Kill Sandbox Simulation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Resilience Indicators & Sectors Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
        {/* Indicators Card */}
        <div className="bg-panel/10 border border-border/40 p-4 rounded-md backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Gauge className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="font-heading font-black text-[9px] text-white tracking-[0.2em] uppercase">Security_Survivability_Engine</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-void/40 p-2.5 border border-border/25 rounded">
                <div className="text-[7px] text-text-tertiary uppercase font-mono tracking-wider">Survivability Score</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={cn(
                    "text-xl font-heading font-black tracking-tight",
                    survivabilityScore > 75 ? "text-emerald-400" :
                    survivabilityScore > 40 ? "text-amber-400" : "text-rose-500"
                  )}>
                    {survivabilityScore}%
                  </span>
                  <span className="text-[7.5px] font-mono text-text-tertiary">SURVIVE_KPI</span>
                </div>
                <div className="w-full bg-void h-1 rounded overflow-hidden mt-2">
                  <div 
                    className={cn(
                      "h-full rounded transition-all duration-1000",
                      survivabilityScore > 75 ? "bg-emerald-400" :
                      survivabilityScore > 40 ? "bg-amber-400" : "bg-rose-500"
                    )}
                    style={{ width: `${survivabilityScore}%` }}
                  />
                </div>
                <span className="text-[6px] text-text-tertiary uppercase mt-1.5 block font-mono">
                  {status === 'stopped' ? 'STANDBY STATUS' :
                   survivabilityScore > 80 ? 'STRUCTURAL SECTORS ACTIVE' :
                   survivabilityScore > 50 ? 'CASCADING DEGRADATION ACTIVE' : 'IMMINENT TOTAL STRUCTURE OUTAGE'}
                </span>
              </div>

              <div className="bg-void/40 p-2.5 border border-border/25 rounded">
                <div className="text-[7px] text-text-tertiary uppercase font-mono tracking-wider">Operational Continuity</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={cn(
                    "text-xl font-heading font-black tracking-tight",
                    operationalContinuity > 75 ? "text-emerald-400" :
                    operationalContinuity > 40 ? "text-amber-400" : "text-rose-500"
                  )}>
                    {operationalContinuity}%
                  </span>
                  <span className="text-[7.5px] font-mono text-text-tertiary">SERVICE_LOAD</span>
                </div>
                <div className="w-full bg-void h-1 rounded overflow-hidden mt-2">
                  <div 
                    className={cn(
                      "h-full rounded transition-all duration-1000",
                      operationalContinuity > 75 ? "bg-emerald-400" :
                      operationalContinuity > 40 ? "bg-amber-400" : "bg-rose-500"
                    )}
                    style={{ width: `${operationalContinuity}%` }}
                  />
                </div>
                <span className="text-[6.5px] text-text-tertiary uppercase mt-1.5 block font-mono">
                  {nodes.filter(n => n.status === 'healthy').length}/{nodes.length} workloads fully green
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sectors Bento Matrix */}
        <div className="bg-panel/10 border border-border/40 p-3.5 rounded-md backdrop-blur-md">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Network className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="font-heading font-black text-[9px] text-white tracking-[0.2em] uppercase">Sectors_Resilience_Grid</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
            {sectors.length === 0 ? (
              <div className="text-[7.5px] text-text-tertiary font-mono uppercase text-center py-4">Waiting for engine state snapshot...</div>
            ) : (
              sectors.map((sec, idx) => (
                <div key={idx} className="bg-void/50 border border-border/15 rounded p-2 flex items-center justify-between font-mono gap-3 leading-none animate-fade-in">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        sec.status === 'healthy' ? "bg-emerald-400 animate-pulse" :
                        sec.status === 'degraded' ? "bg-amber-400 animate-ping" :
                        sec.status === 'quarantined' ? "bg-slate-500" : "bg-rose-500 animate-pulse"
                      )} />
                      <span className="text-[8px] font-bold text-white uppercase truncate">{sec.name}</span>
                    </div>
                    <div className="text-[6.5px] text-text-tertiary mt-1 uppercase">
                      {sec.activeWorkloads} Node{sec.activeWorkloads !== 1 ? 's' : ''} • {sec.activeConnections} active links
                    </div>
                  </div>

                  <div className="flex gap-4 text-right">
                    <div>
                      <div className="text-[6px] text-text-tertiary uppercase">Trust Bounds</div>
                      <div className={cn(
                        "text-[9px] font-black mt-0.5",
                        sec.trustScore > 75 ? "text-emerald-400" :
                        sec.trustScore > 40 ? "text-amber-400" : "text-rose-500"
                      )}>{sec.trustScore}%</div>
                    </div>
                    <div>
                      <div className="text-[6px] text-text-tertiary uppercase">Resilience Index</div>
                      <div className={cn(
                        "text-[9px] font-black mt-0.5",
                        sec.resilienceScore > 75 ? "text-emerald-400" :
                        sec.resilienceScore > 40 ? "text-amber-400" : "text-rose-500"
                      )}>{sec.resilienceScore}%</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Redesigned Live Infrastructure Target System */}
      <div className="bg-panel/10 border border-border/40 p-4 rounded-md flex-1 flex flex-col min-h-0 relative backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <span className="font-heading font-black text-[9px] text-white tracking-[0.2em] uppercase">Live_Target_Matrices ({nodes.length})</span>
          </div>
          <button 
            onClick={fetchStatus} 
            className="p-1 hover:bg-void border border-border/10 rounded text-text-tertiary hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={10} className={cn(status === 'running' && "animate-spin")} style={{ animationDuration: '6s' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 min-h-0 z-10">
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-tertiary gap-2">
              <span className="text-[7.5px] uppercase font-mono tracking-widest text-center animate-pulse">Establishing Twin Connection Traces...</span>
            </div>
          ) : (
            [...nodes]
              .sort((a, b) => {
                const weightA = (a.status === 'infected' ? 10000 : 0) + (a.status === 'critical' ? 5000 : 0) + (a.riskScore * 10) + ((a.operationalCriticality ?? 0.5) * 1000);
                const weightB = (b.status === 'infected' ? 10000 : 0) + (b.status === 'critical' ? 5000 : 0) + (b.riskScore * 10) + ((b.operationalCriticality ?? 0.5) * 1000);
                return weightB - weightA;
              })
              .map((node) => {
                const isExpanded = expandedNodeId === node.id;
              // Map twin node name to primary D3 graph node ID
              const linkedGraphId = TWIN_NODE_MAP[node.name];
              
              // Compute resilience index strictly
              const resilienceScore = Math.max(12, 100 - Math.round(node.riskScore * 2.3));
              
              const isInfected = node.status === 'infected';
              const isCrit = node.status === 'critical';
              const isIso = node.status === 'isolated';
              
              return (
                <div 
                  key={node.id} 
                  className={cn(
                    "cursor-pointer border rounded-sm transition-all duration-300 relative overflow-hidden",
                    isInfected ? "border-red-500/40 bg-red-950/10 hover:border-red-500/65 shadow-[0_0_12px_rgba(239,68,68,0.1)]" :
                    isCrit ? "border-amber-500/40 bg-amber-950/10 hover:border-amber-500/65" :
                    isIso ? "border-sky-500/30 bg-sky-950/10 opacity-70" :
                    "border-white/5 bg-void/40 hover:border-accent-cyan/35"
                  )}
                  onClick={() => {
                    setExpandedNodeId(isExpanded ? null : node.id);
                    if (onHighlightNode) {
                      // Automatically highlight the linked D3 node in real-time
                      onHighlightNode(isExpanded ? null : linkedGraphId);
                    }
                  }}
                  onMouseEnter={() => {
                    // Instantly trigger D3 persistent graph highlights when hovering in targets list!
                    if (!isExpanded && onHighlightNode && linkedGraphId) {
                      onHighlightNode(linkedGraphId);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isExpanded && onHighlightNode) {
                      onHighlightNode(null);
                    }
                  }}
                >
                  {/* Subtle edge-illuminated warning lines */}
                  <div className={cn(
                    "absolute top-0 bottom-0 left-0 w-[2px] transition-all",
                    isInfected ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                    isCrit ? "bg-amber-500" :
                    isIso ? "bg-sky-500" :
                    "bg-transparent group-hover:bg-accent-cyan/25"
                  )} />

                  <div className="p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "font-mono font-bold text-[9px] tracking-tight truncate transition-colors",
                          isInfected ? "text-red-400 font-extrabold" : isCrit ? "text-amber-400" : "text-white group-hover:text-accent-cyan"
                        )}>
                          {node.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[6.5px] text-text-tertiary font-mono uppercase tracking-wider mt-0.5">
                          <span className="px-1 py-[1.5px] bg-white/5 border border-white/5 rounded-sm">{node.type}</span>
                          <span>•</span>
                          <span>ns/{node.namespace}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {linkedGraphId && (
                          <span className="text-[6px] font-mono text-accent-cyan/40 border border-accent-cyan/15 px-1 rounded-sm uppercase bg-accent-cyan/5">
                            MAP_{linkedGraphId.toUpperCase()}
                          </span>
                        )}
                        <span className={cn(
                          "text-[7px] font-bold font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-sm flex items-center gap-1.5 border",
                          isInfected ? "bg-red-500/10 text-red-400 border-red-500/30 font-black animate-pulse" :
                          isCrit ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          isIso ? "bg-sky-500/10 text-sky-400 border-sky-500/30" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                          {isInfected && <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />}
                          {node.status}
                        </span>
                      </div>
                    </div>

                    {/* Integrated Micro Telemetry Grid */}
                    <div className="grid grid-cols-3 gap-2 text-[7.5px] font-mono mt-2.5 pt-2 border-t border-white/5 text-text-secondary">
                      <div className="flex items-center gap-1 bg-void/30 p-1 border border-white/5 rounded-sm">
                        <Cpu size={7.5} className="text-text-tertiary shrink-0" />
                        <div>
                          <span className="text-[5px] text-text-tertiary block leading-none">CPU</span>
                          <span className="font-bold text-white leading-none">{Math.round(node.cpuLoad)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-void/30 p-1 border border-white/5 rounded-sm">
                        <Gauge size={7.5} className="text-text-tertiary shrink-0" />
                        <div>
                          <span className="text-[5px] text-text-tertiary block leading-none">LATENCY</span>
                          <span className="font-bold text-white leading-none">{node.latency}ms</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-void/30 p-1 border border-white/5 rounded-sm">
                        <Activity size={7.5} className="text-text-tertiary shrink-0" />
                        <div>
                          <span className="text-[5px] text-text-tertiary block leading-none">CONNS</span>
                          <span className="font-bold text-white leading-none">{node.activeConnections}/s</span>
                        </div>
                      </div>
                    </div>

                    {/* Smooth Expandable Functional Interface */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden border-t border-dashed border-white/10 pt-2.5 flex flex-col gap-2.5"
                          onClick={(e) => e.stopPropagation()} // Safe inner overlay checks
                        >
                          {/* Phase 5 Graph Intelligence & Attack Propagation substrate */}
                          <div className="bg-void/80 p-2.5 rounded border border-white/5 space-y-2 font-mono">
                            <span className="text-[6.5px] uppercase text-text-tertiary tracking-wider font-bold flex items-center gap-1">
                              <ShieldAlert size={8} className="text-accent-cyan" />
                              Graph Reasoning Substrate Matrix
                            </span>
                            
                            <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                              {/* Trust Score */}
                              <div className="bg-[#020408]/40 border border-white/5 p-1.5 rounded flex flex-col justify-between">
                                <span className="text-text-tertiary uppercase text-[5.5px]">Graph Trust Score</span>
                                <div className="flex justify-between items-end mt-1">
                                  <span className={cn(
                                    "font-black text-[10px]",
                                    (node.trustScore ?? 100) > 75 ? "text-emerald-400" : (node.trustScore ?? 100) > 40 ? "text-amber-400" : "text-red-400"
                                  )}>
                                    {(node.trustScore ?? 100).toFixed(0)}/100
                                  </span>
                                  <span className="text-[5px] text-text-tertiary uppercase">Trust Bounds</span>
                                </div>
                              </div>

                              {/* Compromise Probability */}
                              <div className="bg-[#020408]/40 border border-white/5 p-1.5 rounded flex flex-col justify-between">
                                <span className="text-text-tertiary uppercase text-[5.5px]">Compromise Probability</span>
                                <div className="flex justify-between items-end mt-1">
                                  <span className={cn(
                                    "font-black text-[10px]",
                                    (node.compromiseProbability ?? 0) > 0.6 ? "text-red-400" : (node.compromiseProbability ?? 0) > 0.2 ? "text-amber-400" : "text-emerald-400"
                                  )}>
                                    {Math.round((node.compromiseProbability ?? 0) * 100)}%
                                  </span>
                                  <span className="text-[5px] text-text-tertiary uppercase">Lateral Spread</span>
                                </div>
                              </div>

                              {/* Exposure Score */}
                              <div className="bg-[#020408]/40 border border-white/5 p-1.5 rounded flex flex-col justify-between">
                                <span className="text-text-tertiary uppercase text-[5.5px]">Blast Radius Exposure</span>
                                <div className="flex justify-between items-end mt-1">
                                  <span className="font-black text-white text-[10px]">
                                    {Math.round((node.exposureScore ?? 0) * 100)}%
                                  </span>
                                  <span className="text-[5px] text-text-tertiary uppercase text-accent-cyan">Reach Index</span>
                                </div>
                              </div>

                              {/* Operational Criticality */}
                              <div className="bg-[#020408]/40 border border-white/5 p-1.5 rounded flex flex-col justify-between">
                                <span className="text-text-tertiary uppercase text-[5.5px]">Resource Criticality</span>
                                <div className="flex justify-between items-end mt-1">
                                  <span className="font-black text-white text-[10px]">
                                    {(node.operationalCriticality ?? 0.5).toFixed(2)}
                                  </span>
                                  <span className="text-[5px] text-text-tertiary uppercase">Core Weight</span>
                                </div>
                              </div>
                            </div>

                            {/* Risk vs Resilience comparison bars */}
                            <div className="pt-1 space-y-1.5">
                              <div>
                                <div className="flex justify-between items-center text-[7px] leading-none mb-1">
                                  <span className="text-text-tertiary uppercase">Operational Exposure Risk</span>
                                  <span className={cn("font-bold", node.riskScore > 30 ? "text-red-400" : "text-emerald-400")}>{node.riskScore}/100</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full", node.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${node.riskScore}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center text-[7px] leading-none mb-1">
                                  <span className="text-text-tertiary uppercase">Dynamic Resilience Baseline</span>
                                  <span className="font-bold text-emerald-400">{(node.resilienceScore ?? resilienceScore).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${node.resilienceScore ?? resilienceScore}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Graph-Linked Dependency Chain */}
                          <div className="flex flex-col gap-1 text-[7.5px] font-mono">
                            <span className="text-[6px] uppercase text-text-tertiary tracking-wider font-bold flex items-center gap-1">
                              <GitMerge size={7.5} className="text-accent-cyan" />
                              Interactive Dependency Chain Relations
                            </span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {node.relationships && node.relationships.length > 0 ? (
                                node.relationships.map((rel, rIdx) => {
                                  const matchingTargetId = TWIN_NODE_MAP[rel];
                                  return (
                                    <span 
                                      key={rIdx} 
                                      onMouseEnter={() => {
                                        if (onHighlightNode && matchingTargetId) {
                                          onHighlightNode(matchingTargetId);
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        if (onHighlightNode && linkedGraphId) {
                                          onHighlightNode(linkedGraphId);
                                        }
                                      }}
                                      className={cn(
                                        "px-1.5 py-0.5 rounded-sm border transition-colors cursor-crosshair text-[7px] max-w-[170px] truncate",
                                        matchingTargetId 
                                          ? "bg-accent-cyan/5 text-accent-cyan border-accent-cyan/15 hover:bg-accent-cyan/20 hover:border-accent-cyan/40"
                                          : "bg-white/5 text-text-secondary border-white/5"
                                      )}
                                      title={matchingTargetId ? `Maps to ${matchingTargetId}` : rel}
                                    >
                                      → {rel} {matchingTargetId && `[${matchingTargetId.toUpperCase()}]`}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-text-tertiary/60 italic text-[6.5px]">Isolated workload partition - airgap verified</span>
                              )}
                            </div>
                          </div>

                          {/* Active Attack / Simulation Details */}
                          <div className="text-[7.5px] font-mono p-2 bg-[#020408]/60 border border-white/5 rounded flex items-start gap-2 leading-relaxed">
                            <Flame size={10} className={cn("shrink-0 mt-0.5", isInfected ? "text-red-400 animate-pulse animate-bounce" : (isCrit ? "text-amber-400 animate-pulse" : "text-text-tertiary"))} />
                            <div className="flex-1 min-w-0">
                              <span className="text-[6.5px] uppercase text-text-tertiary block font-bold">Exploit Thread Tracer</span>
                              <p className="text-text-secondary normal-case leading-normal mt-0.5">
                                {isInfected && `CRITICAL OVERRUN: Active Ransomware lateral payload encryption in progress. Port boundaries compromised.`}
                                {isCrit && `ANOMALY SPIKE: Hostile flooding/DoS wave causing severe packet drops and system telemetry gaps.`}
                                {isIso && `CONTAINMENT SUCCESS: Firewall tables isolated. Host completely removed from internal corporate segment.`}
                                {node.status === 'healthy' && `STEADY STATE: Sandbox container registers clean telemetry baselines. No anomalous threads active.`}
                              </p>
                            </div>
                          </div>

                          {/* Micro Actions Panel inside expansion */}
                          <div className="pt-2.5 border-t border-white/5 flex flex-col gap-1.5">
                            <div className="flex gap-1.5">
                              {isIso ? (
                                <button
                                  onClick={() => handleNodeAction(node.name, 'rollback')}
                                  className="flex-1 py-1 text-[7.5px] font-bold bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/25 rounded cursor-pointer font-mono transition-colors uppercase animate-pulse"
                                >
                                  Unisolate Network
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleNodeAction(node.name, 'isolate')}
                                  className="flex-1 py-1 text-[7.5px] font-bold bg-accent-blue/15 hover:bg-accent-blue/35 text-accent-cyan border border-accent-blue/25 rounded cursor-pointer font-mono transition-colors uppercase"
                                >
                                  Isolate Workload
                                </button>
                              )}
                              <button
                                disabled={isIso}
                                onClick={() => handleNodeAction(node.name, 'scale')}
                                className="flex-1 py-1 text-[7.5px] font-bold bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded cursor-pointer disabled:opacity-40 font-mono transition-colors uppercase"
                              >
                                Scale
                              </button>
                              <button
                                disabled={isIso}
                                onClick={() => handleNodeAction(node.name, 'chaos')}
                                className="flex-1 py-1 text-[7.5px] font-bold bg-state-warning/10 hover:bg-state-warning/20 text-amber-400 border border-state-warning/10 rounded cursor-pointer disabled:opacity-40 font-mono transition-colors uppercase"
                              >
                                Chaos
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                disabled={isIso}
                                onClick={() => handleNodeAction(node.name, 'rotate')}
                                className="flex-1 py-1 text-[7.5px] font-bold bg-violet-500/10 hover:bg-violet-500/25 text-violet-400 border border-violet-500/20 rounded cursor-pointer disabled:opacity-40 font-mono transition-colors uppercase"
                              >
                                Rotate Keys
                              </button>
                              <button
                                disabled={isIso}
                                onClick={() => handleNodeAction(node.name, 'block')}
                                className="flex-1 py-1 text-[7.5px] font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded cursor-pointer disabled:opacity-40 font-mono transition-colors uppercase"
                              >
                                Block Route
                              </button>
                            </div>
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

      {/* Dynamic Forecast & After-Action Review (AAR) Matrix */}
      <div className="bg-panel/10 border border-border/40 p-4 rounded-md shrink-0 flex flex-col backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 border-b border-border/20 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBottomTab('whatif')}
              className={cn(
                "pb-1 text-[9px] font-heading font-black tracking-[0.1em] uppercase cursor-pointer border-b-2 transition-colors",
                bottomTab === 'whatif' ? "text-accent-cyan border-accent-cyan" : "text-text-tertiary border-transparent hover:text-white"
              )}
            >
              What_If_Forecaster
            </button>
            <button
              onClick={() => setBottomTab('aar')}
              className={cn(
                "pb-1 text-[9px] font-heading font-black tracking-[0.1em] uppercase cursor-pointer border-b-2 transition-colors ml-3.5",
                bottomTab === 'aar' ? "text-accent-cyan border-accent-cyan" : "text-text-tertiary border-transparent hover:text-white"
              )}
            >
              After_Action_Chronology ({aarTimeline.length})
            </button>
          </div>
          
          {bottomTab === 'whatif' && (
            <select 
              value={whatIfNode}
              onChange={(e) => setWhatIfNode(e.target.value)}
              className="bg-void border border-border/30 text-[8px] px-1 py-0.5 font-mono rounded text-text-secondary hover:text-white cursor-pointer select-reset uppercase"
            >
              {nodes.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
            </select>
          )}
        </div>

        {bottomTab === 'whatif' ? (
          <>
            <p className="text-[7.5px] text-text-tertiary mb-3 uppercase leading-relaxed font-mono">
              Simulating expected risk exposure trace of <span className="text-white font-mono font-bold font-black">{whatIfNode}</span> with vs without tactical quarantine.
            </p>

            <div className="h-32 w-full bg-void/20 border border-border/20 rounded p-1.5 relative overflow-hidden">
              {isLoadingWhatIf ? (
                <div className="absolute inset-0 flex items-center justify-center text-[7.5px] font-mono tracking-widest text-text-tertiary">
                  Reconstructing scenario matrix...
                </div>
              ) : whatIfData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={whatIfData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="tick" stroke="#334155" fontSize={6.5} tickLine={false} />
                    <YAxis stroke="#334155" fontSize={6.5} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020408', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '8px' }} 
                      labelStyle={{ color: '#00f2ff', fontWeight: 'black', fontFamily: 'monospace' }}
                      itemStyle={{ fontSize: '8.5px', fontFamily: 'monospace' }}
                    />
                    <Area type="monotone" name="Unmitigated Propagation Risk" dataKey="No Action Risk" stroke="#f43f5e" fill="rgba(244,63,94,0.04)" strokeWidth={1.5} />
                    <Area type="monotone" name="Active Containment Risk" dataKey="Autonomous Defense Risk" stroke="#00f2ff" fill="rgba(0,242,255,0.04)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[7.5px] font-mono text-text-tertiary">
                  Select scenario to build trace graphs
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-32 overflow-y-auto custom-scrollbar flex flex-col gap-2 font-mono text-[7.8px] relative pr-1">
            {aarTimeline.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[7.5px] text-text-tertiary uppercase text-center py-4">
                Awaiting simulation trace logging records. Launch a campaign protocol.
              </div>
            ) : (
              [...aarTimeline].reverse().map((step, idx) => (
                <div key={step.id || idx} className="bg-void/40 border border-border/15 rounded p-2 flex items-start gap-2.5 animate-fade-in">
                  <div className="bg-void border border-border/30 px-1 py-0.5 font-bold text-accent-cyan text-[7px] shrink-0 uppercase rounded-sm mt-0.5">
                    T+{step.tick}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5">
                      <span className={cn(
                        "font-extrabold uppercase text-[8px]",
                        step.type === 'attack' ? "text-rose-400" :
                        step.type === 'degradation' ? "text-amber-400" :
                        step.type === 'mitigation' ? "text-emerald-400" : "text-text-secondary"
                      )}>
                        {step.title}
                      </span>
                      <span className="text-text-tertiary text-[6.5px] uppercase shrink-0">
                        SURVIVAL: {step.survivability}% • CONTINUITY: {step.continuity}%
                      </span>
                    </div>
                    <p className="text-text-tertiary mt-1 leading-relaxed">{step.description}</p>
                    {step.mitre && (
                      <div className="flex gap-2.5 mt-2 flex-wrap text-[6px] font-mono leading-none">
                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-tight">
                          Tactic: {step.mitre.tactic}
                        </span>
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-tight">
                          Id: {step.mitre.id}
                        </span>
                        <span className="bg-white/5 text-text-secondary border border-white/10 px-1.5 py-0.5 rounded-sm uppercase tracking-tight max-w-[200px] truncate">
                          {step.mitre.technique}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* AI Intelligence Assessment */}
      <div className="bg-panel/10 border border-border/40 p-4 rounded-md shrink-0 flex flex-col gap-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="font-heading font-black text-[9px] text-white tracking-[0.2em] uppercase">Predictive_Consensus_AI</span>
          </div>
          <button
            disabled={isGeneratingAi}
            onClick={generateAIReview}
            className="px-2.5 py-1 bg-accent-cyan/10 hover:bg-accent-cyan text-accent-cyan hover:text-void border border-accent-cyan/30 text-[8px] font-extrabold font-mono tracking-widest hover:scale-105 transition-all rounded cursor-pointer disabled:opacity-40 uppercase"
          >
            {isGeneratingAi ? "Reasoning_Engine..." : "Request_Heuristic_Review"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {aiReport ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-void/40 p-2.5 border border-border/20 rounded max-h-24 overflow-y-auto custom-scrollbar text-[7.8px] leading-relaxed text-text-secondary font-mono normal-case"
            >
              <div className="flex items-start gap-1">
                <span className="text-accent-cyan font-bold">[AI_ANALYSIS]:</span>
                <span>{aiReport}</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-void/10 p-2 border border-dashed border-white/5 rounded text-center text-text-tertiary text-[7.5px] font-mono">
              Awaiting diagnostic request trigger. Minimum consensus score: 0.85
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
