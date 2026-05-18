import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, FastForward, 
  Clock, AlertCircle, Shield, Zap, Search, 
  Maximize2, Minimize2, Download, Trash2, Camera
} from 'lucide-react';
import { telemetryBus } from '../../telemetry/bus';
import { TelemetryTopic, TelemetryEnvelope } from '../../telemetry/schemas';
import { ReplayEngine, ReplayStatus } from '../../telemetry/replay';
import { cn } from '../../lib/utils';

export function AttackTimeline() {
  const [status, setStatus] = useState<ReplayStatus>(ReplayEngine.getStatus());
  const [history, setHistory] = useState<TelemetryEnvelope[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Record incoming events into local history for replay
    const unsubHistory = telemetryBus.subscribe('*', (env) => {
      const payload = env.payload as any;
      if (payload.source === 'replay_engine') return;
      if (env.topic === TelemetryTopic.METRIC_TICK) return;
      if (env.topic === TelemetryTopic.UI_ACTION) return;

      setHistory(prev => {
        const next = [...prev, env];
        // Side effect: load history into engine
        // Using setTimeout to defer to next tick, avoiding render-phase update issues
        setTimeout(() => ReplayEngine.load(next), 0);
        return next;
      });
    });

    // 2. Listen for replay status updates
    const unsubStatus = telemetryBus.subscribe(TelemetryTopic.UI_ACTION, (env) => {
      const payload = env.payload as any;
      if (payload.action === 'REPLAY_STATUS' && payload.source === 'replay_engine') {
        setStatus(payload.payload);
      }
    });

    return () => {
      unsubHistory();
      unsubStatus();
    };
  }, []);

  const handleScrub = (e: React.MouseEvent | React.TouchEvent) => {
    if (!scrubberRef.current || history.length === 0) return;
    
    const rect = scrubberRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const index = Math.floor(percentage * history.length);
    
    ReplayEngine.seek(index);
  };

  const markers = useMemo(() => {
    return history.map((ev, i) => {
      if (ev.topic === TelemetryTopic.ATTACK_ALERT) return { index: i, type: 'attack' };
      if (ev.topic === TelemetryTopic.DEFENSE_ACTION) return { index: i, type: 'defense' };
      if (ev.topic === TelemetryTopic.THREAT_ESCALATION) return { index: i, type: 'critical' };
      return null;
    }).filter(Boolean);
  }, [history]);

  if (history.length === 0 && !status.isPlaying) return null;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background-dark/90 border-t border-border-primary backdrop-blur-xl transition-all duration-500",
        isMinimized ? "h-12" : "h-48"
      )}
    >
      {/* Header / Controls */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-border-primary/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-cyan" />
            <span className="font-heading text-[10px] tracking-[2px] uppercase text-text-primary">Tactical_Incident_Timeline</span>
          </div>

          {/* Timeline Status */}
          <div className="flex items-center gap-4 px-4 py-1 bg-black/40 rounded border border-border-primary/30">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-secondary uppercase">Event:</span>
              <span className="text-[10px] font-mono text-accent-cyan">{status.currentIndex} / {status.totalEvents}</span>
            </div>
            <div className="w-px h-3 bg-border-primary/50" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-secondary uppercase">Time:</span>
              <span className="text-[10px] font-mono text-text-primary">
                {status.totalEvents > 0 && history[status.currentIndex - 1] 
                  ? new Date(history[status.currentIndex - 1].payload.timestamp || Date.now()).toLocaleTimeString()
                  : '--:--:--'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Playback Controls */}
          <div className="flex items-center gap-1 mr-4 bg-background-light/20 p-1 rounded-lg">
            <ControlButton icon={SkipBack} onClick={() => ReplayEngine.seek(0)} tooltip="Reset" />
            <ControlButton 
              icon={status.isPlaying ? Pause : Play} 
              onClick={() => status.isPlaying ? ReplayEngine.pause() : ReplayEngine.start()} 
              primary 
              tooltip={status.isPlaying ? "Pause" : "Play"}
            />
            <ControlButton icon={SkipForward} onClick={() => ReplayEngine.step()} tooltip="Step Forward" />
            <div className="w-px h-4 bg-border-primary/50 mx-1" />
            <select 
              className="bg-transparent text-[8px] uppercase tracking-widest text-text-secondary px-2 outline-none cursor-pointer"
              value={status.speed}
              onChange={(e) => ReplayEngine.setSpeed(Number(e.target.value))}
            >
              <option value={1000}>0.5x</option>
              <option value={500}>1.0x</option>
              <option value={200}>2.5x</option>
              <option value={50}>MAX</option>
            </select>
          </div>

          <div className="w-px h-6 bg-border-primary/50 mx-2" />
          
          <button 
            onClick={() => { setHistory([]); ReplayEngine.load([]); }}
            className="p-2 hover:bg-state-danger/10 text-text-secondary hover:text-state-danger rounded transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 text-text-secondary rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Timeline Area */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 flex flex-col gap-2 overflow-hidden h-[calc(100%-48px)]"
          >
            {/* Analytics Mini-Feed */}
            <div className="flex gap-4 mb-2">
               <AnalyticsBadge label="Compromised" value={markers.filter(m => m?.type === 'attack').length} color="text-state-danger" />
               <AnalyticsBadge label="Defenses" value={markers.filter(m => m?.type === 'defense').length} color="text-accent-gold" />
               <AnalyticsBadge label="Critical" value={markers.filter(m => m?.type === 'critical').length} color="text-state-warning" />
               <div className="flex-1" />
               <span className="text-[8px] text-text-secondary uppercase self-end mb-1">Incident_Duration: {Math.floor(history.length * (status.speed / 1000))}s</span>
            </div>

            {/* Scrubber */}
            <div className="relative group pt-4 pb-2">
              <div 
                ref={scrubberRef}
                onClick={handleScrub}
                onMouseMove={(e) => e.buttons === 1 && handleScrub(e)}
                className="relative h-4 bg-background-light/10 rounded-full cursor-pointer overflow-hidden border border-border-primary/30"
              >
                {/* Track Progress */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-accent-cyan/20 to-accent-cyan/40 border-r border-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.3)] transition-all duration-100"
                  style={{ width: `${(status.currentIndex / status.totalEvents) * 100}%` }}
                />

                {/* Markers */}
                {markers.map((m: any) => (
                  <div 
                    key={m.index}
                    className={cn(
                      "absolute top-0 bottom-0 w-[2px] transition-all",
                      m.type === 'attack' ? "bg-state-danger/60" : 
                      m.type === 'critical' ? "bg-state-warning" : "bg-accent-gold/60"
                    )}
                    style={{ left: `${(m.index / status.totalEvents) * 100}%` }}
                  />
                ))}
              </div>
              
              {/* Playhead Handle */}
              <div 
                className="absolute top-3 w-1 h-6 bg-white shadow-[0_0_10px_white] pointer-events-none transition-all duration-100 z-10"
                style={{ left: `${(status.currentIndex / status.totalEvents) * 100}%` }}
              />
            </div>

            {/* Event Snapshots (Visual Feed) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-edges">
              {history.slice(Math.max(0, status.currentIndex - 10), status.currentIndex + 5).map((ev, i) => {
                const globalIndex = history.indexOf(ev);
                const isActive = globalIndex === status.currentIndex - 1;

                return (
                  <div 
                    key={`${ev.topic}-${globalIndex}`}
                    onClick={() => ReplayEngine.seek(globalIndex + 1)}
                    className={cn(
                      "flex-shrink-0 w-32 p-2 rounded border transition-all cursor-pointer group",
                      isActive ? "bg-accent-cyan/10 border-accent-cyan" : "bg-black/20 border-border-primary/30 hover:border-border-primary"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[7px] font-bold uppercase",
                        ev.topic.startsWith('attack') ? "text-state-danger" : "text-text-secondary"
                      )}>
                        {ev.topic.split(':')[1]}
                      </span>
                      <span className="text-[6px] opacity-40">#{globalIndex}</span>
                    </div>
                    <p className="text-[8px] line-clamp-2 leading-tight text-text-secondary group-hover:text-text-primary transition-colors">
                      {(ev.payload as any).message || ev.topic}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnalyticsBadge({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7px] text-text-secondary uppercase tracking-tighter">{label}</span>
      <span className={cn("text-xs font-heading font-black", color)}>{value}</span>
    </div>
  );
}

function ControlButton({ icon: Icon, onClick, primary = false, tooltip = "" }: { icon: any, onClick: () => void, primary?: boolean, tooltip?: string }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded transition-all",
        primary 
          ? "bg-accent-cyan text-void shadow-[0_0_10px_#00FFD1] hover:scale-105" 
          : "text-text-secondary hover:text-text-primary hover:bg-white/10"
      )}
    >
      <Icon className={cn("w-4 h-4", primary ? "fill-current" : "")} />
    </button>
  );
}
