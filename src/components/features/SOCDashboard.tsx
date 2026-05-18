import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Layout, 
  Activity, 
  AlertCircle, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Terminal,
  Grid,
  Users,
  Search,
  Bell
} from 'lucide-react';
import { Incident, IncidentStatus } from '../../types/incident';
import { IncidentQueue } from './IncidentQueue';
import { IncidentDetail } from './IncidentDetail';
import { cn } from '../../lib/utils';

interface Props {
  incidents: Incident[];
  onUpdateIncidentStatus: (id: string, status: IncidentStatus) => void;
  onAddIncidentNote: (id: string, note: string) => void;
  onClose: () => void;
}

export function SOCDashboard({ incidents, onUpdateIncidentStatus, onAddIncidentNote, onClose }: Props) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const selectedIncident = useMemo(() => 
    incidents.find(i => i.id === selectedIncidentId) || null
  , [incidents, selectedIncidentId]);

  const activeIncidents = incidents.filter(i => ['detected', 'investigating', 'escalated'].includes(i.status));
  const criticalThreats = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-void flex flex-col overflow-hidden"
    >
      {/* Top Navigation */}
      <header className="h-14 border-b border-border-primary/50 flex items-center justify-between px-6 bg-background-dark/50 backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-cyan/10 rounded border border-accent-cyan/20">
              <Shield className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-xs font-heading font-black tracking-[4px] uppercase italic">SentinelX_SOC</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                <span className="text-[8px] font-mono text-accent-cyan/60 uppercase">Operational_Level_Alpha</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button className="px-4 py-2 border-b-2 border-accent-cyan text-accent-cyan text-[10px] font-heading font-bold uppercase tracking-wider">Incidents</button>
            <button className="px-4 py-2 border-b-2 border-transparent text-text-secondary hover:text-white transition-colors text-[10px] font-heading font-bold uppercase tracking-wider">Analytics</button>
            <button className="px-4 py-2 border-b-2 border-transparent text-text-secondary hover:text-white transition-colors text-[10px] font-heading font-bold uppercase tracking-wider">Assets</button>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-border-primary/30 pr-6">
             <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-state-danger uppercase">{activeIncidents.length} Active</div>
                <div className="text-[8px] font-mono opacity-50 uppercase">Incidents_Unresolved</div>
             </div>
             <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-state-warning uppercase">94%</div>
                <div className="text-[8px] font-mono opacity-50 uppercase">Infrastructure_Health</div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="p-2 text-text-secondary hover:text-white transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-state-danger rounded-full border-2 border-void" />
             </button>
             <button 
               onClick={onClose}
               className="flex items-center gap-2 px-4 py-1.5 bg-background-light/10 border border-border-primary/30 rounded text-[10px] font-heading font-bold uppercase hover:bg-background-light/20 transition-all"
             >
               Exit_Terminal
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Stats Bar */}
        <div className="w-16 border-r border-border-primary/30 flex flex-col items-center py-6 gap-6 bg-background-dark/30">
           <button className="p-2.5 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
             <Grid size={20} />
           </button>
           <button className="p-2.5 rounded hover:bg-white/5 text-text-secondary">
             <Users size={20} />
           </button>
           <button className="p-2.5 rounded hover:bg-white/5 text-text-secondary">
             <Activity size={20} />
           </button>
           <div className="mt-auto flex flex-col items-center gap-4 pb-4">
              <div className="w-1 h-12 bg-border-primary/20 rounded-full relative overflow-hidden">
                <div className="absolute bottom-0 w-full h-[70%] bg-accent-cyan/50" />
              </div>
              <Terminal size={18} className="opacity-30" />
           </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
           {/* Summary Cards Row */}
           <div className="flex flex-col gap-6 w-80 shrink-0 overflow-y-auto no-scrollbar">
              <div className="p-4 bg-void border border-border-primary/30 rounded-sm space-y-4">
                 <div className="flex items-center gap-2 text-state-danger">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-heading font-black uppercase tracking-widest">Urgent_Alerts</span>
                 </div>
                 <div className="space-y-3">
                    {criticalThreats.length > 0 ? (
                      criticalThreats.map(threat => (
                        <div key={threat.id} className="p-2 bg-state-danger/5 border-l-2 border-state-danger rounded-r">
                           <div className="text-[9px] font-bold text-white mb-0.5">{threat.title}</div>
                           <div className="text-[8px] font-mono text-state-danger">{threat.id} // THREAT_LEVEL_HIGH</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[9px] opacity-30 text-center py-4 italic">No critical threats active</div>
                    )}
                 </div>
              </div>

              <div className="p-4 bg-void border border-border-primary/30 rounded-sm space-y-4">
                 <div className="flex items-center gap-2 text-accent-cyan">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-heading font-black uppercase tracking-widest">SOC_Performance</span>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] opacity-70">
                        <span>Incident_Correlation_Rate</span>
                        <span>82%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-accent-cyan w-[82%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] opacity-70">
                        <span>Automation_Fidelity</span>
                        <span>91%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-accent-cyan w-[91%]" />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-void border border-border-primary/30 rounded-sm space-y-4">
                 <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={14} />
                    <span className="text-[10px] font-heading font-black uppercase tracking-widest">Duty_Shift_Logs</span>
                 </div>
                 <div className="text-[8px] font-mono space-y-2 opacity-50">
                    <div>[08:42] SYSTEM: Log rotation initiated</div>
                    <div>[09:12] ANALYST_7: Reviewing INC-A72</div>
                    <div>[09:44] AUTO: Pattern match on subnet_B</div>
                 </div>
              </div>
           </div>

           {/* Central Incident Table Area */}
           <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              <div className="flex-1 min-h-0">
                 <IncidentQueue 
                   incidents={incidents} 
                   onSelectIncident={(i) => setSelectedIncidentId(i.id)} 
                   selectedIncidentId={selectedIncidentId || undefined}
                 />
              </div>

              {/* Bottom Analytics Row */}
              <div className="h-48 flex gap-6">
                 <div className="flex-1 bg-void border border-border-primary/30 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[9px] font-heading font-black uppercase tracking-widest opacity-50">Attack_Propensity_Index</span>
                       <BarChart3 size={14} className="opacity-30" />
                    </div>
                    <div className="flex items-end gap-1 h-24 mb-2">
                       {[40, 60, 20, 80, 50, 90, 30, 45, 65, 75].map((h, i) => (
                         <div key={i} className="flex-1 bg-accent-cyan/20 border-t border-accent-cyan/40" style={{ height: `${h}%` }} />
                       ))}
                    </div>
                    <div className="text-[7px] font-mono opacity-30 flex justify-between uppercase">
                       <span>00:00</span>
                       <span>06:00</span>
                       <span>12:00</span>
                       <span>18:00</span>
                       <span>23:59</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Dynamic Detail Overlay */}
        <AnimatePresence>
          {selectedIncidentId && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute inset-0 bg-void/60 pointer-events-auto" onClick={() => setSelectedIncidentId(null)} />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 h-full w-[800px] pointer-events-auto"
              >
                <IncidentDetail 
                   incident={selectedIncident}
                   onClose={() => setSelectedIncidentId(null)}
                   onUpdateStatus={onUpdateIncidentStatus}
                   onAddNote={onAddIncidentNote}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-border-primary/50 bg-background-dark/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-accent-cyan uppercase">System_Active</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-0.5 h-2 bg-accent-cyan/40" />)}
              </div>
           </div>
           <div className="text-[8px] font-mono opacity-30 uppercase tracking-widest">Hash_Key: 0x7F2A...B01E</div>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono opacity-50">
           <span>DB_Latency: 12ms</span>
           <span>Model_Sync: OK</span>
           <span>{new Date().toISOString()}</span>
        </div>
      </footer>
    </motion.div>
  );
}
