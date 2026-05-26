import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, Zap, Search, 
  Maximize2, Minimize2, Trash2, ChevronLeft, ChevronRight,
  Shield, AlertTriangle, Eye, ShieldAlert, Sparkles, Terminal,
  Activity, TrendingUp, Info
} from 'lucide-react';
import { telemetryBus } from '../../telemetry/bus';
import { TelemetryTopic, TelemetryEnvelope } from '../../telemetry/schemas';
import { ReplayEngine, ReplayStatus } from '../../telemetry/replay';
import { cn } from '../../lib/utils';
import { SimulationState } from '../../types/simulation';
import { NetworkNode } from '../../types/network';

export type ReplayPhase = 
  | 'INITIAL_ACCESS'
  | 'RECON'
  | 'LATERAL_MOVEMENT'
  | 'PRIV_ESC'
  | 'DATA_ACCESS'
  | 'PERSISTENCE'
  | 'CONTAINMENT'
  | 'RECOVERY';

export const REPLAY_PHASES: ReplayPhase[] = [
  'INITIAL_ACCESS',
  'RECON',
  'LATERAL_MOVEMENT',
  'PRIV_ESC',
  'DATA_ACCESS',
  'PERSISTENCE',
  'CONTAINMENT',
  'RECOVERY'
];

export const PHASE_LABELS: Record<ReplayPhase, string> = {
  INITIAL_ACCESS: 'Initial Access',
  RECON: 'Reconnaissance',
  LATERAL_MOVEMENT: 'Lateral Spread',
  PRIV_ESC: 'Privilege Escalation',
  DATA_ACCESS: 'Data Harvesting',
  PERSISTENCE: 'Persistence Hold',
  CONTAINMENT: 'Containment Guard',
  RECOVERY: 'System Recovery'
} as const;

export const PHASE_ICONS: Record<ReplayPhase, string> = {
  INITIAL_ACCESS: '📥',
  RECON: '🔍',
  LATERAL_MOVEMENT: '☣️',
  PRIV_ESC: '👑',
  DATA_ACCESS: '💥',
  PERSISTENCE: '📌',
  CONTAINMENT: '🛡️',
  RECOVERY: '⚡'
} as const;

export const PHASE_COLORS: Record<ReplayPhase, { text: string; bg: string; border: string; glow: string }> = {
  INITIAL_ACCESS: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', glow: 'shadow-[0_0_10px_rgba(99,102,241,0.2)]' },
  RECON: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/25', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]' },
  LATERAL_MOVEMENT: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', glow: 'shadow-[0_0_10px_rgba(236,72,153,0.2)]' },
  PRIV_ESC: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25', glow: 'shadow-[0_0_10px_rgba(244,63,94,0.2)]' },
  DATA_ACCESS: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' },
  PERSISTENCE: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
  CONTAINMENT: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
  RECOVERY: { text: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/25', glow: 'shadow-[0_0_10px_rgba(0,255,209,0.3)]' }
};

