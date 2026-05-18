import { Shield, ShieldOff, Activity, Zap, Server, Database, Globe, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { SimulationMetrics } from '../../types/telemetry';

export function MetricsPanel({ metrics, threatLevel }: { metrics: SimulationMetrics, threatLevel: string }) {
  const data = Array.from({ length: 20 }, (_, i) => ({ value: 40 + Math.random() * 20 }));

  const items = [
    { label: 'NODES_SECURE', value: metrics.safe, unit: 'OPERATIONAL', color: 'text-accent-cyan', icon: Shield, id: '01' },
    { id: '02', label: 'THREAT_VECTORS', value: metrics.compromised, unit: 'BREACHED', color: 'text-state-danger', icon: ShieldOff },
    { id: '03', label: 'CONTAINMENT', value: metrics.isolated, unit: 'ISOLATED', color: 'text-state-iso', icon: Activity },
    { id: '04', label: 'RISK_MATRIX', value: threatLevel.toUpperCase(), unit: 'SCORE', color: 'text-white', icon: Zap, highlight: threatLevel !== 'low' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border border-border divide-x divide-border bg-panel/30 rounded-sm">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            "p-3.5 flex flex-col justify-between transition-all relative overflow-hidden group min-h-[84px]",
            item.highlight ? "bg-state-danger/5 border-b-2 border-b-state-danger" : "hover:bg-elevated/20"
          )}
        >
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <div className="flex items-center gap-1.5 opacity-60">
                 <span className="text-[10px] font-mono font-bold text-accent-cyan/80">
                   {item.id}_
                 </span>
                 <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">
                   {item.label}
                 </span>
               </div>
               <div className="flex items-baseline gap-2 mt-2">
                 <span className={cn(
                   "text-[22px] font-mono font-bold tracking-tighter leading-none", 
                   item.highlight ? "text-state-warning" : "text-white"
                 )}>
                   {item.value}
                 </span>
                 <span className="text-[8px] font-bold text-text-tertiary tracking-widest">{item.unit}</span>
               </div>
             </div>
             
             <div className="flex flex-col items-end gap-2">
                <item.icon className={cn("w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity", item.highlight ? "text-state-danger opacity-70" : "text-text-secondary")} />
                <div className="w-16 h-8 opacity-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={item.highlight ? "var(--color-state-danger)" : "var(--color-accent-cyan)"} 
                        strokeWidth={1.5} 
                        dot={false}
                        isAnimationActive={true} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
          
          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity">
            <div className="absolute top-[-50%] right-[-50%] w-full h-full border border-accent-cyan rotate-45" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
