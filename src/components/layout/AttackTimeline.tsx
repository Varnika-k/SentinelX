import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, FastForward, 
  Clock, AlertCircle, Shield, Zap, Search, 
  Maximize2, Minimize2, Download, Trash2, Camera,
  ChevronLeft, ChevronRight, Bookmark
} from 'lucide-react';
import { telemetryBus } from '../../telemetry/bus';
import { TelemetryTopic, TelemetryEnvelope } from '../../telemetry/schemas';
import { ReplayEngine, ReplayStatus } from '../../telemetry/replay';
import { cn } from '../../lib/utils';

interface EventMetadata {
  phase: string;
  badgeColor: string;
  borderColor: string;
  icon: string;
  impactTag?: string;
  isBookmark?: boolean;
}

/**
 * Maps telemetry events to enterprise Lockheed Martin Cyber Kill Chain and operational states.
 */
const getForensicMetadata = (ev: TelemetryEnvelope, index: number): EventMetadata => {
  const topic = ev.topic;
  const msg = (ev.payload as any).message || '';
  const lmsg = msg.toLowerCase();
  
  if (topic === TelemetryTopic.ATTACK_ALERT) {
    if (lmsg.includes('phishing')) {
      return { phase: 'PHASE 2: DELIVERY', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20', borderColor: 'border-red-500/30', icon: '📩', impactTag: 'EXP_RISK' };
    }
    if (lmsg.includes('insider') || lmsg.includes('credentials') || lmsg.includes('privilege')) {
      return { phase: 'PHASE 3: COMPROMISE', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20', borderColor: 'border-rose-500/30', icon: '👤', impactTag: 'CRED_BREACH' };
    }
    if (lmsg.includes('apt') || lmsg.includes('lateral')) {
      return { phase: 'PHASE 5: LATERAL MOVE', badgeColor: 'bg-pink-600/10 text-pink-400 border-pink-500/20', borderColor: 'border-pink-600/30', icon: '☣️', impactTag: 'ZONE_PROPAGATION' };
    }
    if (lmsg.includes('ddos') || lmsg.includes('ransomware') || lmsg.includes('exfil')) {
      return { phase: 'PHASE 7: ACTION ON OBJ', badgeColor: 'bg-red-600/20 text-red-500 font-bold border-red-500/40', borderColor: 'border-red-500/50', icon: '💥', impactTag: 'DATA_EXFIL', isBookmark: true };
    }
    return { phase: 'PHASE 4: EXPLOITATION', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20', borderColor: 'border-orange-500/30', icon: '🚨', impactTag: 'NODE_BREACH' };
  }
  
  if (topic === TelemetryTopic.DEFENSE_ACTION || topic === TelemetryTopic.DEFENSE_UPDATE) {
    if (lmsg.includes('isolate') || lmsg.includes('severed') || lmsg.includes('airgap')) {
      return { phase: 'AIRGAP SEVERANCE', badgeColor: 'bg-emerald-500/25 text-emerald-400 border-emerald-500/40 font-bold', borderColor: 'border-emerald-500/50', icon: '🛡️', impactTag: 'THREAT_CONTAINED', isBookmark: true };
    }
    if (lmsg.includes('shield') || lmsg.includes('containment')) {
      return { phase: 'SHIELD_CONTAINMENT', badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/20', borderColor: 'border-teal-500/30', icon: '⚡', impactTag: 'AUTO_SHIELD' };
    }
    return { phase: 'MITIGATION ACTIVE', badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25', borderColor: 'border-blue-500/30', icon: '🛡️', impactTag: 'VULN_PATCH' };
  }
  
  if (topic.startsWith('iam:')) {
    return { phase: 'IAM REVIEW', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25', borderColor: 'border-indigo-500/30', icon: '🔑', impactTag: 'CRED_LOCK' };
  }
  
  if (topic === TelemetryTopic.ENV_BOUNDARY_VIOLATION) {
    return { phase: 'BOUNDARY EXPLOIT', badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30', borderColor: 'border-amber-500/40', icon: '🚧', impactTag: 'TRUST_VIOLATION', isBookmark: true };
  }
  
  if (index === 0) {
    return { phase: 'INITIAL_GRID_BOOT', badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/30', borderColor: 'border-violet-500/45', icon: '📌', impactTag: 'OPERATIONAL_LIVE_LOCK', isBookmark: true };
  }

  return { phase: 'INTEL TELEMETRY', badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20', borderColor: 'border-slate-500/30', icon: '🛰️' };
};

export function AttackTimeline() {
  const [status, setStatus] = useState<ReplayStatus>(ReplayEngine.getStatus());
  const [history, setHistory] = useState<TelemetryEnvelope[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Record incoming events into local history for replay
    const unsubHistory = telemetryBus.subscribe('*', (env) => {
      const payload = env.payload as any;
      if (payload.source === 'replay_engine' || payload._isReplay) return;
      if (env.topic === TelemetryTopic.METRIC_TICK) return;
      if (env.topic === TelemetryTopic.UI_ACTION) return;

      setHistory(prev => {
        const next = [...prev, env];
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
      const topic = ev.topic;
      const meta = getForensicMetadata(ev, i);
      
      if (meta.isBookmark) return { index: i, type: 'bookmark' };
      if (topic === TelemetryTopic.ATTACK_ALERT) return { index: i, type: 'attack' };
      if (topic === TelemetryTopic.DEFENSE_ACTION) return { index: i, type: 'defense' };
      if (topic === TelemetryTopic.THREAT_ESCALATION) return { index: i, type: 'critical' };
      return null;
    }).filter((m): m is { index: number, type: string } => m !== null);
  }, [history]);

  const incidentDuration = useMemo(() => {
    if (history.length < 2) return '0s';
    const first = history[0].payload.timestamp;
    const last = history[history.length - 1].payload.timestamp;
    if (!first || !last) return '0s';
    try {
      const diff = Math.max(0, Math.floor((new Date(last).getTime() - new Date(first).getTime()) / 1000));
      return `${diff}s`;
    } catch {
      return '0s';
    }
  }, [history]);

  return (
    <motion.div 
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#020409]/95 backdrop-blur-xl transition-all duration-500 select-none pb-3 flex flex-col overflow-hidden shadow-[0_-10px_35px_rgba(0,0,0,0.9)]",
        isMinimized ? "h-12" : "h-[235px]"
      )}
    >
      {/* Header / Controls */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-white/5 bg-void/35">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <Clock className="w-4 h-4 text-accent-cyan" />
            <span className="font-heading text-[10px] tracking-[2px] uppercase text-text-primary">SentinelX_Forensic_Timeline: {status.totalEvents > 0 && status.currentIndex < status.totalEvents ? 'RECONSTRUCTIONMODE' : 'LIVEMODEMATERIALIZED'}</span>
          </div>
 
          {/* Timeline Status */}
          <div className="flex items-center gap-4 px-4 py-1 bg-black/40 rounded border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-secondary uppercase">SEQUENCE_ID:</span>
              <span className="text-[10px] font-mono text-accent-cyan font-bold">{status.currentIndex} / {status.totalEvents}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-secondary uppercase">TIMESTAMP:</span>
              <span className="text-[10px] font-mono text-text-primary">
                {status.totalEvents > 0 && history[status.currentIndex - 1] 
                  ? new Date(history[status.currentIndex - 1].payload.timestamp || Date.now()).toLocaleTimeString()
                  : 'BOOT_STATE'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Playback Controls */}
          <div className="flex items-center gap-1 bg-void/60 p-1 border border-white/5 rounded-sm">
            <ControlButton 
              icon={Search} 
              onClick={() => ReplayEngine.seek(history.length)} 
              tooltip="Jump to Live Sequence"
              active={status.currentIndex === status.totalEvents && !status.isPlaying}
            />
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <ControlButton icon={SkipBack} onClick={() => ReplayEngine.seek(0)} tooltip="Seek to Root Boot State" />
            <ControlButton icon={ChevronLeft} onClick={() => ReplayEngine.stepBack()} tooltip="Step Back (Previous Event)" />
            <ControlButton 
              icon={status.isPlaying ? Pause : Play} 
              onClick={() => status.isPlaying ? ReplayEngine.pause() : ReplayEngine.start()} 
              primary 
              tooltip={status.isPlaying ? "Pause Timeline Loop" : "Play Timeline Loop"}
            />
            <ControlButton icon={ChevronRight} onClick={() => ReplayEngine.step()} tooltip="Step Forward (Next Event)" />
            <div className="w-px h-4 bg-white/10 mx-1" />
            <select 
              className="bg-transparent text-[8.5px] font-mono uppercase tracking-widest text-text-secondary px-2 outline-none cursor-pointer border-l border-white/5"
              value={status.speed}
              onChange={(e) => ReplayEngine.setSpeed(Number(e.target.value))}
            >
              <option value={1000} className="bg-void text-text-primary">0.5x</option>
              <option value={500} className="bg-void text-text-primary">1.0x</option>
              <option value={200} className="bg-void text-text-primary">2.5x</option>
              <option value={50} className="bg-void text-text-primary">MAX</option>
            </select>
          </div>

          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <button 
            onClick={() => { setHistory([]); ReplayEngine.clearHistory(); }}
            className="p-1.5 hover:bg-state-danger/10 text-text-secondary hover:text-state-danger rounded transition-colors"
            title="Purge Forensic Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 text-text-secondary rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Timeline Area */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="px-6 py-3.5 flex flex-col gap-3.5 overflow-hidden h-[calc(100%-48px)] bg-void/10"
          >
            {/* Analytics Mini-Feed */}
            <div className="flex gap-6 items-center">
              <AnalyticsBadge label="Threat Vectors" value={markers.filter(m => m?.type === 'attack').length} color="text-state-danger" />
              <AnalyticsBadge label="Mitigations" value={markers.filter(m => m?.type === 'defense').length} color="text-accent-cyan" />
              <AnalyticsBadge label="Bookmarks" value={markers.filter(m => m?.type === 'bookmark').length} color="text-purple-400" />
              <div className="flex-1 border-b border-dashed border-white/5 h-px" />
              <span className="text-[8px] font-mono text-text-secondary uppercase select-none tracking-widest bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">Total_Operational_Duration: {incidentDuration}</span>
            </div>

            {/* Premium Progress Scrubber Track */}
            <div className="relative group pt-1">
              <div 
                ref={scrubberRef}
                onClick={handleScrub}
                onMouseMove={(e) => e.buttons === 1 && handleScrub(e)}
                className="relative h-4 bg-void/90 rounded cursor-pointer overflow-hidden border border-white/5 focus-ring transition-all hover:border-accent-cyan/20"
              >
                {/* Track Progress Fill */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-accent-cyan/5 to-accent-cyan/25 border-r border-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.15)] transition-all duration-100 animate-pulse"
                  style={{ width: `${history.length > 0 ? (status.currentIndex / history.length) * 100 : 0}%` }}
                />

                {/* Highly Styled Markers */}
                {markers.map((m: any) => (
                  <div 
                    key={m.index}
                    className={cn(
                      "absolute top-0 bottom-0 w-[4px] transition-all z-10",
                      m.type === 'bookmark' ? "bg-purple-500 shadow-[0_0_10px_#8b5cf6]" :
                      m.type === 'attack' ? "bg-state-danger/90 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" : 
                      m.type === 'critical' ? "bg-state-warning shadow-[0_0_10px_rgba(245,158,11,0.8)]" : "bg-accent-cyan shadow-[0_0_10px_rgba(0,255,209,0.8)]"
                    )}
                    style={{ left: `${(m.index / history.length) * 100}%` }}
                    title={`Event index #${m.index} (${m.type})`}
                  />
                ))}
              </div>
              
              {/* Playhead Slider Handle */}
              <div 
                className="absolute top-0 w-1.5 h-6 bg-accent-cyan shadow-[0_0_15px_#00FFD1] border border-white rounded-sm pointer-events-none transition-all duration-100 z-20"
                style={{ left: `${history.length > 0 ? (status.currentIndex / history.length) * 100 : 0}%`, transform: 'translateX(-50%)' }}
              />
            </div>

            {/* Kill Chain Phase Guides (Atmospheric infrastructural layer) */}
            <div className="flex justify-between text-[7px] font-mono text-text-tertiary/75 px-2 pb-1.5 tracking-[0.1em] border-b border-white/5 select-none font-bold">
              <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-500/50" /> RECONNAISSANCE</div>
              <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cyan-500/50" /> DELIVERY & ACCESS</div>
              <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-orange-500/50" /> VULN EXPL_PLOITATION</div>
              <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-rose-500/50" /> PRIVILEGE ESCALATION</div>
              <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-pink-500/50 animate-pulse" /> LATERAL_WORKLOAD_PROPAGATION</div>
              <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-500/50" /> EXFILTRATION & DIRECT IMPACT</div>
            </div>

            {/* Event Snapshots (Visual Feed) - Rich Forensic Cards */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-track-void/10 scrollbar-thumb-white/10 mask-fade-edges">
              {history.map((ev, globalIndex) => {
                const isActive = globalIndex === status.currentIndex - 1;
                const meta = getForensicMetadata(ev, globalIndex);

                return (
                  <motion.div 
                    layout
                    key={`${ev.topic}-${globalIndex}-${ev.payload?.eventId}`}
                    onClick={() => ReplayEngine.seek(globalIndex + 1)}
                    className={cn(
                      "flex-shrink-0 w-52 p-2.5 rounded border transition-all cursor-pointer group flex flex-col justify-between h-20 bg-void/50",
                      isActive 
                        ? "bg-accent-cyan/15 border-accent-cyan/100 shadow-[0_0_20px_rgba(0,255,209,0.15)] ring-1 ring-accent-cyan/30" 
                        : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-1">
                        <span className={cn(
                          "text-[7px] font-bold uppercase truncate px-1 rounded-xs leading-normal border",
                          meta.badgeColor
                        )}>
                          {meta.phase}
                        </span>
                        <span className="text-[6px] font-mono opacity-45 shrink-0">#{globalIndex + 1}</span>
                      </div>
                      <p className="text-[8px] line-clamp-2 leading-[1.2] text-text-secondary group-hover:text-text-primary transition-colors font-sans mb-1 uppercase font-semibold tracking-wide">
                        {meta.icon} {(ev.payload as any).message || ev.topic}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[6px] font-mono border-t border-white/5 pt-1 mt-auto">
                      <span className="text-text-tertiary">
                        {new Date(ev.payload.timestamp).toLocaleTimeString()}
                      </span>
                      {meta.impactTag && (
                        <span className="text-accent-cyan font-bold tracking-widest">{meta.impactTag}</span>
                      )}
                    </div>
                  </motion.div>
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
    <div className="flex flex-col select-none">
      <span className="text-[7px] text-text-secondary uppercase tracking-[0.1em] font-mono">{label}</span>
      <span className={cn("text-sm font-heading font-black leading-none", color)}>{value}</span>
    </div>
  );
}

function ControlButton({ icon: Icon, onClick, primary = false, active = false, tooltip = "" }: { icon: any, onClick: () => void, primary?: boolean, active?: boolean, tooltip?: string }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded transition-all",
        primary 
          ? "bg-accent-cyan text-void shadow-[0_0_12px_#00FFD1] hover:scale-105" 
          : active 
            ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40"
            : "text-text-secondary hover:text-text-primary hover:bg-white/15"
      )}
    >
      <Icon className={cn("w-4 h-4", primary ? "fill-current" : "")} />
    </button>
  );
}
