import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ThreatBanner({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const configs = {
    low: { 
      label: 'CONDITION: NOMINAL', 
      color: 'text-state-safe', 
      barColor: 'bg-state-safe', 
      sub: 'SYSTEMS_OPERATIONAL',
      intensity: 0.1,
      speed: 3
    },
    medium: { 
      label: 'THREAT DETECTED', 
      color: 'text-state-warning', 
      barColor: 'bg-state-warning', 
      sub: 'ELEVATED_RISK_PERIMETER',
      intensity: 0.2,
      speed: 1.5
    },
    high: { 
      label: 'ACTIVE BREACH', 
      color: 'text-state-danger', 
      barColor: 'bg-state-danger', 
      sub: 'CRITICAL_EXPLOIT_IN_PROGRESS',
      intensity: 0.4,
      speed: 0.8
    },
    critical: { 
      label: 'NETWORK COMPROMISE', 
      color: 'text-state-danger', 
      barColor: 'bg-state-danger', 
      sub: 'TOTAL_ISOLATION_RECOMMENDED',
      intensity: 0.6,
      speed: 0.4
    },
  };

  const config = configs[level];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-void border-b border-border flex flex-col z-[10] overflow-hidden"
      >
        {/* Dynamic Background Warning Overlay */}
        <motion.div 
          animate={{ 
            opacity: level === 'low' ? 0 : [0.05, config.intensity, 0.05],
          }}
          transition={{ 
            duration: config.speed, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn("absolute inset-0 pointer-events-none", config.barColor)}
          style={{ opacity: 0 }}
        />

        {/* Rapid Scanline for Alerts */}
        {level !== 'low' && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <motion.div 
              animate={{ y: ['-100%', '200%'] }}
              transition={{ 
                duration: config.speed * 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className={cn("w-full h-20 opacity-20 blur-xl", config.barColor)}
            />
          </div>
        )}

        <div className="flex h-12 items-center justify-between px-6 md:px-10 relative z-20">
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <div className={cn("hidden sm:block px-2 py-0.5 text-[7px] font-heading font-black tracking-[1px] uppercase border flex-shrink-0", config.color.replace('text-', 'border-'))}>
               SEC_{level.toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className={cn("text-[12px] md:text-[14px] font-display font-black tracking-[2px] uppercase leading-none truncate", config.color)}>
                {config.label}
              </h2>
              <span className="text-[7px] font-heading font-bold opacity-30 tracking-[1px] truncate uppercase">{config.sub}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-10 ml-4 flex-shrink-0">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[7px] font-heading font-black opacity-30 uppercase tracking-[1px] mb-1">Global Load</span>
               <div className="w-24 md:w-32 h-0.5 bg-border overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: level === 'low' ? '12%' : level === 'medium' ? '34%' : level === 'high' ? '72%' : '89%' }}
                   className={cn("h-full", config.barColor)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", config.color)} 
              />
              <span className="text-[8px] font-heading uppercase tracking-[2px] font-black opacity-80 uppercase">Active</span>
            </div>
          </div>
        </div>
        
        {/* Bottom marquee or extra info bar */}
        <div className="h-4 bg-surface/30 flex items-center px-10 overflow-hidden text-[8px] font-bold font-body opacity-20 tracking-[0.5em] uppercase whitespace-nowrap">
           AUTHENTICATING_DEEP_PACKET_INSPECTION_SEQUENCE_..._INITIATING_RECURSIVE_HEURISTIC_SCAN_..._THREADS_STABLE_...
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
