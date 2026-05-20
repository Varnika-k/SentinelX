import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, AlertCircle, Share2, Target, Shield, Info, Cpu, HeartPulse, RefreshCw, ZapOff, Network, Gauge } from 'lucide-react';
import { NetworkNode, NetworkLink } from '../../types/network';
import { GraphIntelligenceEngine } from '../../lib/graph-intelligence';
import { cn } from '../../lib/utils';

interface Props {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export function AnalyticsPanel({ nodes, links }: Props) {
  const engine = useMemo(() => new GraphIntelligenceEngine(nodes, links), [nodes, links]);
  const report = useMemo(() => engine.generateFullReport(), [engine]);

  const topBlastRadius = useMemo(() => {
    return Object.entries(report.blastRadius)
      .map(([id, radius]) => ({
        id,
        radius,
        label: nodes.find(n => n.id === id)?.label || id
      }))
      .sort((a, b) => b.radius - a.radius)
      .slice(0, 5);
  }, [report.blastRadius, nodes]);

  // Overall statistics
  const overallResilience = report.resilienceIndex !== undefined ? report.resilienceIndex : 100;
  
  // Custom resilience color class based on score
  const getResilienceColor = (score: number) => {
    if (score > 80) return "text-state-safe stroke-state-safe";
    if (score > 55) return "text-state-warning stroke-state-warning";
    return "text-state-danger stroke-state-danger";
  };

  const activeThreats = nodes.filter(n => n.status === 'compromised').length;
  const isolatedNodes = nodes.filter(n => n.status === 'isolated').length;
  const healthPercent = Math.max(0, 100 - (activeThreats * 15) - (isolatedNodes * 5));

