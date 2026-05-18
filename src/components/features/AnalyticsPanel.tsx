import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, AlertCircle, Share2, Target, Shield, Info, Cpu } from 'lucide-react';
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
        {/* Critical Attack Paths */}
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
