import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Target, AlertTriangle, ShieldCheck, ChevronRight, Activity, Info, BrainCircuit, BarChart } from 'lucide-react';
import { DefenseRecommendation } from '../../types/defense';
import { cn } from '../../lib/utils';

interface Props {
  recommendations: DefenseRecommendation[];
  onApplyAction: (rec: DefenseRecommendation) => void;
  onDismissAction: (id: string) => void;
}

export function AutonomousDefensePanel({ recommendations, onApplyAction, onDismissAction }: Props) {
  const pending = recommendations.filter(r => r.status === 'pending');
  const appliedCount = recommendations.filter(r => r.status === 'applied').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-state-danger border-state-danger/30 bg-state-danger/5';
      case 'high': return 'text-state-warning border-state-warning/30 bg-state-warning/5';
      default: return 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-dark/40 border border-border-primary/50 rounded-lg overflow-hidden backdrop-blur-sm">
      <div className="bg-background-light/10 p-3 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-cyan/10 rounded border border-accent-cyan/20">
            <BrainCircuit className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <h3 className="text-[10px] font-heading font-black tracking-[2px] uppercase">Defender_Decision_Core</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
              <span className="text-[8px] font-mono text-accent-cyan/60 uppercase">Operational_Thinking_Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-void border border-border-primary/20 rounded">
            <div className="text-[7px] text-text-secondary uppercase mb-1">Defense_Confidence</div>
            <div className="text-sm font-mono text-accent-cyan">84.2%</div>
          </div>
          <div className="p-2 bg-void border border-border-primary/20 rounded">
            <div className="text-[7px] text-text-secondary uppercase mb-1">Actions_Applied</div>
            <div className="text-sm font-mono text-accent-cyan">{appliedCount}</div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-accent-cyan" />
              <span className="text-[9px] font-heading font-black uppercase tracking-wider">Active_Recommendations</span>
            </div>
            <span className="text-[8px] font-mono opacity-50">{pending.length} New</span>
          </div>

          <AnimatePresence mode="popLayout">
            {pending.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center opacity-20">
                <ShieldCheck className="w-12 h-12 mb-2" />
                <p className="text-[9px] uppercase font-heading tracking-widest">Defensive_Perimeter_Stable</p>
              </div>
            ) : (
              pending.map((rec, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={rec.id}
                  className={cn(
                    "p-3.5 border rounded-md space-y-3 relative group overflow-hidden backdrop-blur-md transition-all duration-300",
                    getPriorityColor(rec.priority)
                  )}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded-sm bg-accent-cyan/10 border border-accent-cyan/35 text-[7px] font-mono font-bold uppercase tracking-wider text-accent-cyan">
                          {rec.title || 'ACTIVE_MITIGATION'}
                        </span>
                        {rec.urgency && (
                          <span className={cn(
                            "px-1 py-0.5 rounded-sm text-[7px] font-mono font-bold uppercase tracking-wider",
                            rec.urgency === 'Critical' ? "bg-state-danger/20 border border-state-danger/30 text-state-danger" :
                            rec.urgency === 'Urgent' ? "bg-state-warning/20 border border-state-warning/30 text-state-warning" :
                            "bg-white/5 border border-white/10 text-white/50"
                          )}>
                            {rec.urgency}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black font-heading text-white tracking-wide mt-1 uppercase">
                        {rec.action.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono font-bold text-accent-cyan text-glow">
                        {((rec.mitigationProbability || rec.confidence) * 100).toFixed(0)}%_SUCCESS
                      </div>
                      <span className="text-[7.5px] font-mono opacity-50 block">Target: {rec.targetId}</span>
                    </div>
                  </div>

                  {/* Core Description & Rationale */}
                  <div className="space-y-1.5 bg-void/35 p-2 rounded border border-white/5">
                    <p className="text-[9px] font-mono text-white/80 leading-relaxed italic">
                      "{rec.reasoning}"
                    </p>
                    {rec.rationale && (
                      <div className="text-[8px] font-mono text-text-secondary border-t border-white/5 pt-1.5 mt-1.5">
                        <span className="text-[7px] text-accent-cyan uppercase font-black tracking-widest block mb-0.5">Operational Rationale</span>
                        {rec.rationale}
                      </div>
                    )}
                  </div>

                  {/* Operational Impact Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-mono pt-1">
                    <div className="p-1.5 bg-void/50 rounded border border-white/5 flex flex-col gap-0.5">
                      <span className="opacity-40 uppercase font-black text-[6.5px]">Impact Assessment</span>
                      <span className="text-white font-medium truncate">{rec.predictedImpact || `${Math.round(rec.impactScore * 100)}% Risk Reduction`}</span>
                    </div>
                    <div className="p-1.5 bg-void/50 rounded border border-white/5 flex flex-col gap-0.5">
                      <span className="opacity-40 uppercase font-black text-[6.5px]">Overhead Cost</span>
                      <span className={cn(
                        "font-bold uppercase",
                        rec.operationalCost === 'High' ? "text-state-danger" :
                        rec.operationalCost === 'Medium' ? "text-state-warning" : "text-emerald-400"
                      )}>{rec.operationalCost || 'Low'}</span>
                    </div>
                    <div className="col-span-2 p-1.5 bg-void/50 rounded border border-white/5 flex flex-col gap-0.5">
                      <span className="opacity-40 uppercase font-black text-[6.5px]">Affected Infrastructure Scope</span>
                      <span className="text-accent-cyan font-bold uppercase truncate">{rec.affectedInfrastructure || 'Direct Node interfaces & Subnet access'}</span>
                    </div>
                  </div>

                  {/* Trigger buttons */}
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => onApplyAction(rec)}
                      className="flex-1 py-1.5 bg-accent-cyan/15 hover:bg-accent-cyan border border-accent-cyan/35 text-accent-cyan hover:text-void rounded text-[8.5px] font-heading font-black tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.01]"
                    >
                      EXECUTE_COUNTERMEASURE
                    </button>
                    <button 
                      onClick={() => onDismissAction(rec.id)}
                      className="px-3 py-1.5 bg-void border border-border-primary/20 rounded text-[8px] font-heading font-black tracking-widest uppercase hover:bg-white/5 transition-all"
                    >
                      DISMISS
                    </button>
                  </div>

                  {/* Visual indication of risk reduction */}
                  <div className="absolute top-0 right-0 h-1 bg-accent-cyan/15 w-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${rec.impactScore * 100}%` }}
                      className="h-full bg-accent-cyan shadow-[0_0_8px_#00f2ff]"
                    />
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Prediction Feed */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <BarChart className="w-3 h-3 text-state-warning" />
             <span className="text-[9px] font-heading font-black uppercase tracking-wider">Predictive_Infrastructure_Analysis</span>
           </div>
           
           <div className="space-y-2 p-3 bg-void/50 border border-border-primary/10 rounded">
             <div className="flex justify-between items-center text-[8px] opacity-60 uppercase">
                <span>Spread_Velocity</span>
                <span className="text-state-warning">High</span>
             </div>
             <div className="flex justify-between items-center text-[8px] opacity-60 uppercase">
                <span>Survival_Probability</span>
                <span className="text-accent-cyan">88%</span>
             </div>
             <div className="flex justify-between items-center text-[8px] opacity-60 uppercase">
                <span>Mean_Time_To_Compromise</span>
                <span>4.2m</span>
             </div>
           </div>
        </div>
      </div>

      <div className="p-3 bg-void/50 border-t border-border-primary flex justify-between items-center opacity-40">
        <div className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5" />
          <span className="text-[7px] uppercase font-bold tracking-widest text-accent-cyan">REINFORCEMENT_LEARNING_V2_READY</span>
        </div>
      </div>
    </div>
  );
}
