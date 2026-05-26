import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, ShieldCheck, Zap, BarChart, Info, AlertOctagon, Heart, Eye } from 'lucide-react';
import { DefenseRecommendation, DefenseActionType } from '../../types/defense';
import { cn } from '../../lib/utils';

interface Props {
  recommendations: DefenseRecommendation[];
  onApplyAction: (rec: DefenseRecommendation) => void;
  onDismissAction: (id: string) => void;
  activeStrategyMode?: 'balanced' | 'aggressive' | 'forensics' | 'resilience';
  onStrategyChange?: (mode: 'balanced' | 'aggressive' | 'forensics' | 'resilience') => void;
  containmentStability?: number;
  propagationReductionIndex?: number;
  recoveryTrackingRating?: number;
}

export function AutonomousDefensePanel({
  recommendations,
  onApplyAction,
  onDismissAction,
  activeStrategyMode = 'balanced',
  onStrategyChange,
  containmentStability = 96,
  propagationReductionIndex = 45,
  recoveryTrackingRating = 88,
}: Props) {
  const pending = recommendations.filter(r => r.status === 'pending');
  const appliedCount = recommendations.filter(r => r.status === 'applied').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-state-danger border-state-danger/30 bg-state-danger/5';
      case 'high': return 'text-[orange] border-[orange]/30 bg-[orange]/5';
      default: return 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5';
    }
  };

  const strategiesList = [
    {
      id: 'aggressive' as const,
      name: 'AGGRESSIVE CONTAINMENT',
      icon: AlertOctagon,
      desc: 'Drops lateral rate by 75%. Imposes high network latency and degrades systems. Safe zones quarantined.',
      cost: 'High Degradation',
      impact: 'Max Isolation',
      color: 'text-state-danger border-state-danger/30'
    },
    {
      id: 'balanced' as const,
      name: 'BALANCED DEFENSE',
      icon: ShieldCheck,
      desc: 'Standard firewalls and security rules. Balance of communication and safe network isolation.',
      cost: 'Low Impact',
      impact: 'Standard Shielding',
      color: 'text-accent-cyan border-accent-cyan/35'
    },
    {
      id: 'forensics' as const,
      name: 'OBSERVATIONAL FORENSICS',
      icon: Eye,
      desc: 'Allows attacker to traverse sections. Gathers high threat intelligence, keeps latency at zero.',
      cost: 'Extreme Threat Risk',
      impact: 'Deep Logging',
      color: 'text-state-warning border-state-warning/30'
    },
    {
      id: 'resilience' as const,
      name: 'RESILIENCE MODE',
      icon: Heart,
      desc: 'Prioritizes system restoration. Automatically hot-patches and repairs compromised hosts continuously.',
      cost: 'Moderate Propagation',
      impact: 'Auto Recovery',
      color: 'text-emerald-400 border-emerald-500/30'
    }
  ];

  const activeStratObj = strategiesList.find(s => s.id === activeStrategyMode) || strategiesList[1];

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
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-[8px] font-mono text-accent-cyan/60 uppercase">Operational_Thinking_Active</span>
            </div>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded border border-accent-cyan/20 bg-accent-cyan/5 text-[7px] font-mono font-bold text-accent-cyan uppercase">
          STRATEGY_ENGAGED: {activeStrategyMode.toUpperCase()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        
        {/* TACTICAL STRATEGY SELECTOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-accent-cyan font-bold tracking-widest uppercase">
              <span className="w-1 h-3 bg-accent-cyan" />
              OPERATOR COMMAND STRATEGY
            </div>
            <span className="text-[7px] font-mono opacity-40">SELECTABLE PROTOCOLS</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {strategiesList.map(strat => {
              const Icon = strat.icon;
              const isSelected = activeStrategyMode === strat.id;
              return (
                <button
                  key={strat.id}
                  onClick={() => onStrategyChange && onStrategyChange(strat.id)}
                  type="button"
                  className={cn(
                    "p-2 border rounded-md text-left transition-all duration-300 relative overflow-hidden group",
                    isSelected 
                      ? "bg-accent-cyan/10 border-accent-cyan text-white shadow-[0_0_12px_rgba(0,242,255,0.1)]" 
                      : "bg-void/40 border-white/5 hover:border-white/15 text-white/60 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-accent-cyan" : "opacity-50")} />
                    <span className="text-[8.5px] font-sans font-bold tracking-wider truncate block">
                      {strat.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[6.5px] font-mono leading-tight tracking-normal opacity-70 line-clamp-2">
                    {strat.desc}
                  </div>
                  {/* Selected Indicator Light */}
                  {isSelected && (
                    <span className="absolute top-1 right-1.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-cyan"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Strategy Consequences Warning Board */}
          <div className="p-2.5 bg-void border border-white/5 rounded space-y-1">
            <div className="flex justify-between items-center text-[7px] font-mono uppercase">
              <span className="opacity-40">Active Tradeoff:</span>
              <span className="text-white font-bold">{activeStratObj.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[7.5px] font-mono pt-1 border-t border-white/5 mt-1">
              <div>
                <span className="opacity-40 block uppercase">Operational Cost:</span>
                <span className="text-[orange] font-semibold">{activeStratObj.cost}</span>
              </div>
              <span className="text-right">
                <span className="opacity-40 block uppercase">Benefit Vector:</span>
                <span className="text-accent-cyan font-semibold">{activeStratObj.impact}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE COGNITIVE REASONING & EVALUATION LOOP */}
        <div className="p-3 bg-void border border-border-primary/10 rounded-md space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <BarChart className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="text-[8.5px] font-heading font-black tracking-wider uppercase text-white">LIVE MITIGATION FEEDBACK LOOP</span>
            </div>
            <div className="text-[7px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-400">
              ● REASSESSING_OK
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Containment Stability */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7.5px] font-mono uppercase">
                <span className="text-text-secondary">Containment Stability Analysis</span>
                <span className="text-accent-cyan font-bold">{containmentStability}%_STABLE</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${containmentStability}%` }}
                  className="h-full bg-accent-cyan"
                />
              </div>
            </div>

            {/* Propagation Reduction Index */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7.5px] font-mono uppercase">
                <span className="text-text-secondary">Propagation Mitigation Index</span>
                <span className="text-state-warning font-bold">-{propagationReductionIndex}% VELOCITY</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${propagationReductionIndex}%` }}
                  className="h-full bg-state-warning shadow-[0_0_8px_orange]"
                />
              </div>
            </div>

            {/* Recovery Tracking Rating */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7.5px] font-mono uppercase">
                <span className="text-text-secondary">Self-Healing Recovery Coefficient</span>
                <span className="text-emerald-400 font-bold">+{recoveryTrackingRating}% RESTORE</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${recoveryTrackingRating}%` }}
                  className="h-full bg-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RECOMMENDATIONS LIST */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-accent-cyan" />
              <span className="text-[9px] font-heading font-black uppercase tracking-wider">ACTIVE COMBAT RECOMMENDATIONS</span>
            </div>
            <span className="text-[7.5px] font-mono opacity-50 px-1 py-0.5 rounded border border-white/5 bg-white/5">
              {pending.length} ACTIONS QUEUED
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {pending.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center opacity-30 border border-dashed border-white/5 rounded p-5">
                <svg className="w-7 h-7 text-accent-cyan opacity-40 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-[8.5px] uppercase font-font-sans font-semibold text-accent-cyan tracking-widest text-center leading-normal">
                  No pending threats require manual counteraction.<br/>
                  <span className="text-[7px] text-white/50 lowercase tracking-normal font-mono">system boundaries isolated under {activeStrategyMode} mode.</span>
                </p>
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
                    "p-3 border rounded-md relative group overflow-hidden bg-void/50 backdrop-blur-md transition-all duration-300",
                    getPriorityColor(rec.priority)
                  )}
                >
                  {/* Top Header details */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1 py-0.2 px-1.5 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/35 text-[6.5px] font-mono font-black uppercase tracking-wider text-accent-cyan">
                          {rec.title || 'ACTIVE_MITIGATION'}
                        </span>
                        {rec.urgency && (
                          <span className={cn(
                            "px-1 py-0.5 rounded text-[6.5px] font-mono font-black uppercase tracking-wider",
                            rec.urgency === 'Critical' ? "bg-state-danger/20 border border-state-danger/30 text-state-danger" :
                            rec.urgency === 'Urgent' ? "bg-[orange]/20 border border-[orange]/30 text-[orange]" :
                            "bg-white/5 border border-white/10 text-white/50"
                          )}>
                            {rec.urgency}
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] font-bold font-sans text-white tracking-wide mt-1 uppercase">
                        {rec.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-mono font-bold text-accent-cyan">
                        {((rec.mitigationProbability || rec.confidence || 0.85) * 100).toFixed(0)}%_CONFIDENCE
                      </div>
                      <span className="text-[7px] font-mono opacity-50 block">ID: {rec.id} (TGT: {rec.targetId})</span>
                    </div>
                  </div>

                  {/* Reasoning & Rationale */}
                  <div className="space-y-1.5 bg-void/40 p-2 border border-white/5 rounded mb-2.5">
                    <p className="text-[8.5px] font-mono text-white/80 leading-normal italic">
                      "{rec.reasoning}"
                    </p>
                    {rec.rationale && (
                      <div className="text-[7.5px] font-mono text-text-secondary border-t border-white/5 pt-1.5 mt-1.5">
                        <span className="text-[6.5px] text-accent-cyan uppercase font-black tracking-widest block mb-0.5">Tactical Objective Rationale</span>
                        {rec.rationale}
                      </div>
                    )}
                  </div>

                  {/* Impact Consequences Preview */}
                  <div className="grid grid-cols-2 gap-1.5 text-[7.5px] font-mono border-t border-white/5 pt-2 mb-2">
                    <div className="p-1 bg-void/40 rounded border border-white/5">
                      <span className="opacity-40 uppercase font-black text-[6px] block">Outcome Risk Delta</span>
                      <span className="text-slate-200 font-semibold truncate block">{rec.predictedImpact || `${Math.round((rec.impactScore || 0.75) * 100)}% risk drop`}</span>
                    </div>
                    <div className="p-1 bg-void/40 rounded border border-white/5">
                      <span className="opacity-40 uppercase font-black text-[6px] block">Overhead/Cost</span>
                      <span className={cn(
                        "font-bold uppercase",
                        rec.operationalCost === 'High' ? "text-state-danger" :
                        rec.operationalCost === 'Medium' ? "text-[orange]" : "text-emerald-400"
                      )}>{rec.operationalCost || 'Low'}</span>
                    </div>
                    <div className="col-span-2 p-1 bg-void/40 rounded border border-white/5">
                      <span className="opacity-40 uppercase font-black text-[6px] block">Infrastructure Affected Scope</span>
                      <span className="text-accent-cyan font-bold uppercase truncate block">{rec.affectedInfrastructure || 'Boundary router routing table updates'}</span>
                    </div>
                  </div>

                  {/* Action Pipeline confirmation approval */}
                  <div className="flex gap-1.5 pt-1">
                    <button 
                      onClick={() => onApplyAction(rec)}
                      className="flex-1 py-1 bg-accent-cyan/15 hover:bg-accent-cyan border border-accent-cyan/35 text-accent-cyan hover:text-void rounded text-[8px] font-heading font-black tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.01]"
                    >
                      EXECUTE
                    </button>
                    <button 
                      onClick={() => onDismissAction(rec.id)}
                      className="px-2.5 py-1 bg-void border border-border-primary/20 rounded text-[7.5px] font-heading font-black tracking-widest uppercase hover:bg-white/5 text-white/60 transition-all"
                    >
                      DISMISS
                    </button>
                  </div>

                  {/* Glow top border */}
                  <div className="absolute top-0 right-0 h-0.5 bg-accent-cyan/20 w-full overflow-hidden">
                    <motion.div 
                      layoutId={`glow-${rec.id}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(rec.impactScore || 0.75) * 100}%` }}
                      className="h-full bg-accent-cyan shadow-[0_0_8px_#00f2ff]"
                    />
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-2.5 bg-void/50 border-t border-border-primary flex justify-between items-center opacity-40">
        <div className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-accent-cyan" strokeWidth={2.5} />
          <span className="text-[7px] uppercase font-bold tracking-widest text-accent-cyan">DEPLOY_ENGINE_VER_2.8</span>
        </div>
        <span className="text-[6.5px] font-mono uppercase">Applied_Actions: {appliedCount}</span>
      </div>
    </div>
  );
}