export const mapEventToPhase = (ev: TelemetryEnvelope, index: number): ReplayPhase => {
  const topic = ev.topic;
  const msg = ((ev.payload as any).message || '').toLowerCase();
  
  if (index === 0) return 'INITIAL_ACCESS';
  
  // Containment & Mitigations
  if (topic === TelemetryTopic.DEFENSE_ACTION || topic === TelemetryTopic.DEFENSE_UPDATE || 
      msg.includes('isolate') || msg.includes('quarantine') || msg.includes('severed') || 
      msg.includes('airgap') || msg.includes('shield') || msg.includes('firewall')) {
    return 'CONTAINMENT';
  }
  
  // Recovery
  if (msg.includes('patch') || msg.includes('recover') || msg.includes('restore') || 
      msg.includes('stable') || msg.includes('symmetrical') || msg.includes('clean') || msg.includes('reverted')) {
    return 'RECOVERY';
  }
  
  // Exfiltration / Objective Action
  if (msg.includes('exfil') || msg.includes('exfiltration') || msg.includes('harvest') || 
      msg.includes('stolen') || msg.includes('leak') || msg.includes('ransomware') || 
      msg.includes('ddos') || msg.includes('unauthorized queries') || msg.includes('data exfiltration')) {
    return 'DATA_ACCESS';
  }

  // Privilege Escalation
  if (msg.includes('credential') || msg.includes('privilege') || msg.includes('admin') || 
      msg.includes('root') || msg.includes('escalat') || msg.includes('elevat') || topic.startsWith('iam:')) {
    return 'PRIV_ESC';
  }

  // Persistence
  if (msg.includes('persistence') || msg.includes('backdoor') || msg.includes('cron') || 
      msg.includes('registry') || msg.includes('install') || msg.includes('breached')) {
    return 'PERSISTENCE';
  }
  
  // Lateral Movement
  if (msg.includes('lateral') || msg.includes('apt') || msg.includes('spread') || 
      msg.includes('propagation') || msg.includes('hop') || msg.includes('compromise') && !msg.includes('pc-1')) {
    return 'LATERAL_MOVEMENT';
  }

  // Recon
  if (msg.includes('scan') || msg.includes('discover') || msg.includes('recon') || 
      msg.includes('mapping') || msg.includes('probe') || msg.includes('boundary')) {
    return 'RECON';
  }
  
  // Fallback / Initial Access
  if (msg.includes('phishing') || msg.includes('delivery') || msg.includes('gateway') || 
      msg.includes('login') || msg.includes('access') || msg.includes('pc-1') || msg.includes('initial')) {
    return 'INITIAL_ACCESS';
  }
  
  // Topic-based fallbacks
  if (topic === TelemetryTopic.ATTACK_ALERT) {
    if (msg.includes('lateral') || msg.includes('apt')) return 'LATERAL_MOVEMENT';
    return 'INITIAL_ACCESS';
  }
  if (topic === TelemetryTopic.ENV_BOUNDARY_VIOLATION) {
    return 'RECON';
  }
  
  return 'RECON';
};

interface EventMetadata {
  phase: string;
  badgeColor: string;
  borderColor: string;
  icon: string;
  impactTag?: string;
  isBookmark?: boolean;
}

const getForensicMetadata = (ev: TelemetryEnvelope, index: number): EventMetadata => {
  const phase = mapEventToPhase(ev, index);
  const colorScheme = PHASE_COLORS[phase];
  
  const impactTag = 
    phase === 'INITIAL_ACCESS' ? 'INGRESS_ENTRY' :
    phase === 'RECON' ? 'RESOURCE_ENUM' :
    phase === 'LATERAL_MOVEMENT' ? 'SUBNET_HOP' :
    phase === 'PRIV_ESC' ? 'PRIV_ELEVATION' :
    phase === 'DATA_ACCESS' ? 'DATA_HARVEST' :
    phase === 'PERSISTENCE' ? 'FOOTHOLD_LOCK' :
    phase === 'CONTAINMENT' ? 'AUTO_QUARANTINE' : 'RESILIENCE_OK';

  return {
    phase: PHASE_LABELS[phase].toUpperCase(),
    badgeColor: `${colorScheme.bg} ${colorScheme.text} ${colorScheme.border}`,
    borderColor: 'border-white/5',
    icon: PHASE_ICONS[phase],
    impactTag,
    isBookmark: phase === 'DATA_ACCESS' || phase === 'CONTAINMENT' || phase === 'INITIAL_ACCESS'
  };
};

