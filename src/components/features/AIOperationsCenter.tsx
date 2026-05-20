import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Cpu, 
  MessageSquare, 
  Activity, 
  Shield, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Brain,
  Terminal,
  Search,
  Eye,
  Workflow
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { AIAgent, AgentReasoning } from '../../types/agents';
import { cn } from '../../lib/utils';

interface AIOperationsCenterProps {
  state: SimulationState;
}

export function AIOperationsCenter({ state }: AIOperationsCenterProps) {
  const [activeTab, setActiveTab] = useState<'agents' | 'reasoning' | 'orchestration'>('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const orchestration = state.agentOrchestration;
  const agents = orchestration.agents;
  const recentReasoning = orchestration.recentReasoning;
  const consensus = orchestration.consensus;

  return (
    <div className="flex flex-col h-full bg-void/60 border border-border/30 rounded-xl overflow-hidden backdrop-blur-2xl">
      {/* Dynamic AI Consensus Header */}
      <AnimatePresence mode="wait">
        {consensus && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "p-4 border-b border-white/10 flex items-center justify-between",
              consensus.threatLevel === 'critical' ? "bg-state-danger/10" : 
              consensus.threatLevel === 'high' ? "bg-state-warning/10" : "bg-accent-cyan/10"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center border animate-pulse-precision",
                consensus.threatLevel === 'critical' ? "bg-state-danger/20 border-state-danger text-state-danger" : 
                consensus.threatLevel === 'high' ? "bg-state-warning/20 border-state-warning text-state-warning" : "bg-accent-cyan/20 border-accent-cyan text-accent-cyan"
              )}>
                <Shield size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-text-tertiary uppercase">AI_CONSENSUS_LEVEL</div>
                <div className={cn(
                  "text-lg font-black tracking-tighter uppercase italic",
                  consensus.threatLevel === 'critical' ? "text-state-danger" : 
                  consensus.threatLevel === 'high' ? "text-state-warning" : "text-accent-cyan"
                )}>
                  {consensus.threatLevel} OPERATION_{consensus.confidence}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono text-text-secondary uppercase">Active_Voters</div>
              <div className="text-xs font-bold text-white font-mono">{consensus.agreementCount} Agents Linked</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex border-b border-white/5 bg-void/40">
        <TabButton active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={Bot} label="AGENTS" />
        <TabButton active={activeTab === 'reasoning'} onClick={() => setActiveTab('reasoning')} icon={Brain} label="REASONING" />
        <TabButton active={activeTab === 'orchestration'} onClick={() => setActiveTab('orchestration')} icon={Workflow} label="LIFECYCLE" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'agents' && (
            <motion.div 
              key="agents-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {agents.map(agent => (
                  <AgentMiniCard 
                    key={agent.id} 
                    agent={agent} 
                    selected={selectedAgentId === agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                  />
                ))}
              </div>

              {selectedAgentId && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-void/80 border border-accent-cyan/20 rounded-lg space-y-4"
                >
                  {(() => {
                    const agent = agents.find(a => a.id === selectedAgentId);
                    if (!agent) return null;
                    return (
                      <>
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-2">
                             <div className="p-1 bg-accent-cyan/10 rounded text-accent-cyan">
                               <Cpu size={14} />
                             </div>
                             <h4 className="text-xs font-bold uppercase tracking-widest">{agent.name} Registry</h4>
                           </div>
                           <div className="text-[9px] font-mono text-white/40">v1.2.4-stable</div>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-sans">{agent.description}</p>
                        <div className="space-y-2">
                           <span className="text-[9px] text-accent-cyan font-bold uppercase tracking-widest block">Capabilities</span>
                           <div className="flex flex-wrap gap-2">
                             {agent.capabilities.map(cap => (
                               <span key={cap} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/60">
                                 {cap.replace('_', ' ')}
                               </span>
                             ))}
                           </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'reasoning' && (
             <motion.div 
              key="reasoning-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {recentReasoning.map((reason, idx) => {
                const agent = agents.find(a => a.id === reason.agentId);
                return (
                  <div key={`${reason.agentId}-${idx}`} className="p-3 bg-void/40 border border-white/5 rounded-lg group hover:border-accent-cyan/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-accent-cyan tracking-widest uppercase italic">{agent?.name || 'UNKNOWN'}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[8px] font-mono text-text-tertiary">CONF: {(reason.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <span className="text-[8px] font-mono text-text-tertiary">{reason.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Observation</span>
                        <p className="text-[11px] text-white/80 leading-snug">{reason.observation}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-state-warning/30 uppercase font-black tracking-widest block">Hypothesis</span>
                        <p className="text-[11px] text-state-warning/80 leading-snug italic">"{reason.hypothesis}"</p>
                      </div>
                      {reason.recommendedAction && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <Zap size={10} className="text-accent-cyan animate-pulse" />
                          <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-tighter">Recommendation: {reason.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {recentReasoning.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                   <Activity className="w-12 h-12 mb-4" />
                   <div className="text-xs font-bold uppercase tracking-widest">Awaiting Reasoning Threads</div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orchestration' && (
             <motion.div 
                key="orchestration-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
             >
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] px-2">Operational_Memory</h4>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2 font-mono text-[10px] space-y-1.5 h-48 overflow-y-auto custom-scrollbar">
                    {orchestration.operationalMemory.map((mem, i) => (
                      <div key={i} className="flex gap-3 opacity-60 hover:opacity-100 transition-opacity">
                         <span className="text-accent-cyan shrink-0">MEM_REG_{i}</span>
                         <span className="text-white/80">{mem}</span>
                      </div>
                    ))}
                    {orchestration.operationalMemory.length === 0 && (
                      <div className="h-full flex items-center justify-center italic text-white/10 uppercase tracking-widest font-sans">No persistent memory records</div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg space-y-4">
                   <div className="flex items-center gap-3">
                      <Terminal size={16} className="text-accent-blue" />
                      <span className="text-[10px] font-bold text-accent-blue uppercase tracking-widest">Orchestrator Internal Cycles</span>
                   </div>
                   <div className="space-y-2">
                     <CycleStep label="Context Synchronization" status="complete" />
                     <CycleStep label="Telemetry Subscription Buffering" status="active" />
                     <CycleStep label="Consensus Logic Reconciliation" status="idle" />
                     <CycleStep label="Memory Persistence Flush" status="idle" />
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center py-4 gap-1.5 transition-all relative overflow-hidden group",
        active ? "text-accent-cyan bg-accent-cyan/5" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      )}
    >
      <Icon size={16} />
      <span className="text-[9px] font-black tracking-[0.3em]">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-underline-ops"
          className="absolute bottom-0 left-0 right-0 h-1 bg-accent-cyan shadow-[0_0_15px_#00f2ff]" 
        />
      )}
    </button>
  );
}

function AgentMiniCard({ agent, selected, onClick }: { agent: AIAgent, selected: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border transition-all text-left group relative overflow-hidden",
        selected 
          ? "bg-accent-cyan/10 border-accent-cyan shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
          : "bg-void/40 border-border/20 hover:border-border/40 hover:bg-void/60"
      )}
    >
      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
          agent.status === 'analyzing' ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan animate-pulse" : "bg-white/5 border-white/10 text-white/40"
        )}>
          {agent.role === 'threat_analyst' ? <Search size={14} /> : 
           agent.role === 'incident_responder' ? <Shield size={14} /> :
           agent.role === 'graph_specialist' ? <Eye size={14} /> : <Activity size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black tracking-tight text-white/90 uppercase">{agent.name}</div>
          <div className="text-[8px] font-bold text-text-secondary uppercase tracking-widest truncate">{agent.role.replace('_', ' ')}</div>
        </div>
      </div>
      <div className="flex items-center justify-between relative z-10">
        <span className={cn(
          "text-[8px] font-bold uppercase tracking-widest",
          agent.status === 'analyzing' ? "text-accent-cyan" : "text-text-tertiary"
        )}>{agent.status === 'analyzing' ? 'PROCESSING' : 'STANDBY'}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(
              "w-1 h-3 rounded-sm",
              i < Math.floor(agent.confidenceScore * 3) ? "bg-accent-cyan" : "bg-white/10"
            )} />
          ))}
        </div>
      </div>
      
      {/* Visual background decor */}
      {agent.status === 'analyzing' && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-transparent pointer-events-none" />
      )}
    </button>
  );
}

function CycleStep({ label, status }: { label: string, status: 'complete' | 'active' | 'idle' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {status === 'complete' ? <CheckCircle2 size={10} className="text-accent-blue" /> : 
         status === 'active' ? <Activity size={10} className="text-accent-blue animate-pulse" /> : 
         <AlertCircle size={10} className="text-white/20" />}
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-widest",
          status === 'active' ? "text-white" : "text-white/40"
        )}>{label}</span>
      </div>
      <span className={cn(
        "text-[8px] font-mono",
        status === 'active' ? "text-accent-blue" : "text-white/20"
      )}>{status.toUpperCase()}</span>
    </div>
  );
}
