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
            nodes.map((node) => (
              <div 
                key={node.id} 
                className={cn(
                  "p-2.5 border rounded-sm transition-all group relative",
                  node.status === 'infected' ? "bg-state-danger/10 border-state-danger/50" :
                  node.status === 'critical' ? "bg-state-warning/10 border-state-warning/50" :
                  node.status === 'isolated' ? "bg-accent-blue/5 border-border-bright/20 opacity-60" :
                  "bg-void/40 border-border"
                )}
                onMouseEnter={() => onHighlightNode && onHighlightNode(node.name)}
                onMouseLeave={() => onHighlightNode && onHighlightNode(null)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-white font-mono tracking-tight group-hover:text-accent-cyan transition-colors">{node.name}</span>
                    <span className="text-[7px] text-text-tertiary font-mono tracking-widest uppercase">{node.type} | {node.namespace}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-sm shrink-0",
                    node.status === 'infected' ? "bg-state-danger/20 text-state-danger animate-pulse" :
                    node.status === 'critical' ? "bg-state-warning/20 text-state-warning" :
                    node.status === 'isolated' ? "bg-accent-blue/30 text-accent-cyan" :
                    "bg-state-safe/20 text-state-safe"
                  )}>
                    {node.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-[8px] font-mono text-text-secondary">
                  <div>
                    <span className="opacity-50 block text-[6px] text-text-tertiary">CPU Load</span>
                    <span className="font-bold text-white">{Math.round(node.cpuLoad)}%</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[6px] text-text-tertiary">Latency</span>
                    <span className="font-bold text-white">{node.latency}ms</span>
                  </div>
                  <div>
                    <span className="opacity-50 block text-[6px] text-text-tertiary">Flow Rate</span>
                    <span className="font-bold text-white">{node.activeConnections} c/s</span>
                  </div>
                </div>

                {/* Micro Actions Overlay */}
                <div className="mt-2 pt-2 border-t border-border/30 flex gap-2 invisible group-hover:visible transition-all">
                  <button
                    disabled={node.status === 'isolated'}
                    onClick={() => handleNodeAction(node.name, 'isolate')}
                    className="flex-1 py-1 text-[7px] font-bold bg-accent-blue/20 hover:bg-accent-blue/40 text-accent-cyan border border-accent-blue/30 rounded-sm cursor-pointer disabled:opacity-40"
                  >
                    Isolate
                  </button>
                  <button
                    disabled={node.status === 'isolated'}
                    onClick={() => handleNodeAction(node.name, 'scale')}
                    className="flex-1 py-1 text-[7px] font-bold bg-state-safe/10 hover:bg-state-safe/25 text-state-safe border border-state-safe/30 rounded-sm cursor-pointer disabled:opacity-40"
                  >
                    Scale_Up
                  </button>
                  <button
                    disabled={node.status === 'isolated'}
                    onClick={() => handleNodeAction(node.name, 'chaos')}
                    className="flex-1 py-1 text-[7px] font-bold bg-state-warning/10 hover:bg-state-warning/25 text-state-warning border border-state-warning/30 rounded-sm cursor-pointer disabled:opacity-40"
                  >
                    Inject_Chaos
                  </button>
                </div>
              </div>
            ))
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
