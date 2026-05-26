import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Zap, X, Trash2, Database, ShieldCheck, Activity, Link, History } from 'lucide-react';
import { telemetryBus } from '../../telemetry/bus';
import { TelemetryEnvelope, TelemetryTopic } from '../../telemetry/schemas';
import { ingestionManager } from '../../telemetry/ingestion-manager';
import { cn } from '../../lib/utils';
import { TelemetryProcessorMetrics } from '../../telemetry/enterprise-schemas';
import { ReplayEngine } from '../../telemetry/replay';

export function TelemetryDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<TelemetryEnvelope[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [metrics, setMetrics] = useState<TelemetryProcessorMetrics>(ingestionManager.getMetrics());
  const [isHistorical, setIsHistorical] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = telemetryBus.subscribe('*', (env) => {
      const payload = env.payload as any;
      if (payload.source === 'telemetry_diagnostics' || payload.source === 'replay_engine') return;
      if (env.topic === TelemetryTopic.UI_ACTION && payload.action === 'REPLAY_STATUS') return;

      setEvents(prev => [env, ...prev].slice(0, 200));
    });

    const metricsInterval = setInterval(() => {
      setMetrics(ingestionManager.getMetrics());
      setIsHistorical(ReplayEngine.isHistoricalMode());
    }, 1000);

    return () => {
      unsub();
      clearInterval(metricsInterval);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  const filteredEvents = events.filter(e => 
    !filter || e.topic.includes(filter) || JSON.stringify(e.payload).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={cn(
      "fixed bottom-52 left-4 z-[40] transition-all duration-300",
      isOpen ? "w-[450px]" : "w-10 h-10"
    )}>
      {isOpen ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-void/95 border border-border rounded-sm shadow-2xl flex flex-col h-[520px] backdrop-blur-md overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-void/50">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-accent-cyan" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">System_Diagnostic_Console</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-sm transition-colors text-text-tertiary hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Core Telemetry and Infrastructure Observability Metrics Grid */}
          <div className="grid grid-cols-4 gap-px bg-border border-b border-border">
            <div className="p-3 bg-void/80 flex flex-col gap-1">
               <span className="text-[7px] font-bold text-text-tertiary uppercase tracking-widest">Connectors</span>
               <div className="flex items-center gap-1.5 text-accent-cyan">
                 <Database size={10} />
                 <span className="text-[11px] font-mono font-bold leading-none">{metrics.activeConnectors}</span>
               </div>
            </div>
            <div className="p-3 bg-void/80 flex flex-col gap-1">
               <span className="text-[7px] font-bold text-text-tertiary uppercase tracking-widest">Ingested</span>
               <div className="flex items-center gap-1.5 text-accent-blue">
                 <Activity size={10} />
                 <span className="text-[11px] font-mono font-bold leading-none">{metrics.totalIngested}</span>
               </div>
            </div>
            <div className="p-3 bg-void/80 flex flex-col gap-1">
               <span className="text-[7px] font-bold text-text-tertiary uppercase tracking-widest">Normalized</span>
               <div className="flex items-center gap-1.5 text-accent-cyan">
                 <ShieldCheck size={10} />
                 <span className="text-[11px] font-mono font-bold leading-none">{metrics.totalNormalized}</span>
               </div>
            </div>
            <div className="p-3 bg-void/80 flex flex-col gap-1">
               <span className="text-[7px] font-bold text-text-tertiary uppercase tracking-widest">State Mode</span>
               <div className="flex items-center gap-1.5">
                 {isHistorical ? (
                   <div className="flex items-center gap-1 text-amber-500">
                     <History size={10} />
                     <span className="text-[8px] font-bold leading-none select-none uppercase">REPLAY</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-1 text-emerald-400">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-precision" />
                     <span className="text-[8px] font-bold leading-none select-none uppercase">LIVE</span>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Secondary Diagnostic Sub-Bar */}
          <div className="flex items-center justify-between border-b border-border bg-void/60 px-3 py-1 text-[8px] font-mono font-medium text-text-tertiary">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500/90 font-semibold">• WS_CONN: ACTIVE</span>
              <span>|</span>
              <span>BATCHING: ENGAGED</span>
            </div>
            <div className="flex items-center gap-1 text-[8px]">
              <span>CULLING: ACTIVE</span>
            </div>
          </div>

          {/* Search/Filter */}
          <div className="p-2 border-b border-border bg-void/30">
            <input 
              type="text"
              placeholder="Filter by topic or payload regex..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-void border border-border rounded-sm px-3 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-accent-cyan/50 placeholder:text-text-tertiary/40"
            />
          </div>

          {/* Event Stream */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-[9px] space-y-2 custom-scrollbar bg-void/20"
          >
            {filteredEvents.map((ev, i) => (
              <div key={i} className="group border-b border-border/20 pb-2 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "font-bold uppercase px-1.5 py-0.5 rounded-sm text-[8px] tracking-wider",
                    ev.topic.startsWith('attack') ? "bg-state-danger/10 text-state-danger border border-state-danger/20" : 
                    ev.topic === TelemetryTopic.SYSTEM_LOG ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" :
                    "bg-white/5 text-text-tertiary"
                  )}>
                    {ev.topic.replace(':', '_')}
                  </span>
                  <span className="text-[7px] text-text-tertiary font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed break-words pl-1 border-l border-white/5">
                  {JSON.stringify(ev.payload, null, 1)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 flex justify-between items-center bg-void border-t border-border">
             <div className="flex items-center gap-4">
               <span className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest">Buffer_Depth: {events.length}</span>
               <span className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest">EPS: {(metrics.totalNormalized / Math.max(1, (new Date().getTime() - 0) / 1000)).toFixed(1)}</span>
             </div>
             <button 
               onClick={() => setEvents([])} 
               className="p-1.5 hover:bg-state-danger/10 hover:text-state-danger rounded-sm transition-all text-text-tertiary"
               title="Clear Console"
             >
               <Trash2 size={12} />
             </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 rounded-sm bg-void border border-border flex items-center justify-center text-text-tertiary hover:text-accent-cyan hover:border-accent-cyan transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          <Terminal size={18} />
          {events.length > 0 && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-accent-cyan rounded-full animate-pulse-precision" />
          )}
        </button>
      )}
    </div>
  );
}
