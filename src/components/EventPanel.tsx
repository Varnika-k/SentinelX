import { motion, AnimatePresence } from 'motion/react';
import { SimulationEvent } from '../types/simulation';
import { cn } from '../lib/utils';
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

export function EventPanel({ events }: { events: SimulationEvent[] }) {
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
    <div className="flex flex-col flex-1 bg-void border border-white/10 rounded-sm overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 space-y-4 bg-surface/50">
        <div className="flex items-center justify-between">
           <h3 className="text-[12px] font-heading font-black tracking-[3px] text-text-secondary uppercase">INCIDENT_FEED</h3>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn("p-1 transition-colors", showFilters ? "text-accent-cyan" : "text-text-secondary hover:text-white")}
              >
                 <Filter size={16} />
              </button>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
                 <span className="text-[10px] font-ui font-black text-accent-cyan tracking-[1px] uppercase">MONITORING</span>
              </div>
           </div>
        </div>

        <div className="space-y-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input 
                 type="text"
                 placeholder="SEARCH_LOGS..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-void border border-white/10 py-2 pl-10 pr-3 text-[11px] font-display font-bold tracking-[1px] text-white focus:outline-none focus:border-accent-cyan/50 uppercase placeholder:text-text-secondary/30"
              />
              {searchQuery && (
                <button 
                   onClick={() => setSearchQuery('')}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                >
                   <X size={10} />
                </button>
              )}
           </div>

           {showFilters && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               className="flex flex-wrap gap-2 pt-3 border-t border-white/5"
             >
                <div className="flex-1 min-w-[100px]">
                   <span className="text-[9px] font-heading text-text-secondary uppercase mb-1 block">Severity</span>
                   <select 
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full bg-void border border-white/10 text-[10px] font-display font-bold py-1.5 px-2 text-white focus:outline-none uppercase"
                   >
                      <option value="all">ALL_SEVERITY</option>
                      {severities.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
                <div className="flex-1 min-w-[100px]">
                   <span className="text-[9px] font-heading text-text-secondary uppercase mb-1 block">Log Type</span>
                   <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full bg-void border border-white/10 text-[10px] font-display font-bold py-1.5 px-2 text-white focus:outline-none uppercase"
                   >
                      <option value="all">ALL_TYPES</option>
                      {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
             </motion.div>
           )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {filteredEvents.map((event) => {
            const Icon = SEVERITY_ICONS[event.severity];
            return (
              <motion.div
                key={event.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "p-4 rounded-none border font-body text-[11px] leading-tight relative overflow-hidden group transition-all",
                  SEVERITY_COLORS[event.severity]
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-1.5 rounded-sm bg-white/5", event.severity === 'critical' ? "text-state-danger bg-state-danger/10" : "opacity-40 group-hover:opacity-100 transition-opacity")}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 opacity-50 text-[9px] font-heading font-black tracking-widest">
                      <span>[{event.id.slice(0, 4)} // {event.type.toUpperCase()}]</span>
                      <span>{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <p 
                      className="font-heading font-black tracking-[0.05em] text-[11px] leading-relaxed uppercase font-body"
                      title={event.message}
                    >
                      {event.message.length > 100 ? `${event.message.substring(0, 100)}...` : event.message}
                    </p>
                    {event.nodeId && (
                      <span className="text-[9px] text-accent-cyan mt-2 block font-bold">TARGET_UID: {event.nodeId}</span>
                    )}
                  </div>
                </div>
                {/* Visual accent */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1", event.severity === 'critical' ? "bg-state-danger" : "bg-white/10")} />
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredEvents.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-3 grayscale opacity-40">
             <Terminal size={32} />
             <span className="font-heading font-black text-[10px] tracking-[0.4em] uppercase">NO_RECORDS_FOUND</span>
          </div>
        )}
      </div>
    </div>
  );
}
