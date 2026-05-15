import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, Network, Zap, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function LoginTerminal({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialSequence = [
    "INITIALIZING SENTINEL_OS_v4.4.2...",
    "LOADING KERNEL MODULES... OK",
    "ESTABLISHING SECURE TUNNEL... [WSS://SENTINEL.CORE]",
    "BYPASSING PERIMETER FIREWALL... SUCCESS",
    "MOUNTING NEURAL STORAGE... [EXT4_FS]",
    "DECRYPTING THREAT_DATABASE... 100%",
    "SYNCHRONIZING GLOBAL AGENTS... [24/24]",
    "READY FOR COMMAND INPUT."
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < initialSequence.length) {
        setLogs(prev => [...prev, initialSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsDone(true), 1000);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (isDone) {
    return (
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        onAnimationComplete={onComplete}
        className="fixed inset-0 bg-void z-[5000] flex items-center justify-center pointer-events-none"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-void z-[5000] flex items-center justify-center p-6 font-mono selection:bg-neon-cyan/30">
      <div className="w-full max-w-2xl bg-void border border-neon-cyan/20 p-8 shadow-[0_0_50px_rgba(0,255,209,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan/20 animate-pulse" />
        
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-neon-cyan/10 flex items-center justify-center text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,255,209,0.2)]">
            <Shield size={24} className="animate-pulse" />
          </div>
          <div>
             <h1 className="text-lg font-head font-black text-white tracking-[0.5em] mb-1">SENTINEL X</h1>
             <p className="text-[9px] text-[#5A7FA8] tracking-[0.4em] font-black uppercase opacity-60">CLASSIFIED_TERMINAL_v4</p>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="h-64 overflow-y-auto space-y-2 mb-12 custom-scrollbar pr-4 text-[11px]"
        >
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex gap-4"
            >
              <span className="text-[#5A7FA8] opacity-40">[{i.toString().padStart(2, '0')}]</span>
              <span className={cn(
                "font-bold",
                log?.includes('SUCCESS') || log?.includes('OK') ? 'text-neon-green' : 
                log?.includes('INITIALIZING') ? 'text-neon-cyan' : 'text-white'
              )}>
                {log}
              </span>
            </motion.div>
          ))}
          <div className="flex gap-4">
             <span className="text-[#5A7FA8] opacity-40">[{logs.length.toString().padStart(2, '0')}]</span>
             <div className="w-2 h-4 bg-neon-cyan animate-pulse" />
          </div>
        </div>

        <div className="flex justify-between items-end">
           <div className="space-y-1">
             <div className="flex gap-2">
                <div className="w-1 h-1 bg-neon-cyan/20" />
                <div className="w-1 h-1 bg-neon-cyan/40" />
                <div className="w-1 h-1 bg-neon-cyan/60" />
             </div>
             <p className="text-[8px] text-[#5A7FA8] font-bold uppercase tracking-widest opacity-40">
               Authenticated Access Only // Restricted Area
             </p>
           </div>
           
           <div className="grid grid-cols-3 gap-8">
              {[
                { icon: Cpu, label: 'CORE' },
                { icon: Network, label: 'MESH' },
                { icon: Zap, label: 'LINK' }
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1 opacity-20">
                  <item.icon size={12} className="text-neon-cyan" />
                  <span className="text-[8px] font-black text-white">{item.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
