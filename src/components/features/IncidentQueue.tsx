import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, ChevronRight, Activity, AlertTriangle, ShieldCheck, Search, Filter } from 'lucide-react';
import { Incident, IncidentStatus } from '../../types/incident';
import { cn } from '../../lib/utils';
import { Severity } from '../../types/telemetry';

interface Props {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedIncidentId?: string;
}

export function IncidentQueue({ incidents, onSelectIncident, selectedIncidentId }: Props) {
  const [filter, setFilter] = React.useState<IncidentStatus | 'all'>('all');

  const filteredIncidents = incidents.filter(i => filter === 'all' || i.status === filter);

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'detected': return 'text-state-danger';
      case 'investigating': return 'text-state-warning';
      case 'escalated': return 'text-state-danger animate-pulse';
      case 'contained': return 'text-accent-cyan';
      case 'resolved': return 'text-accent-cyan opacity-50';
      default: return 'text-text-secondary';
    }
  };

  const getSeverityBg = (severity: Severity) => {
    switch (severity) {
      case 'critical': return 'bg-state-danger/10 border-state-danger/30';
      case 'high': return 'bg-state-warning/10 border-state-warning/30';
      default: return 'bg-background-light/5 border-border-primary/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-void/80 border border-border-primary/50 rounded-sm backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-primary/50 bg-background-light/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-[10px] font-heading font-black tracking-[2px] uppercase">Incident_Queue</h2>
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            {filteredIncidents.length} Records
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
             <input 
               type="text" 
               placeholder="Filter ID/Title..."
               className="w-full bg-void border border-border-primary/30 rounded py-1 pl-7 pr-2 text-[9px] font-mono outline-none focus:border-accent-cyan/50"
             />
          </div>
          <button className="p-1 border border-border-primary/30 rounded hover:bg-background-light/10">
            <Filter className="w-3 h-3 opacity-50" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'detected', 'investigating', 'contained', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={cn(
                "px-2 py-0.5 rounded text-[8px] font-heading font-bold uppercase whitespace-nowrap transition-all border",
                filter === s 
                  ? "bg-accent-cyan text-void border-accent-cyan" 
                  : "bg-void text-text-secondary border-border-primary/20 hover:border-accent-cyan/40"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredIncidents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 mt-12">
              <ShieldCheck className="w-12 h-12 mb-2" />
              <p className="text-[10px] uppercase font-heading tracking-widest text-center">No_Incidents_Logged</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={cn(
                  "group relative p-3 border transition-all cursor-pointer overflow-hidden",
                  incident.id === selectedIncidentId 
                    ? "bg-accent-cyan/5 border-accent-cyan" 
                    : "bg-background-light/5 border-border-primary/20 hover:border-accent-cyan/30"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black font-heading tracking-tight mb-0.5 break-words">
                      {incident.title}
                    </span>
                    <span className="text-[8px] font-mono text-text-secondary uppercase">
                      {incident.id}
                    </span>
                  </div>
                  <div className={cn("text-[9px] font-black uppercase whitespace-nowrap", getStatusColor(incident.status))}>
                    {incident.status}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 opacity-30" />
                    <span className="text-[8px] font-mono opacity-50">
                      {new Date(incident.detectionTime).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 opacity-30" />
                    <span className="text-[8px] font-mono opacity-50">
                      {incident.affectedNodeIds.length} Nodes
                    </span>
                  </div>
                  <div className={cn(
                    "ml-auto px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border",
                    getSeverityBg(incident.severity)
                  )}>
                    {incident.severity}
                  </div>
                </div>

                {/* Decoration */}
                <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity translate-x-2 translate-y-2 scale-150">
                   <AlertTriangle className="w-8 h-8" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
