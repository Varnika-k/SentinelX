import { motion, AnimatePresence } from 'motion/react';
import { TelemetryEvent } from '../../types/telemetry';
import { cn } from '../../lib/utils';
import { Terminal, Shield, AlertTriangle, Info, Search, Filter, X } from 'lucide-react';
import { useState, useMemo } from 'react';

const SEVERITY_ICONS = {
  low: Info,
  medium: Terminal,
  high: AlertTriangle,
  critical: Shield,
};

const SEVERITY_COLORS = {
  low: 'text-accent-cyan border-white/5 bg-accent-cyan/5',
  medium: 'text-state-warning border-white/5 bg-state-warning/5',
  high: 'text-state-danger/80 border-white/5 bg-state-danger/5',
  critical: 'text-state-danger border-state-danger/20 bg-state-danger/10',
};

export function EventPanel({ events }: { events: TelemetryEvent[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (event.nodeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [events, searchQuery, severityFilter, typeFilter]);

  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type));
    return Array.from(types);
  }, [events]);

  const severities = ['low', 'medium', 'high', 'critical'];

  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  return (
    <div className="flex flex-col flex-1 bg-void border border-border rounded-sm overflow-hidden shadow-2xl font-sans">
      <div className="p-4 border-b border-border space-y-4 bg-void/50">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Terminal size={14} className="text-accent-cyan" />
             <h3 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Operational_Log_Stream</h3>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn("p-1.5 transition-all precision-button rounded-sm", showFilters ? "text-accent-cyan border-accent-cyan/50 bg-accent-cyan/10" : "text-text-tertiary hover:text-white")}
              >
                 <Filter size={14} />
              </button>
              <div className="flex items-center gap-2 px-2 py-0.5 border border-accent-cyan/20 bg-accent-cyan/5 rounded-sm">
                 <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse-precision" />
                 <span className="text-[8px] font-mono font-bold text-accent-cyan tracking-widest uppercase">Live_Feed</span>
              </div>
           </div>
        </div>

        <div className="space-y-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-3.5 h-3.5 group-focus-within:text-accent-cyan transition-colors" />
              <input 
                 type="text"
                 placeholder="Search logs [regex support]..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-void border border-border py-2 pl-10 pr-3 text-[10px] font-mono text-text-primary focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-tertiary/40"
              />
           </div>

           <AnimatePresence>
             {showFilters && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="flex gap-2 pt-3 border-t border-border/50 overflow-hidden"
               >
                  <div className="flex-1">
                     <span className="text-[8px] font-bold text-text-tertiary uppercase mb-1.5 block tracking-widest">Severity_Class</span>
                     <select 
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="w-full bg-void border border-border text-[10px] font-mono py-1.5 px-2 text-text-secondary focus:outline-none focus:border-accent-cyan/30"
                     >
                        <option value="all">all_levels</option>
                        {severities.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                  <div className="flex-1">
                     <span className="text-[8px] font-bold text-text-tertiary uppercase mb-1.5 block tracking-widest">Event_Type</span>
                     <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-void border border-border text-[10px] font-mono py-1.5 px-2 text-text-secondary focus:outline-none focus:border-accent-cyan/30"
                     >
                        <option value="all">all_types</option>
                        {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-0 space-y-px custom-scrollbar bg-panel/30">
        <AnimatePresence initial={false}>
          {filteredEvents.map((event) => {
            const Icon = SEVERITY_ICONS[event.severity] || Info;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "px-4 py-3 border-l-2 font-body transition-all relative group flex items-start gap-4 hover:bg-white/[0.02]",
                  event.severity === 'high' || event.severity === 'critical' ? "border-state-danger bg-state-danger/[0.02]" : 
                  event.severity === 'medium' ? "border-state-warning bg-state-warning/[0.02]" : 
                  "border-border-bright/20"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-sm shrink-0 transition-all",
                  event.severity === 'critical' || event.severity === 'high' ? "text-state-danger bg-state-danger/10" : 
                  event.severity === 'medium' ? "text-state-warning bg-state-warning/10" :
                  "text-text-tertiary bg-white/5 opacity-40 group-hover:opacity-100"
                )}>
                  <Icon className="w-3 h-3" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 opacity-40 text-[8px] font-mono tracking-tighter">
                    <div className="flex items-center gap-2">
                       <span className="group-hover:text-accent-cyan transition-colors">ID_0x{event.id.slice(0, 4).toUpperCase()} // {event.type.toLowerCase()}</span>
                       {event.metadata?.confidence && (
                         <span className="text-[7px] text-accent-blue font-bold px-1 bg-accent-blue/5 border border-accent-blue/20 rounded-sm">
                           {Math.round(event.metadata.confidence * 100)}%_CONF
                         </span>
                       )}
                    </div>
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <p className={cn(
                    "text-[10px] leading-relaxed tracking-tight break-words",
                    event.severity === 'high' || event.severity === 'critical' ? "text-text-primary font-bold" : "text-text-secondary"
                  )}>
                    {event.message}
                  </p>
                  {event.nodeId && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                       <div className="w-1 h-1 bg-accent-cyan rounded-full" />
                       <span className="text-[8px] font-mono text-accent-cyan leading-none font-bold uppercase tracking-widest">Target_Ref: {event.nodeId}</span>
                    </div>
                  )}
                </div>

                <div className="absolute right-2 bottom-2 text-[7px] font-mono text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                  v{event.id.slice(-2)}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredEvents.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-text-tertiary gap-3 opacity-20">
             <Terminal size={32} />
             <span className="text-[10px] font-bold tracking-[0.4em] uppercase">No_Records_Found</span>
          </div>
        )}
      </div>
    </div>
  );
}
