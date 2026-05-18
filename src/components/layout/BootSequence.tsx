import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Terminal, Shield, Lock, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

const BOOT_MESSAGES = [
  "INITIALIZING SENTINEL CORE...",
  "LOADING THREAT MATRICES...",
  "ESTABLISHING SECURE LINK...",
  "SYNCHRONIZING NETWORK TOPOLOGY...",
  "DEFENSE AGENTS ONLINE.",
  "READY."
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < BOOT_MESSAGES.length) {
      const timer = setTimeout(() => setIndex(index + 1), 600);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [index, onComplete]);

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center z-[100] font-display overflow-hidden uppercase select-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center px-10 w-full max-w-4xl"
      >
        <span className="text-accent-cyan text-xs font-black tracking-[0.5em] mb-4">ORCHESTRATION_SYNC_v3.0</span>
        <h1 className="text-7xl md:text-[140px] font-black tracking-tighter leading-[0.8] mb-12 text-white flex flex-col items-center animate-glitch">
          <span>SENTINEL</span>
          <span className="text-accent-cyan text-glow-accent">CORE</span>
        </h1>
        
        <div className="w-full flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-white/10 pb-4">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-text-secondary tracking-widest font-body">LOADING_MODULES</span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-accent-cyan text-xl font-display font-black tracking-tight"
                  >
                    {BOOT_MESSAGES[Math.min(index, BOOT_MESSAGES.length - 1)]}
                  </motion.div>
                </AnimatePresence>
             </div>
             <div className="font-display text-[40px] font-black tracking-tighter opacity-10 text-accent-cyan">
                {Math.round((index / (BOOT_MESSAGES.length - 1)) * 100)}%
             </div>
          </div>
          
          <div className="grid grid-cols-12 h-6 gap-1 w-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "w-full h-full transition-all duration-300",
                  i / 11 <= index / (BOOT_MESSAGES.length - 1) ? "bg-accent-cyan shadow-[0_0_20px_#00FFD1]" : "bg-white/5"
                )}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Decorative corners */}
      <div className="absolute top-12 left-12 w-8 h-8 border-t-4 border-l-4 border-white/10" />
      <div className="absolute top-12 right-12 w-8 h-8 border-t-4 border-r-4 border-white/10" />
      <div className="absolute bottom-12 left-12 w-8 h-8 border-b-4 border-l-4 border-white/10" />
      <div className="absolute bottom-12 right-12 w-8 h-8 border-b-4 border-r-4 border-white/10" />

      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent animate-scanline" />
      </div>

      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,255,209,0.05) 0%, transparent 80%)'
        }}
      />
    </div>
  );
}