const getForensicIntelligence = (history: TelemetryEnvelope[], activeIndex: number, nodes: NetworkNode[]) => {
  if (history.length === 0 || activeIndex === 0) {
    return {
      rootCause: "PENDING CORRELATION",
      blastRadius: 0,
      propagationPath: "NONE DETECTED",
      criticalEscalation: "NONE",
      weaknessIdentified: "Awaiting anomaly indicators...",
      mitigationOpportunity: "Monitor inbound entry conduits.",
      narrativeSummary: "Operational grid is in starting boot state. Standard firewall protocols active. Core trust anchors fully isolated."
    };
  }

  const activeHistory = history.slice(0, activeIndex);
  
  // 1. Blast Radius Calculation
  const compromisedIds = new Set<string>();
  const isolatedIds = new Set<string>();
  
  activeHistory.forEach(ev => {
    const p = ev.payload as any;
    if (ev.topic === TelemetryTopic.NODE_UPDATE) {
      if (p.status === 'compromised') {
        compromisedIds.add(p.nodeId);
      } else if (p.status === 'isolated') {
        compromisedIds.delete(p.nodeId);
        isolatedIds.add(p.nodeId);
      } else if (p.status === 'safe') {
        compromisedIds.delete(p.nodeId);
        isolatedIds.delete(p.nodeId);
      }
    }
    const msg = (p.message || '').toLowerCase();
    if (msg.includes('compromised node') || msg.includes('breached')) {
      const match = msg.match(/[a-zA-Z0-9-]+\-\d+|[a-zA-Z0-9\-]+/);
      if (match) compromisedIds.add(match[0]);
    }
    if (msg.includes('isolated node') || msg.includes('airgap')) {
      const match = msg.match(/[a-zA-Z0-9-]+\-\d+|[a-zA-Z0-9\-]+/);
      if (match) {
        compromisedIds.delete(match[0]);
        isolatedIds.add(match[0]);
      }
    }
  });

  const totalN = nodes.length || 10;
  const blastRadiusRatio = Math.min(100, Math.round((compromisedIds.size / totalN) * 100));

  // 2. Root Cause Analysis
  let rootCause = "Inbound Gateway Credential Phishing";
  const firstAttack = history.find(ev => ev.topic === TelemetryTopic.ATTACK_ALERT);
  if (firstAttack) {
    const type = (firstAttack.payload as any).attackType || '';
    if (type === 'phishing') {
      rootCause = "Phishing Campaign targeting Workstations";
    } else if (type === 'insider') {
      rootCause = "Insider Credential Leak / Rogue Administrator";
    } else if (type === 'zeroday') {
      rootCause = "Zero-Day Exploit on Security Gateways";
    } else if (type === 'ddos') {
      rootCause = "Distributed Denial of Service (DDoS) Flood";
    } else {
      rootCause = "External Anomaly Ingress Compromise";
    }
  }

  // 3. Propagation Path
  const pathNodes = activeHistory
    .filter(ev => ev.topic === TelemetryTopic.NODE_UPDATE && (ev.payload as any).status === 'compromised')
    .map(ev => (ev.payload as any).nodeId)
    .filter((v, i, self) => self.indexOf(v) === i);
  
  const propagationPath = pathNodes.length > 0 ? pathNodes.join(" ➔ ") : "Initial Foothold";

  // 4. Critical Escalation Moment
  const escalationEvent = activeHistory.find(ev => 
    ev.payload.severity === 'critical' || 
    ev.topic === TelemetryTopic.ENV_BOUNDARY_VIOLATION ||
    (ev.payload as any).message?.toLowerCase().includes('database') ||
    (ev.payload as any).message?.toLowerCase().includes('exfil') ||
    (ev.payload as any).message?.toLowerCase().includes('escalat')
  );
  
  const criticalEscalation = escalationEvent 
    ? `Index #${history.indexOf(escalationEvent) + 1}: ${((escalationEvent.payload as any).message || escalationEvent.topic).slice(0, 48).toUpperCase()}...`
    : "No major privilege or database breaches active yet.";

  // 5. Surfaced Weaknesses
  let weaknessIdentified = "Insufficient microsegmentation across Workstations.";
  if (activeHistory.some(ev => (ev.payload as any).message?.toLowerCase().includes('database'))) {
    weaknessIdentified = "Unencrypted database ports indicating direct data exfil exposure.";
  } else if (activeHistory.some(ev => (ev.payload as any).message?.toLowerCase().includes('iam:'))) {
    weaknessIdentified = "Overly privileged IAM credentials mapping directly to critical workloads.";
  } else if (activeHistory.some(ev => (ev.payload as any).message?.toLowerCase().includes('firewall') || (ev.payload as any).message?.toLowerCase().includes('gateway'))) {
    weaknessIdentified = "Outdated edge firewall rules allowing unauthenticated port queries.";
  }

  // 6. Mitigation Opportunities
  let mitigationOpportunity = "Deploy host-level micro-segmentation.";
  if (compromisedIds.size > 2) {
    mitigationOpportunity = "Engage full network airgapping of srv-1 sector.";
  } else if (isolatedIds.size > 0) {
    mitigationOpportunity = "Trigger dynamic multi-factor lease rotation.";
  } else if (activeHistory.some(ev => (ev.payload as any).message?.toLowerCase().includes('phishing'))) {
    mitigationOpportunity = "Deprovision compromised pc-1 credentials.";
  }

  // 7. Humanized Narrative Summary Prose
  const latestEv = activeHistory[activeHistory.length - 1];
  const latestMsg = latestEv ? ((latestEv.payload as any).message || latestEv.topic).toLowerCase() : "";
  const latestPhase = mapEventToPhase(latestEv || history[0], activeIndex - 1);

  let narrativeSummary = "Operational grid is in starting boot state. Core security anchors safe.";
  
  if (latestPhase === 'INITIAL_ACCESS') {
    narrativeSummary = `Attack campaign initiated. Adversary established ingress foothold via initial access payload. Vulnerability targeted: ${rootCause.toLowerCase()}.`;
  } else if (latestPhase === 'RECON') {
    narrativeSummary = `Adversary actively scanning the grid topology, mapping domain controller nodes, active trust bounds, and looking for open egress tunnels.`;
  } else if (latestPhase === 'LATERAL_MOVEMENT') {
    narrativeSummary = `Adversary propagating horizontally across subnets mapping directly onto secondary workloads. Compromised trail: [${propagationPath}].`;
  } else if (latestPhase === 'PRIV_ESC') {
    narrativeSummary = `High severity alert: Privilege escalation achieved. Attacker acquired root admin rights or active SSH certificates, breaching secure trust barriers.`;
  } else if (latestPhase === 'DATA_ACCESS') {
    narrativeSummary = `CRITICAL FORENSIC TRIGGER: Unauthenticated data query executed on core systems. Attacker accessing database schemas to trigger exfiltration.`;
  } else if (latestPhase === 'PERSISTENCE') {
    narrativeSummary = `Security threat: Persistence mechanism verified. Rogue cron task or unauthorized boot task established, locking host access controls.`;
  } else if (latestPhase === 'CONTAINMENT') {
    narrativeSummary = `Shields deployed! Autonomous containment isolated compromised hosts, successfully neutralizing trust path lateral movement.`;
  } else if (latestPhase === 'RECOVERY') {
    narrativeSummary = `Self-monitoring recovery procedures engaged. Nodes reverted to healthy baselines, software patches applied, and system indicators stabilizing.`;
  }

  return {
    rootCause,
    blastRadius: blastRadiusRatio,
    propagationPath,
    criticalEscalation,
    weaknessIdentified,
    mitigationOpportunity,
    narrativeSummary
  };
};

