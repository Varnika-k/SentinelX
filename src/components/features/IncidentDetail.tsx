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
  Briefcase,
  Play,
  RotateCw,
  UserPlus,
  Sliders,
  CheckCircle,
  HelpCircle
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
  const [assignedTeam, setAssignedTeam] = useState("Autonomous Orchestrator");
  const [activePlaybookStep, setActivePlaybookStep] = useState(0);
  const [playbookRunStatus, setPlaybookRunStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  if (!incident) return null;

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      onAddNote(incident.id, note);
      setNote("");
    }
  };

  const statusOptions: IncidentStatus[] = ['detected', 'investigating', 'escalated', 'contained', 'resolved'];

  // Incident response playbooks based on Attack Type
  const isDdos = incident.attackType?.toLowerCase().includes('ddos');
  const isRansom = incident.attackType?.toLowerCase().includes('ransom');

  const playbookSteps = isDdos ? [
    { title: "Edge Isolation", desc: "Isolate target gateway interfaces within SD-WAN.", activeLabel: "Isolating...", state: 'completed' },
    { title: "BGP Rate-Limiting", desc: "Apply scrubbing filter and rate-limit peer vectors.", activeLabel: "Filtering...", state: 'running' },
    { title: "Rotate Edge Tokens", desc: "Revoke and issue replacement proxy secrets.", activeLabel: "Cycling keys...", state: 'pending' },
    { title: "Traffic Restabilization", desc: "Verify ingress health parameters and telemetry feed.", activeLabel: "Restoring...", state: 'pending' }
  ] : isRansom ? [
    { title: "Host Isolation", desc: "Quarantine infected instances from localized LAN.", activeLabel: "Mitigating...", state: 'completed' },
    { title: "Revoke Dev IAM", desc: "Suspend active access keys for compromized services.", activeLabel: "Revoking...", state: 'completed' },
    { title: "Trigger Snapshot Recovery", desc: "Rollback node storage onto secure system backup.", activeLabel: "Restoring Volume...", state: 'running' },
    { title: "Credential Cycle", desc: "Rotate domain accounts and local root password matrices.", activeLabel: "Cycling...", state: 'pending' }
  ] : [
    { title: "Autonomous Blast Control", desc: "Establish micro-segmentation block rules around nodes.", activeLabel: "Segmenting...", state: 'completed' },
    { title: "IAM Lockout", desc: "Temporarily invalidate session headers on adjacent links.", activeLabel: "Locking...", state: 'running' },
    { title: "Telemetry Validation", desc: "Initiate full-spectrum telemetry audit log streaming.", activeLabel: "Validating...", state: 'pending' }
  ];

  const handleTriggerPlaybook = () => {
    if (playbookRunStatus === 'completed') {
      setActivePlaybookStep(0);
    }
    setPlaybookRunStatus('running');
    const interval = setInterval(() => {
      setActivePlaybookStep(prev => {
        if (prev >= playbookSteps.length - 1) {
          clearInterval(interval);
          setPlaybookRunStatus('completed');
          // Automatically transition incident status to contained
          onUpdateStatus(incident.id, 'contained');
          return playbookSteps.length - 1;
        }
        return prev + 1;
      });
    }, 1200);
  };

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
              {incident.attackType && (
                <span className="px-2 py-0.5 rounded-[2px] bg-white/5 border border-white/10 text-[8px] font-mono text-text-secondary uppercase">
                  {incident.attackType}
                </span>
              )}
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
        
        {/* INTERACTIVE PLAYBOOK WORKFLOW */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-primary/20 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-cyan animate-pulse" />
              <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Autonomous_Remediation_Playbook</h3>
            </div>
            <button 
              onClick={handleTriggerPlaybook}
              disabled={playbookRunStatus === 'running'}
              className={cn(
                "px-2.5 py-1 rounded text-[8px] font-mono font-bold tracking-widest flex items-center gap-1.5 border uppercase transition-colors",
                playbookRunStatus === 'running' 
                  ? "bg-state-warning/10 border-state-warning/30 text-state-warning cursor-not-allowed"
                  : playbookRunStatus === 'completed'
                  ? "bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/20"
                  : "bg-void border-border-primary/30 text-white hover:border-accent-cyan/50"
              )}
            >
              <Play size={8} />
              {playbookRunStatus === 'running' ? "Running Automation..." : playbookRunStatus === 'completed' ? "Rerun Playbook" : "Execute Mitigation"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {playbookSteps.map((step, idx) => {
              const isDone = playbookRunStatus === 'completed' || (playbookRunStatus === 'running' && idx < activePlaybookStep);
              const isCurrent = playbookRunStatus === 'running' && idx === activePlaybookStep;
              const isQueued = !playbookRunStatus || playbookRunStatus === 'idle' || (playbookRunStatus === 'running' && idx > activePlaybookStep);

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "p-3 rounded-sm border transition-all text-left relative overflow-hidden flex flex-col justify-between",
                    isDone ? "bg-accent-cyan/5 border-accent-cyan/30" : 
                    isCurrent ? "bg-state-warning/5 border-state-warning/45 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : 
                    "bg-void border-border-primary/10 opacity-75"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[7px] font-mono text-text-tertiary">STEP_0{idx + 1}</span>
                      <h4 className="text-[10px] font-bold text-white uppercase mt-0.5">{step.title}</h4>
                    </div>
                    {isDone ? (
                      <CheckCircle size={10} className="text-accent-cyan" />
                    ) : isCurrent ? (
                      <RotateCw size={10} className="text-state-warning animate-spin" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full border border-border-primary/30" />
                    )}
                  </div>
                  <p className="text-[9px] text-text-secondary mt-1.5 leading-normal">{step.desc}</p>
                  
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-void">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.2, ease: "linear" }}
                        className="h-full bg-state-warning"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Dynamic Assignment & Response Unit Escalation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-[10px] font-heading font-black tracking-widest uppercase font-bold">Escalate_Response_Unit</h3>
            </div>
            <div className="space-y-2">
              <div className="text-[8px] font-mono text-text-tertiary uppercase">Dynamic Tactical Assignee</div>
              <select 
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full bg-void/90 border border-border-primary/30 rounded px-2.5 py-1.5 text-[10px] font-mono text-white outline-none focus:border-accent-cyan select-custom"
              >
                <option value="Autonomous Orchestrator">Autonomous Orchestrator</option>
                <option value="Global Threat Intel Tier-3">Global Threat Intel Tier-3</option>
                <option value="Emergency Host Operations Agency">Emergency Host Operations Agency</option>
                <option value="Tier-4 DevSecOps Architect">Tier-4 DevSecOps Architect</option>
              </select>
              <div className="p-2.5 bg-background-light/5 border border-border-primary/10 rounded text-[9px] text-text-secondary leading-normal">
                Direct escalated control maps real-time updates and notifications back with containment tokens.
              </div>
            </div>
          </section>

          {/* Lifecycle operation */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-[10px] font-heading font-black tracking-widest uppercase">Lifecycle_Operation</h3>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(incident.id, s)}
                  className={cn(
                    "px-1.5 py-2 rounded text-[8.5px] font-heading font-bold uppercase transition-all border text-center whitespace-nowrap",
                    incident.status === s 
                      ? "bg-accent-cyan text-void border-accent-cyan shadow-[0_0_15px_rgba(0,255,209,0.2)]" 
                      : "bg-void text-text-secondary border-border-primary/20 hover:border-accent-cyan/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  "Anomaly indicates a high-velocity automated attack pattern. Recommended course: Immediate isolation of target gateway nodes followed by credentials rotation across related endpoints."
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
          Assigned_To: {assignedTeam.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

