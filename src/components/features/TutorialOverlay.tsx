import { motion, AnimatePresence } from 'motion/react';
import { X, Info, MousePointer2, Shield, Bug, Zap } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
}

export function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  const steps = [
    {
      title: "NODE_MONITORING",
      desc: "Each orb represents a core server in the hyper-threaded network. Hover to inspect status, click for deep scan.",
      icon: MousePointer2,
      color: "text-neon-cyan"
    },
    {
      title: "THREAT_VECTORS",
      desc: "Launch simulated attacks from the command unit to test network resilience and sentinel response.",
      icon: Bug,
      color: "text-neon-red"
    },
    {
      title: "ACTIVE_DEFENSE",
      desc: "Activate network isolation or manually block compromised nodes to mitigate large-scale breaches.",
      icon: Shield,
      color: "text-neon-green"
    },
    {
      title: "SENTINEL_AI",
      desc: "Our neural engine provides real-time analysis of potential vulnerabilities and incident reporting.",
      icon: Zap,
      color: "text-neon-amber"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-void/90 backdrop-blur-md z-[200] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-4xl relative">
        {/* Decorative background scanlines */}
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
        
        <div className="bg-panel border border-neon-cyan/20 p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan/30" />
          
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-head font-black text-white tracking-tighter">SENTINEL_ONBOARDING</h2>
              <p className="text-neon-cyan font-mono text-[10px] tracking-[0.5em] mt-2 font-bold">OPERATIONAL_GUIDANCE_v4.4</p>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-neon-red/20 hover:border-neon-red/50 transition-all group"
            >
              <X size={24} className="text-white/40 group-hover:text-neon-red transition-colors" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <motion.div 
                key={step.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                className="flex gap-6 p-6 bg-void/50 border border-white/5 hover:border-neon-cyan/30 transition-all"
              >
                <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white/5 ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-head font-black text-white mb-2 tracking-widest">{step.title}</h3>
                  <p className="text-[11px] text-[#5A7FA8] font-mono leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-between pt-8 border-t border-[#1A3050]">
            <div className="flex items-center gap-4 text-[9px] font-mono text-white/20">
              <Info size={14} />
              <span>CLICK_EITHER_OUTSIDE_OR_THE_CLOSE_ICON_TO_PROCEED</span>
            </div>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-neon-cyan text-void font-head font-black tracking-widest text-xs hover:scale-105 transition-transform"
            >
              ACKNOWLEDGE_DIRECTIVE
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