interface AttackTimelineProps {
  simulationState: SimulationState;
}

export function AttackTimeline({ simulationState }: AttackTimelineProps) {
  const [status, setStatus] = useState<ReplayStatus>(ReplayEngine.getStatus());
  const [history, setHistory] = useState<TelemetryEnvelope[]>(ReplayEngine.getHistory());
  const [isMinimized, setIsMinimized] = useState(false);
  const [pauseOnEscalation, setPauseOnEscalation] = useState(true);
  
  const scrubberRef = useRef<HTMLDivElement>(null);
  const lastPausedIndexRef = useRef<number>(-1);

  // Synchronize history perfectly
  useEffect(() => {
    // Read starting baseline
    setHistory(ReplayEngine.getHistory());

    const unsubHistory = telemetryBus.subscribe('*', (env) => {
      const payload = env.payload as any;
      if (payload.source === 'replay_engine' || payload._isReplay) return;
      if (env.topic === TelemetryTopic.METRIC_TICK) return;
      if (env.topic === TelemetryTopic.UI_ACTION) return;

      // Update state
      setHistory(ReplayEngine.getHistory());
    });

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

  // PAUSE ON CRITICAL ESCALATION ENGINE
  useEffect(() => {
    if (status.isPlaying && status.currentIndex >= 1 && status.currentIndex <= history.length) {
      const currentEvent = history[status.currentIndex - 1];
      if (currentEvent && pauseOnEscalation) {
        const payload = currentEvent.payload as any;
        const msg = (payload.message || '').toLowerCase();
        
        const isEscalation = 
          currentEvent.topic === TelemetryTopic.THREAT_ESCALATION || 
          currentEvent.topic === TelemetryTopic.ENV_BOUNDARY_VIOLATION || 
          payload.severity === 'critical' || 
          msg.includes('escalat') || 
          msg.includes('privilege') || 
          msg.includes('exfil') || 
          msg.includes('unauthorized database queries');

        if (isEscalation && lastPausedIndexRef.current !== status.currentIndex) {
          lastPausedIndexRef.current = status.currentIndex;
          ReplayEngine.pause();
          
          telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
            source: 'narrator_ai',
            message: `FORENSIC PAUSE: Automatic checkpoint trigger hit on critical escalation index #${status.currentIndex}`,
            severity: 'high'
          });
        }
      }
    }
  }, [status.currentIndex, status.isPlaying, history, pauseOnEscalation]);

  const handleScrub = (e: React.MouseEvent | React.TouchEvent) => {
    if (!scrubberRef.current || history.length === 0) return;
    
    const rect = scrubberRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const index = Math.floor(percentage * history.length);
    
    ReplayEngine.seek(index);
  };

  // Group events by Phase to find starting event-indices for segmented jump controls
  const phaseStarts = useMemo(() => {
    const starts: Partial<Record<ReplayPhase, number>> = {};
    history.forEach((ev, idx) => {
      const phase = mapEventToPhase(ev, idx);
      if (starts[phase] === undefined) {
        starts[phase] = idx + 1; // 1-index for replay seek
      }
    });
    return starts;
  }, [history]);

  // Track event classification markers
  const markers = useMemo(() => {
    return history.map((ev, i) => {
      const p = ev.payload as any;
      const msg = (p.message || '').toLowerCase();
      
      let type: 'attack' | 'defense' | 'critical' | 'bookmark' = 'attack';
      if (ev.topic === TelemetryTopic.DEFENSE_ACTION || ev.topic === TelemetryTopic.DEFENSE_UPDATE) {
        type = 'defense';
      } else if (p.severity === 'critical' || ev.topic === TelemetryTopic.THREAT_ESCALATION || msg.includes('exfil')) {
        type = 'critical';
      } else if (i === 0) {
        type = 'bookmark';
      }
      return { index: i, type };
    });
  }, [history]);

  // Compute live strategic forensic statistics for AI Analyst tab
  const forensicIntel = useMemo(() => {
    return getForensicIntelligence(history, status.currentIndex, simulationState.nodes);
  }, [history, status.currentIndex, simulationState.nodes]);

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
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-[#03050c]/98 backdrop-blur-2xl transition-all duration-500 select-none pb-4 flex flex-col overflow-hidden shadow-[0_-15px_45px_rgba(0,0,0,0.95)]",
        isMinimized ? "h-12" : "h-[285px]"
      )}
    >
      {/* 1. Header / Top Control Bar */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-white/5 bg-void/45">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <Terminal className="w-4 h-4 text-amber-500" />
            <span className="font-heading text-[10px] tracking-[2px] uppercase text-text-primary font-black">
              SENTINELX_RECON_REPLAY: {status.totalEvents > 0 && status.currentIndex < status.totalEvents ? 'TEMPORAL_PLAYBACK_LOCK_ACTIVE' : 'LIVEMODE_INTELLIGENCE_STREAM'}
            </span>
          </div>
 
          {/* Timeline Tracking Indicators */}
          <div className="flex items-center gap-4 px-4 py-1 bg-black/50 rounded border border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-text-secondary font-mono uppercase">SEQ:</span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">{status.currentIndex} / {status.totalEvents}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-text-secondary font-mono">STABILIZER:</span>
              <span className="text-[10px] font-mono text-accent-cyan font-bold">100% SOLID_STATE</span>
            </div>
          </div>
        </div>

        {/* Playback controls row */}
        <div className="flex items-center gap-2">
          
          {/* Pause on Escalation toggle */}
          <div className="flex items-center gap-2 mr-4 bg-void/50 px-2.5 py-1 border border-white/5 rounded-xs">
            <span className="text-[8px] font-mono text-text-secondary tracking-wider font-semibold">AUTO_PAUSE_ON_ESCALATIONS</span>
            <button 
              onClick={() => setPauseOnEscalation(!pauseOnEscalation)}
              className={cn(
                "py-0.5 px-2 text-[8px] font-mono font-black border transition-all rounded-xs",
                pauseOnEscalation 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)] hover:bg-amber-500/20" 
                  : "bg-white/5 text-text-tertiary border-white/5 hover:text-text-secondary"
              )}
            >
              {pauseOnEscalation ? 'ACTIVE' : 'BYPASS'}
            </button>
          </div>

          {/* Core Player Navigation deck */}
          <div className="flex items-center gap-1 bg-void/60 p-1 border border-white/5 rounded-xs shadow-inner">
            <ControlButton 
              icon={Search} 
              onClick={() => ReplayEngine.seek(history.length)} 
              tooltip="Fast-forward to Live State"
              active={status.currentIndex === status.totalEvents && !status.isPlaying}
            />
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <ControlButton icon={SkipBack} onClick={() => ReplayEngine.seek(0)} tooltip="Rewind to Root Boot State" />
            <ControlButton icon={ChevronLeft} onClick={() => ReplayEngine.stepBack()} tooltip="Step Back" />
            
            <ControlButton 
              icon={status.isPlaying ? Pause : Play} 
              onClick={() => status.isPlaying ? ReplayEngine.pause() : ReplayEngine.start()} 
              primary 
              tooltip={status.isPlaying ? "Pause Campaign Flow" : "Reconstruct Playback Loop"}
            />
            
            <ControlButton icon={ChevronRight} onClick={() => ReplayEngine.step()} tooltip="Step Forward" />
            <div className="w-px h-4 bg-white/10 mx-1" />
            
            <select 
              className="bg-transparent text-[8.5px] font-mono uppercase tracking-widest text-text-secondary px-2 outline-none cursor-pointer border-l border-white/5"
              value={status.speed}
              onChange={(e) => ReplayEngine.setSpeed(Number(e.target.value))}
            >
              <option value={1000} className="bg-void text-text-primary">0.5x SECURE</option>
              <option value={500} className="bg-void text-text-primary">1.0x STEP</option>
              <option value={200} className="bg-void text-text-primary">2.5x HIGH</option>
              <option value={50} className="bg-void text-text-primary">BURST</option>
            </select>
          </div>

          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <button 
            onClick={() => { setHistory([]); ReplayEngine.clearHistory(); }}
            className="p-1 px-2 flex items-center gap-1 hover:bg-red-500/10 text-text-secondary hover:text-red-400 rounded-xs border border-transparent hover:border-red-500/20 transition-all font-mono text-[9px]"
            title="Purge Forensic Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            PURGE
          </button>
          
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-white rounded-xs transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Main Expanded Workspace Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="flex-1 flex overflow-hidden bg-void/10"
          >
            {/* LEFT COMPARTMENT: AI Forensic Insights Desk (Flagship Feature!) */}
            <div className="w-[300px] border-r border-white/5 bg-panel/10 p-4 flex flex-col gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-[#ffe6a3] uppercase font-heading">AI_Forensic_Desk</span>
                <span className="ml-auto text-[7px] font-mono text-text-tertiary">DETERMINISTIC</span>
              </div>

              {/* Live Narrative Feed */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5">
                <div className="bg-black/50 p-2.5 rounded-sm border border-white/5 shadow-inner">
                  <div className="flex items-center gap-1.5 mb-1.5 text-text-tertiary">
                    <TrendingUp size={11} className="text-amber-500" />
                    <span className="text-[7.5px] font-mono uppercase tracking-[0.1em] font-semibold">Live Operational Narrative</span>
                  </div>
                  <p className="text-[9.5px] text-text-secondary leading-relaxed font-sans normal-case">
                    {forensicIntel.narrativeSummary}
                  </p>
                </div>

                {/* Cyber Health Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0b0c16]/70 p-2 border border-white/5 rounded-xs">
                    <div className="text-[7px] text-text-tertiary font-mono">BLAST RADIUS</div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-heading font-black text-rose-400 leading-none">{forensicIntel.blastRadius}%</span>
                      <span className="text-[7px] text-text-tertiary">OF NODE GRID</span>
                    </div>
                    {/* Visual Segment Bar */}
                    <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden mt-1.5 border border-white/5">
                      <div className="bg-rose-400 h-full transition-all duration-300" style={{ width: `${forensicIntel.blastRadius}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#0b0c16]/70 p-2 border border-white/5 rounded-xs">
                    <div className="text-[7px] text-text-tertiary font-mono">CAMPAIGN INGRESS</div>
                    <div className="text-[8.5px] font-mono text-indigo-400 font-bold truncate leading-none mt-1.5">{forensicIntel.rootCause}</div>
                  </div>
                </div>

                {/* Vulnerability & Opportunities Surfacing */}
                <div className="bg-black/40 p-2.5 rounded-sm border border-white/5">
                  <div className="flex items-center gap-1 text-[7.5px] font-mono font-bold text-[#b5ffdb] uppercase tracking-wider mb-1.5">
                    <Shield size={11} className="text-[#a1fca1]" />
                    <span>Surfaced Mitigation Path</span>
                  </div>
                  <div className="space-y-1 font-mono text-[7.5px]">
                    <div className="flex justify-between text-text-secondary leading-snug">
                      <span className="text-text-tertiary">WEAKNESS:</span>
                      <span className="text-white text-right max-w-[140px] truncate">{forensicIntel.weaknessIdentified}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary leading-snug">
                      <span className="text-text-tertiary">RECOVERY:</span>
                      <span className="text-accent-cyan font-bold text-right max-w-[140px] truncate">{forensicIntel.mitigationOpportunity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COMPARTMENT: Chronological Deck & Scrubber Controls */}
            <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
              
              {/* SEGMENTED CAMPAIGN PHASE ROADMAP */}
              <div className="grid grid-cols-8 gap-1.5 select-none shrink-0 border-b border-white/5 pb-2.5">
                {REPLAY_PHASES.map((p) => {
                  const isMapped = phaseStarts[p] !== undefined;
                  const isActive = isMapped && mapEventToPhase(history[status.currentIndex - 1] || history[0], status.currentIndex - 1) === p;
                  const colorConfig = PHASE_COLORS[p];

                  return (
                    <button
                      key={p}
                      disabled={!isMapped}
                      onClick={() => isMapped && ReplayEngine.seek(phaseStarts[p]!)}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-1.5 px-1 border transition-all rounded-xs",
                        isMapped 
                          ? isActive 
                            ? `${colorConfig.border} ${colorConfig.bg} text-white shadow-md ${colorConfig.glow} scale-[1.02] ring-1 ring-white/10` 
                            : "border-white/5 bg-void/35 text-text-secondary hover:border-white/20 hover:text-text-primary"
                          : "border-white/5 opacity-20 bg-void/5 cursor-not-allowed text-text-tertiary"
                      )}
                      title={isMapped ? `Seek directly to ${PHASE_LABELS[p]} starting point` : `Operational state [${p}] was not invoked`}
                    >
                      {/* Badge indicator */}
                      <span className="text-xs">{PHASE_ICONS[p]}</span>
                      <span className="text-[7.5px] font-mono tracking-widest uppercase font-bold text-center truncate w-full mt-1">
                        {p.replace('_', ' ')}
                      </span>
                      
                      {/* Active glowing indicator light */}
                      {isActive && (
                        <span className={cn("absolute top-0 right-1 w-1.5 h-1.5 rounded-full animation-pulse bg-white mt-1", 
                          p === 'CONTAINMENT' ? 'bg-emerald-400' : 'bg-amber-400'
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* PROGRESS SCRUBBER BAR TRACK */}
              <div className="relative group shrink-0">
                <div 
                  ref={scrubberRef}
                  onClick={handleScrub}
                  onMouseMove={(e) => e.buttons === 1 && handleScrub(e)}
                  className="relative h-4 bg-void/90 rounded-sm cursor-pointer overflow-hidden border border-white/5 focus-ring transition-all hover:border-amber-500/25"
                >
                  {/* Track Progress Fill */}
                  <div 
                    className="absolute h-full bg-gradient-to-r from-amber-500/5 to-amber-500/20 border-r border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-100"
                    style={{ width: `${history.length > 0 ? (status.currentIndex / history.length) * 100 : 0}%` }}
                  />

                  {/* Marker lines for important events */}
                  {markers.map((m: any) => (
                    <div 
                      key={m.index}
                      className={cn(
                        "absolute top-0 bottom-0 w-[4px] transition-all z-15",
                        m.type === 'bookmark' ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" :
                        m.type === 'attack' ? "bg-rose-500 animate-pulse shadow-[0_0_5px_#f43f5e]" : 
                        m.type === 'critical' ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-accent-cyan shadow-[0_0_8px_#00FFD1]"
                      )}
                      style={{ left: `${(m.index / history.length) * 100}%` }}
                      title={`Reconstruction Index #${m.index + 1} (${m.type.toUpperCase()})`}
                    />
                  ))}
                </div>
                
                {/* Visual Playhead Handle */}
                <div 
                  className="absolute top-[-3px] w-2 h-6 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] border border-white rounded-sm pointer-events-none transition-all duration-100 z-20"
                  style={{ left: `${history.length > 0 ? (status.currentIndex / history.length) * 100 : 0}%`, transform: 'translateX(-50%)' }}
                />
              </div>

              {/* HORIZONTAL SNAPSHOT DECK CHRONICLES */}
              <div className="flex-1 flex gap-3 overflow-x-auto overflow-y-hidden pb-1 shrink min-h-0 scrollbar-thin scrollbar-track-void/10 scrollbar-thumb-white/10 mask-fade-edges">
                {history.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-3 text-text-tertiary">
                    <Info size={16} className="text-white/20 mb-1" />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Awaiting digital twin event stream initialization...</span>
                  </div>
                ) : (
                  history.map((ev, globalIndex) => {
                    const isActive = globalIndex === status.currentIndex - 1;
                    const meta = getForensicMetadata(ev, globalIndex);

                    return (
                      <div 
                        key={`${ev.topic}-${globalIndex}-${ev.payload?.eventId}`}
                        onClick={() => ReplayEngine.seek(globalIndex + 1)}
                        className={cn(
                          "flex-shrink-0 w-56 p-3 rounded-sm border transition-all cursor-pointer group flex flex-col justify-between h-full bg-void/35",
                          isActive 
                            ? "bg-amber-500/10 border-amber-500/100 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30" 
                            : "border-white/5 hover:border-white/15"
                        )}
                      >
                        <div>
                          {/* Segment header badge */}
                          <div className="flex items-center justify-between mb-1.5 gap-1.5">
                            <span className={cn(
                              "text-[7px] font-black uppercase truncate px-1 rounded-xs border leading-relaxed tracking-wider",
                              meta.badgeColor
                            )}>
                              {meta.phase}
                            </span>
                            <span className="text-[6.5px] font-mono opacity-40 shrink-0 font-bold">#{globalIndex + 1}</span>
                          </div>

                          {/* Message prose */}
                          <p className="text-[9.5px] line-clamp-2 leading-[1.3] text-text-secondary group-hover:text-text-primary transition-colors font-mono mb-1 font-semibold uppercase">
                            {meta.icon} {(ev.payload as any).message || ev.topic}
                          </p>
                        </div>

                        {/* Event footer */}
                        <div className="flex items-center justify-between text-[6.5px] font-mono border-t border-white/5 pt-1.5 mt-auto bg-void/50 px-1">
                          <span className="text-text-tertiary">
                            {new Date(ev.payload.timestamp || Date.now()).toLocaleTimeString()}
                          </span>
                          {meta.impactTag && (
                            <span className="text-amber-400 font-extrabold tracking-widest text-[6px]">{meta.impactTag}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
          ? "bg-amber-400 text-void shadow-[0_0_12px_rgba(245,158,11,0.6)] hover:scale-105" 
          : active 
            ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
            : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-4 h-4", primary ? "fill-current" : "")} />
    </button>
  );
}
