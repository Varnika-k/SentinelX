import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Key, AlertTriangle, ChevronRight, Activity, Database, Lock, Globe } from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { EnterpriseIdentity, IAMRole, IdentityRelationship, EnvironmentSegment } from '../../types/iam';
import { IdentityGraphEngine } from '../../core/identity-engine';
import { cn } from '../../lib/utils';

interface IdentityIntelligenceProps {
  state: SimulationState;
  onHighlightIdentity: (id: string | null) => void;
}

export function IdentityIntelligence({ state, onHighlightIdentity }: IdentityIntelligenceProps) {
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null);
  const [view, setView] = useState<'identities' | 'environments' | 'analysis'>('identities');

  const selectedIdentity = useMemo(() => 
    state.identities.find(i => i.id === selectedIdentityId),
    [state.identities, selectedIdentityId]
  );

  const blastRadius = useMemo(() => {
    if (!selectedIdentityId) return [];
    return IdentityGraphEngine.calculateBlastRadius(
      selectedIdentityId,
      state.identities,
      state.identityRelationships,
      state.nodes
    );
  }, [selectedIdentityId, state]);

  const escalationPaths = useMemo(() => 
    IdentityGraphEngine.detectEscalationPaths(state.identities, state.roles, state.nodes),
    [state.identities, state.roles, state.nodes]
  );

  return (
    <div className="flex flex-col h-full bg-void/40 border border-border/30 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Header Tabs */}
      <div className="flex border-b border-border/20 bg-void/60">
        <TabButton active={view === 'identities'} onClick={() => setView('identities')} icon={Users} label="IDENTITY" />
        <TabButton active={view === 'environments'} onClick={() => setView('environments')} icon={Globe} label="ENVIRONMENTS" />
        <TabButton active={view === 'analysis'} onClick={() => setView('analysis')} icon={Activity} label="INTEL" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'identities' && (
            <motion.div 
              key="identities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Identity List */}
              <div className="space-y-2">
                {state.identities.map(identity => (
                  <IdentityCard 
                    key={identity.id}
                    identity={identity}
                    selected={selectedIdentityId === identity.id}
                    onClick={() => {
                      setSelectedIdentityId(identity.id);
                      onHighlightIdentity(identity.id);
                    }}
                    riskScore={IdentityGraphEngine.calculateIdentityRisk(identity, state.nodes)}
                  />
                ))}
              </div>

              {/* Selected Identity Detail */}
              {selectedIdentity && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-void/80 border border-accent-cyan/30 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-accent-cyan font-bold uppercase text-xs tracking-widest">{selectedIdentity.name} Details</h3>
                    <div className="px-2 py-0.5 bg-accent-cyan/20 rounded text-[9px] text-accent-cyan font-mono border border-accent-cyan/30">
                      LVL_{selectedIdentity.clearanceLevel}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-text-secondary uppercase block">Roles</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedIdentity.roles.map(r => (
                          <span key={r} className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] border border-white/10">{r}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-text-secondary uppercase block">Blast Radius</span>
                      <span className="text-xs font-mono text-state-warning">{blastRadius.length} Nodes</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[9px] text-text-secondary uppercase block text-center mb-2 font-bold tracking-widest">Resource Access Map</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedIdentity.accessibleNodes.map(nid => {
                        const node = state.nodes.find(n => n.id === nid);
                        return (
                          <div 
                            key={nid} 
                            className={cn(
                              "px-2 py-1 rounded-md text-[9px] font-mono border transition-all",
                              node?.status === 'compromised' 
                                ? "bg-state-danger/20 border-state-danger text-state-danger animate-pulse-precision" 
                                : "bg-white/5 border-white/20 text-white/70"
                            )}
                          >
                            {node?.label || nid}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'environments' && (
            <motion.div 
              key="environments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {state.environments.map(env => (
                <div key={env.id} className="p-3 bg-void/60 border border-border/20 rounded-lg space-y-3 shadow-inner">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        env.type === 'production' ? "bg-state-danger shadow-[0_0_8px_red]" : 
                        env.type === 'staging' ? "bg-accent-gold shadow-[0_0_8px_orange]" : "bg-accent-blue shadow-[0_0_8px_blue]"
                      )} />
                      <span className="text-xs font-bold uppercase tracking-wider">{env.label}</span>
                    </div>
                    <span className="text-[9px] text-text-secondary font-mono">SEC_LVL: {(env.securityLevel * 100).toFixed(0)}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-cyan" style={{ width: `${env.securityLevel * 100}%` }} />
                    </div>
                  </div>

                  <div className="text-[9px] text-text-secondary">
                    <span className="font-bold">Trusts:</span> {env.trustBoundaries.join(', ') || 'None'}
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {env.nodes.map(nid => {
                      const node = state.nodes.find(n => n.id === nid);
                      return (
                        <div key={nid} className={cn(
                          "h-1 rounded-sm",
                          node?.status === 'compromised' ? "bg-state-danger" : "bg-state-safe/30"
                        )} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {view === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 bg-state-danger/10 border border-state-danger/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-state-danger w-4 h-4" />
                  <span className="text-xs font-bold text-state-danger uppercase tracking-widest">Privilege Escalation Risks</span>
                </div>
                <div className="space-y-3">
                  {escalationPaths.map(path => (
                    <div key={path.id} className="p-2 bg-void/40 rounded border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white/90">{path.technique}</span>
                        <span className={cn(
                          "text-[8px] font-mono px-1 rounded capitalize font-bold",
                          path.riskLevel === 'high' ? "bg-state-danger text-white" : "bg-state-warning text-void"
                        )}>{path.riskLevel}</span>
                      </div>
                      <div className="flex items-center gap-1 overflow-hidden">
                        {path.path.map((step, i) => (
                          <React.Fragment key={step}>
                            <span className="text-[8px] text-text-secondary font-mono truncate">{step}</span>
                            {i < path.path.length - 1 && <ChevronRight size={8} className="text-text-secondary shrink-0" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                  {escalationPaths.length === 0 && (
                    <div className="text-[10px] text-text-secondary text-center italic py-2">No active escalation paths detected.</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Access Anomalies</h4>
                <div className="space-y-2">
                  <AnomalyLog icon={Lock} message="Multiple failed attempts: Sarah Chen on User Database" time="2m ago" severity="medium" />
                  <AnomalyLog icon={Key} message="Suspicious token refresh: AWS Integration Agent" time="5m ago" severity="high" />
                  <AnomalyLog icon={Users} message="New role assigned without secondary approval: Developer" time="15m ago" severity="low" />
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
        "flex-1 flex flex-col items-center justify-center py-3 gap-1.5 transition-all relative overflow-hidden group",
        active ? "text-accent-cyan" : "text-text-secondary hover:text-text-primary bg-white/5"
      )}
    >
      <Icon size={16} />
      <span className="text-[9px] font-bold tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan shadow-[0_0_10px_#00FFD1]" 
        />
      )}
    </button>
  );
}

function IdentityCard({ identity, selected, onClick, riskScore }: { identity: EnterpriseIdentity, selected: boolean, onClick: () => void, riskScore: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3 relative group",
        selected 
          ? "bg-accent-cyan/10 border-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.1)]" 
          : "bg-void/40 border-border/20 hover:border-border/40 hover:bg-void/60"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
        identity.status === 'compromised' ? "bg-state-danger/20 border-state-danger text-state-danger" :
        identity.type === 'admin' ? "bg-accent-gold/20 border-accent-gold text-accent-gold" : "bg-accent-blue/10 border-accent-blue/40 text-accent-blue"
      )}>
        {identity.type === 'admin' ? <Shield size={14} /> : identity.type === 'service-account' ? <Database size={14} /> : <Users size={14} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-bold truncate uppercase tracking-tight">{identity.name}</span>
          <span className={cn(
            "text-[10px] font-mono font-bold",
            riskScore > 70 ? "text-state-danger" : riskScore > 40 ? "text-state-warning" : "text-state-safe"
          )}>{riskScore}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-text-secondary uppercase truncate">{identity.type} &bull; {identity.status}</span>
          {identity.mfaEnabled && <Lock size={10} className="text-state-safe opacity-60" />}
        </div>
      </div>

      {identity.status === 'compromised' && (
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 flex items-center justify-center w-4 h-4 rounded-full bg-state-danger animate-pulse shadow-[0_0_10px_red]">
           <AlertTriangle size={8} className="text-white" />
        </div>
      )}
    </button>
  );
}

function AnomalyLog({ icon: Icon, message, time, severity }: { icon: any, message: string, time: string, severity: 'low' | 'medium' | 'high' }) {
  return (
    <div className="flex items-start gap-3 p-2 bg-void/40 rounded border border-white/5">
      <div className={cn(
        "mt-0.5 shrink-0",
        severity === 'high' ? "text-state-danger" : severity === 'medium' ? "text-state-warning" : "text-text-secondary"
      )}>
        <Icon size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] leading-tight text-text-secondary">{message}</p>
        <span className="text-[8px] opacity-40 font-mono italic">{time}</span>
      </div>
    </div>
  );
}
