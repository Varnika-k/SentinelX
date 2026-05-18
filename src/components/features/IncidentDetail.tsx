import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  Activity, 
  Target, 
  Shield, 
  Zap, 
  Terminal, 
  MessageSquare, 
  User, 
  ChevronRight,
  Download,
  Share2,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { Incident, IncidentStatus } from '../../types/incident';
import { cn } from '../../lib/utils';

interface Props {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: IncidentStatus) => void;
  onAddNote: (id: string, note: string) => void;
}

export function IncidentDetail({ incident, onClose, onUpdateStatus, onAddNote }: Props) {
  const [note, setNote] = useState("");
  const [showTimeline, setShowTimeline] = useState(true);

  if (!incident) return null;

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      onAddNote(incident.id, note);
      setNote("");
    }
  };

  const statusOptions: IncidentStatus[] = ['detected', 'investigating', 'escalated', 'contained', 'resolved'];

  return (
    <div className="flex flex-col h-full bg-void/90 border-l border-border-primary/50 backdrop-blur-xl shadow-[-20px_0_40px_rgba(0,0,0,0.8)] relative">
      {/* Header */}
      <div className="p-6 border-b border-border-primary/50 bg-background-light/5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono text-accent-cyan uppercase tracking-widest">{incident.id}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-[2px] text-[8px] font-mono font-black uppercase border",
                incident.severity === 'critical' ? 'bg-state-danger/20 border-state-danger/40 text-state-danger' :
                incident.severity === 'high' ? 'bg-state-warning/20 border-state-warning/40 text-state-warning' :
                'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
              )}>
                {incident.severity}_Priority
              </span>
            </div>
            <h2 className="text-xl font-heading font-black tracking-tight uppercase leading-tight italic max-w-md">
              {incident.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-background-light/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-void border border-border-primary/20 rounded">
            <div className="flex items-center gap-1.5 mb-1 opacity-50">
              <Clock className="w-3 h-3" />
              <span className="text-[8px] uppercase font-bold">Detection_Time</span>
            </div>
            <div className="text-[10px] font-mono">
              {new Date(incident.detectionTime).toLocaleTimeString()}
            </div>
          </div>
          <div className="p-3 bg-void border border-border-primary/20 rounded">
            <div className="flex items-center gap-1.5 mb-1 opacity-50">
              <Activity className="w-3 h-3" />
              <span className="text-[8px] uppercase font-bold">Total_Events</span>
            </div>
            <div className="text-[10px] font-mono text-accent-cyan">
              {incident.events.length}
            </div>
          </div>
          <div className="p-3 bg-void border border-border-primary/20 rounded">
            <div className="flex items-center gap-1.5 mb-1 opacity-50">
              <Shield className="w-3 h-3" />
              <span className="text-[8px] uppercase font-bold">Blast_Radius</span>
            </div>
            <div className="text-[10px] font-mono text-state-warning">
               {(incident.blastRadius * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-void border border-border-primary/20 rounded">
            <div className="flex items-center gap-1.5 mb-1 opacity-50">
              <Zap className="w-3 h-3" />
              <span className="text-[8px] uppercase font-bold">Risk_Score</span>
            </div>
            <div className="text-[10px] font-mono text-state-danger">
              {incident.riskScore}/100
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Workflow State */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Lifecycle_Operation</h3>
          </div>
          <div className="flex items-center gap-2">
            {statusOptions.map((s, idx) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => onUpdateStatus(incident.id, s)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded text-[9px] font-heading font-bold uppercase transition-all border break-words text-center",
                    incident.status === s 
                      ? "bg-accent-cyan text-void border-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.2)]" 
                      : "bg-void text-text-secondary border-border-primary/20 hover:border-accent-cyan/30"
                  )}
                >
                  {s}
                </button>
                {idx < statusOptions.length - 1 && <ChevronRight className="w-3 h-3 opacity-20" />}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Attack Chain Reconstruction */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-state-danger" />
            <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Compromise_Chain_Replay</h3>
          </div>
          <div className="p-4 bg-void border border-border-primary/20 rounded flex items-center gap-4 overflow-x-auto no-scrollbar">
            {incident.compromiseChain.map((nodeId, i) => (
              <React.Fragment key={i}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div className="w-12 h-12 rounded bg-state-danger/10 border border-state-danger/30 flex items-center justify-center relative">
                    <Target className="w-6 h-6 text-state-danger" />
                    <div className="absolute -top-1 -right-1 bg-void border border-border-primary/20 px-1 rounded text-[7px] font-mono">
                      Step_{i+1}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase">{nodeId}</span>
                </motion.div>
                {i < incident.compromiseChain.length - 1 && <ArrowRight className="w-4 h-4 opacity-20" />}
              </React.Fragment>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-8">
          {/* Timeline */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent-cyan" />
                <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Event_Journal</h3>
              </div>
              <button 
                onClick={() => setShowTimeline(!showTimeline)}
                className="text-[9px] font-mono text-accent-cyan/50 hover:text-accent-cyan"
              >
                {showTimeline ? "COLLAPSE" : "EXPAND"}
              </button>
            </div>
            
            <AnimatePresence>
              {showTimeline && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {incident.events.slice(0, 10).map((event, i) => (
                    <div key={event.id} className="relative pl-4 pb-2 border-l border-border-primary/20 group">
                      <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-border-primary/40 group-hover:bg-accent-cyan transition-colors" />
                      <div className="text-[10px] font-mono text-text-secondary leading-tight">
                        <span className="opacity-40">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{" "}
                        <span className="text-white/80">{event.message}</span>
                      </div>
                    </div>
                  ))}
                  {incident.events.length > 10 && (
                    <button className="text-[9px] font-mono text-accent-cyan/40 w-full py-1 hover:bg-background-light/5">
                      + {incident.events.length - 10} MORE EVENTS
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* AI Assessment & Notes */}
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-state-warning" />
                <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Cognitive_Assessment</h3>
              </div>
              <div className="p-4 bg-state-warning/5 border border-state-warning/20 rounded relative overflow-hidden group/ai">
                <p className="text-[10px] leading-relaxed text-state-warning/80 italic font-mono lowercase">
                  "Anomaly indicates a high-velocity automated attack pattern. Recommended course: Immediate isolation of gateway-1 followed by heuristic reset on server-1."
                </p>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-state-warning/5 to-transparent -translate-x-full group-hover/ai:translate-x-full transition-transform duration-1000" />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-text-secondary" />
                <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Analyst_Notebook</h3>
              </div>
              <div className="space-y-3">
                <div className="max-h-[150px] overflow-y-auto space-y-2 custom-scrollbar">
                  {incident.analystNotes.map((n, i) => (
                    <div key={i} className="p-2 bg-background-light/5 border border-border-primary/10 rounded text-[9px] font-mono">
                      {n}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSubmitNote} className="flex gap-2">
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add investigative evidence..."
                    className="flex-1 bg-void border border-border-primary/30 rounded py-1.5 px-3 text-[10px] font-mono outline-none focus:border-accent-cyan"
                  />
                  <button className="px-3 bg-background-light/10 border border-border-primary/30 rounded hover:bg-background-light/20 transition-colors">
                    <User className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border-primary/50 bg-background-light/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-background-light/10 border border-border-primary/30 rounded hover:border-accent-cyan/50 group transition-all">
            <Download className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            <span className="text-[10px] font-heading font-bold uppercase">Export_MISP</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-background-light/10 border border-border-primary/30 rounded hover:border-accent-cyan/50 group transition-all">
            <CheckCircle2 className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            <span className="text-[10px] font-heading font-bold uppercase">Replay_Audit</span>
          </button>
        </div>
        
        <div className="text-[8px] font-mono text-text-secondary uppercase">
          Assigned_To: SYSTEM_CORE
        </div>
      </div>
    </div>
  );
}
