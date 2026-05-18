import { motion } from 'motion/react';
import { X, Shield, Zap, Target, Brain, Activity, HelpCircle, ChevronRight, ZapOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BattleManual({ onClose }: { onClose: () => void }) {
  const sections = [
    {
      title: 'THE NETWORK GRID',
      icon: Activity,
      content: 'Sentinel X monitors 18 critical nodes across 6 security zones. Perimeter handles entry, Core manages routing, and Data houses the highest priority assets. Compromise is signaled by a Red Pulse; Isolation is Blue.'
    },
    {
      title: 'ATTACK VECTORS',
      icon: Zap,
      content: 'Attackers use 6 types of autonomous vectors. Ransomware encrypts nodes recursively. DDoS exhausts capacity. Phishing targets endpoints. Zero-Days exploit core vulnerabilities. Your goal is to detect these patterns early.'
    },
    {
      title: 'DEFENSE MODULES',
      icon: Shield,
      content: 'Activate modules in the command panel. Active Firewalls reduce breach probability. Neural Isolation automatically severs edges when high threat is detected. Heuristic Scanning increases detection speed.'
    },
    {
       title: 'MANUAL TRIAGE',
       icon: Target,
       content: 'Click any node to perform a Deep Scan. If a node is compromised, use the INITIATE ISOLATION command to prevent spread. Isolated nodes are safe but offline until restored.'
    },
    {
      title: 'AI INTELLIGENCE',
      icon: Brain,
      content: 'The system uses Gemini-powered intelligence to summarize incidents in the terminal. Monitor the Intel Feed for real-time natural language updates on breach status and attacker movement.'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-void/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-surface border border-border flex flex-col max-h-[80vh] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-border bg-panel flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HelpCircle className="w-6 h-6 text-accent-cyan" />
            <div>
              <h2 className="font-display text-[14px] tracking-[4px] text-white uppercase">COMMAND_OPERATIONS_MANUAL</h2>
              <p className="text-[10px] font-heading text-text-secondary tracking-[2px] mt-1">v4.0.1 // BATTLESPACE_ORIENTATION</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 text-text-secondary hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {sections.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-accent-cyan" />
                    <h3 className="font-display text-[12px] tracking-[2px] text-white uppercase">{section.title}</h3>
                  </div>
                  <p className="text-[11px] font-body text-text-secondary leading-[1.8] uppercase tracking-wide">
                    {section.content}
                  </p>
                </div>
              ))}
           </div>

           <div className="p-8 bg-void border border-accent-blue/20 flex items-start gap-6">
              <ZapOff className="w-8 h-8 text-accent-blue shrink-0" />
              <div className="space-y-2">
                 <h4 className="font-display text-[10px] tracking-[2px] text-accent-blue uppercase">CRITICAL_ADVISORY</h4>
                 <p className="text-[10px] font-heading text-text-secondary uppercase leading-[1.6]">
                   Sentinel X is a live simulation. Defensive actions have resource costs. Over-isolating nodes can lead to infrastructure blackout. Balance security with operational uptime.
                 </p>
              </div>
           </div>
        </div>

        <div className="p-8 bg-panel border-t border-border text-center">
            <button 
              onClick={onClose}
              className="px-10 py-3 bg-accent-cyan text-void font-display font-bold text-[10px] tracking-[3px] uppercase hover:shadow-[0_0_20px_rgba(0,255,209,0.3)] transition-all"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              ACKNOWLEDGED // RETURN_TO_UNIT
            </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