  return (
    <div className="flex flex-col h-full bg-void font-sans">
      <div className="p-4 border-b border-border bg-void/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent-blue/10 rounded border border-accent-blue/20">
            <BarChart3 className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Topology_Analytics</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse-precision" />
              <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-widest">Realtime_Engine_V4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
        
        {/* PART 1 — GLOBAL OPERATIONAL RESILIENCE INDEX */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Operational_Resilience_Index</span>
          </div>

          <div className="precision-panel p-5 bg-panel/20 border border-border rounded-sm flex flex-col md:flex-row items-center gap-6 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-1 font-mono text-[6px] text-text-tertiary opacity-30">ORI_V2</div>
            
            {/* Elegant SVG Progress Circle */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" className="fill-none stroke-border/30 stroke-2" />
                <motion.circle 
                  cx="48" cy="48" r="40" 
                  className={cn("fill-none stroke-2", getResilienceColor(overallResilience))} 
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * overallResilience) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-[20px] font-mono font-bold leading-none", getResilienceColor(overallResilience))}>
                  {overallResilience.toFixed(0)}%
                </span>
                <span className="text-[7px] font-bold text-text-tertiary uppercase tracking-wider mt-1">Stability_idx</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-[9px] font-bold text-text-primary uppercase">Survivability_Coefficient</span>
                <span className="text-[10px] font-mono font-bold text-accent-cyan">{healthPercent.toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Platform stability dynamically evaluates node telemetry, mitigation speed, isolation stress, and trust degradation vectors.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-1.5 py-0.5 rounded-sm bg-void border border-border text-[8px] font-mono text-text-secondary uppercase">
                  ACTIVE: {activeThreats} BRCH
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-void border border-border text-[8px] font-mono text-text-secondary uppercase">
                  ISOLATED: {isolatedNodes} NODE
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PART 2 — SYSTEM SURVIVABILITY & PRESSURE MAP */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-3.5 h-3.5 text-state-warning" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Infrastructure_Pressure_State</span>
          </div>

          <div className="precision-panel p-5 bg-panel/10 border border-border rounded-sm space-y-4">
            <p className="text-[9px] font-mono text-text-tertiary uppercase">Stress_vs_Forecasted_Degradation</p>
            <div className="space-y-4">
              {report.infrastructurePressure?.slice(0, 4).map((press) => {
                const nodeLabel = nodes.find(n => n.id === press.nodeId)?.label || press.nodeId;
                const survivability = report.survivabilityScores?.find(s => s.nodeId === press.nodeId)?.survivabilityScore || 100;
                
                return (
                  <div key={press.nodeId} className="space-y-1 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-[9px] uppercase">
                      <span className="text-text-primary font-bold">{nodeLabel}</span>
                      <span className="text-[8px] font-mono text-text-tertiary">
                        Stress: {press.stressScore.toFixed(0)}% | Survival: {survivability.toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Stress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] text-text-tertiary uppercase">
                          <span>Operational Stress</span>
                        </div>
                        <div className="h-1 bg-void rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${press.stressScore}%` }}
                            className={cn(
                              "h-full rounded-full",
                              press.stressScore > 70 ? "bg-state-danger" : press.stressScore > 40 ? "bg-state-warning" : "bg-accent-blue"
                            )}
                          />
                        </div>
                      </div>

                      {/* Degradation Forecast */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] text-text-tertiary uppercase">
                          <span>Degradation Forecast</span>
                        </div>
                        <div className="h-1 bg-void rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${press.degradationForecast}%` }}
                            className={cn(
                              "h-full rounded-full",
                              press.degradationForecast > 75 ? "bg-state-danger/70" : "bg-emerald-500/40"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PART 3 — CASCADING FAILURE WARNINGS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <ZapOff className="w-3.5 h-3.5 text-state-danger" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Cascading_Chain_Inference</span>
          </div>

          {report.cascadingFailureRisks && report.cascadingFailureRisks.length > 0 ? (
            <div className="space-y-2">
              {report.cascadingFailureRisks.map((risk) => {
                const nodeLabel = nodes.find(n => n.id === risk.nodeId)?.label || risk.nodeId;
                return (
                  <div key={risk.nodeId} className="p-3 bg-state-danger/5 border border-state-danger/20 rounded-sm flex items-start gap-3">
                    <div className="p-1 rounded bg-state-danger/15 border border-state-danger/30 text-state-danger uppercase text-[8px] font-mono mt-0.5 animate-pulse-precision font-bold">
                      PROB: {(risk.cascadingProbability * 100).toFixed(0)}%
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <span className="text-[10px] font-bold text-white uppercase">{nodeLabel}</span>
                      <p className="text-[9px] text-text-secondary leading-normal">{risk.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 border border-dashed border-border/30 rounded-sm text-center flex flex-col items-center gap-2 opacity-30 grayscale grayscale-100">
              <Network className="w-8 h-8 text-accent-cyan" />
              <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Zero cascade propagation risks</p>
            </div>
          )}
        </section>

        {/* Critical Attack Traversal Paths */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Target className="w-3.5 h-3.5 text-state-danger" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Risk_Traversal_Paths</span>
            </div>
            {report.criticalPaths.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-state-danger/10 border border-state-danger/20 text-[8px] font-mono font-bold text-state-danger uppercase tracking-widest">
                {report.criticalPaths.length} Active
              </span>
            )}
          </div>

          {report.criticalPaths.length === 0 ? (
            <div className="py-12 border border-dashed border-border/30 rounded-sm text-center flex flex-col items-center gap-3 opacity-30 grayscale grayscale-100 transition-all hover:opacity-50">
              <Shield className="w-10 h-10 text-accent-cyan" />
              <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Zero traversal risks detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.criticalPaths.map((path, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="precision-panel p-4 space-y-3 group"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-[9px] font-mono font-bold text-state-danger uppercase tracking-widest group-hover:text-white transition-colors">Criticality_Score: {(path.riskScore * 100).toFixed(0)}%</span>
                    <TrendingUp className="w-3 h-3 text-state-danger opacity-40" />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar scroll-smooth">
                    {path.path.map((nodeId, idx) => (
                      <React.Fragment key={nodeId}>
                        <div className="text-[9px] font-bold text-text-primary whitespace-nowrap px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-sm group-hover:border-white/10 transition-colors">
                          {nodes.find(n => n.id === nodeId)?.label}
                        </div>
                        {idx < path.path.length - 1 && (
                          <div className="flex flex-col items-center opacity-30 px-1">
                             <div className="w-[1px] h-3 bg-accent-cyan" />
                             <Share2 className="w-2.5 h-2.5 text-accent-cyan rotate-90" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* PART 4 — SYSTEM RECOVERY ESTIMATIONS */}
        {report.recoveryTimelines && report.recoveryTimelines.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-3.5 h-3.5 text-accent-cyan animate-spin-slow" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Active_Tactical_Recovery</span>
            </div>

            <div className="precision-panel p-4 bg-void border border-border rounded-sm space-y-3">
              {report.recoveryTimelines.map((rec) => {
                const nodeLabel = nodes.find(n => n.id === rec.nodeId)?.label || rec.nodeId;
                return (
                  <div key={rec.nodeId} className="space-y-1 pb-2 border-b border-border/30 last:border-0 last:pb-0">
                    <div className="flex justify-between text-[9px] uppercase font-bold text-text-primary">
                      <span>{nodeLabel} Recovery</span>
                      <span className="font-mono text-accent-cyan">Est. {rec.estimatedRecoverySeconds}s</span>
                    </div>
                    <div className="h-1.5 bg-void rounded-full overflow-hidden border border-white/5 flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rec.progressPercentage}%` }}
                        className="h-full bg-accent-cyan rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[7px] text-text-tertiary uppercase">
                      <span>Telemetry Ingesting</span>
                      <span>{rec.progressPercentage}% Complete</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Blast Radius Analysis */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-state-warning" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Infrastructure_Impact_Metric</span>
          </div>

          <div className="space-y-5 bg-panel/30 border border-border p-5 rounded-sm">
             {topBlastRadius.map((item, i) => (
               <div key={item.id} className="space-y-2 group">
                 <div className="flex justify-between text-[9px] uppercase tracking-wider">
                   <span className="text-text-primary font-bold group-hover:text-accent-cyan transition-colors">{item.label}</span>
                   <span className="font-mono text-text-tertiary">{(item.radius * 100).toFixed(1)}% Radius</span>
                 </div>
                 <div className="h-1.5 bg-void rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${item.radius * 100}%` }}
                     className={cn(
                       "h-full rounded-full transition-all duration-500",
                       item.radius > 0.5 ? "bg-state-danger" : "bg-accent-blue"
                     )}
                   />
                 </div>
               </div>
             ))}
          </div>
        </section>

        {/* Lateral Movement Prediction */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Spread_Probability_Neural</span>
          </div>

          {report.lateralMovementProbability.length === 0 ? (
             <div className="py-10 border border-border/20 rounded-sm text-center flex flex-col items-center gap-2 opacity-20">
               <Cpu className="w-8 h-8" />
               <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Telemetry_Stream_Required</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {report.lateralMovementProbability.slice(0, 5).map((move, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-panel/20 border border-border rounded-sm group hover:border-accent-cyan/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-secondary font-mono tracking-tighter">{nodes.find(n => n.id === move.sourceId)?.label}</span>
                    <div className="w-6 h-[1px] bg-border group-hover:bg-accent-cyan/30 transition-colors" />
                    <span className="text-[10px] text-text-primary font-bold">{nodes.find(n => n.id === move.targetId)?.label}</span>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-accent-cyan bg-accent-cyan/5 px-2 py-0.5 border border-accent-cyan/10 rounded-sm">
                    {(move.probability * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="p-4 bg-void border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-[8px] uppercase font-bold text-text-tertiary tracking-widest">Alg_Protocol:</div>
          <div className="text-[8px] font-mono uppercase text-accent-blue font-bold px-1.5 py-0.5 bg-accent-blue/10 border border-accent-blue/20 rounded-sm">Adaptive_BFS_V2</div>
        </div>
        <div className="flex items-center gap-1.5 text-text-tertiary opacity-40 hover:opacity-100 transition-opacity cursor-help">
          <Info className="w-3 h-3" />
          <span className="text-[8px] font-bold uppercase tracking-widest">Documentation</span>
        </div>
      </div>
    </div>
  );
}

