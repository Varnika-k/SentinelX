import { Shield, ShieldOff, Activity, Zap, Server, Database, Globe, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export function MetricsPanel({ metrics, threatLevel }: { metrics: any, threatLevel: string }) {
  const data = Array.from({ length: 20 }, (_, i) => ({ value: Math.random() * 100 }));

  const items = [
    { label: 'NETWORK STATUS', value: metrics.safe, unit: 'NODES_SAFE', color: 'text-accent-cyan', icon: Shield, id: '01' },
    { label: 'THREAT VECTOR', value: metrics.compromised, unit: 'NODES_BREACHED', color: 'text-state-danger', icon: ShieldOff, id: '02' },
    { label: 'DEFENSE LOAD', value: metrics.isolated, unit: 'NODES_ISOLATED', color: 'text-state-iso', icon: Activity, id: '03' },
    { label: 'ANALYSIS ENGINE', value: threatLevel.toUpperCase(), unit: 'THREAT_SCORE', color: 'text-white', icon: Zap, id: '04', highlight: threatLevel !== 'low' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-white/10 h-24 divide-x divide-white/10 bg-void">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            "p-4 flex flex-col justify-between transition-colors relative overflow-hidden group",
            item.highlight ? "bg-state-danger/10 border-r-2 border-r-state-danger" : "hover:bg-surface/20"
          )}
        >
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className={cn("text-[7px] font-heading font-bold tracking-[1px] uppercase", item.highlight ? "text-state-danger" : "text-text-secondary")}>
                 {item.id} // {item.label}
               </span>
               <div className="flex items-baseline gap-2 mt-1">
                 <span className={cn("text-[16px] font-display font-bold", item.highlight ? "text-state-danger animate-pulse" : "text-white")}>
                   {item.value}
                 </span>
                 <span className="text-[7px] font-heading text-text-secondary font-bold tracking-[1px]">{item.unit}</span>
               </div>
             </div>
             
             <div className="flex flex-col items-end gap-2">
               <item.icon className={cn("w-3 h-3", item.highlight ? "text-state-danger" : "text-text-secondary")} />
               <div className="w-16 h-8 opacity-40">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={data}>
                     <Line 
                       type="monotone" 
                       dataKey="value" 
                       stroke={item.highlight ? "#FF2244" : "#00FFD1"} 
                       strokeWidth={1} 
                       dot={false}
                       isAnimationActive={false} 
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </div>
          </div>
          
          {/* Technical UI accents */}
          <div className="absolute top-0 right-0 p-1 opacity-10">
             <div className="grid grid-cols-2 gap-0.5">
               {[1,2,3,4].map(j => <div key={j} className="w-0.5 h-0.5 bg-white" />)}
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
