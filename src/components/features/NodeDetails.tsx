import { motion, AnimatePresence } from 'motion/react';
import { NetworkNode, NetworkLink } from '../../types/network';
import { TelemetryEvent } from '../../types/telemetry';
import { cn } from '../../lib/utils';
import { X, ShieldAlert, Activity, Target, Zap, Cpu, Shield, ChevronDown, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { aiEngine } from '../../lib/ai-engine';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export function NodeDetails({ 
  node, 
  nodes,
  events,
  links,
  onIsolate,
  onClose,
  onViewAI,
  isPanel = false
}: { 
  node: NetworkNode | null, 
  nodes: NetworkNode[],
  events: TelemetryEvent[],
  links: NetworkLink[],
  onIsolate: (id: string) => void,
  onClose: () => void,
  onViewAI?: () => void,
  isPanel?: boolean
}) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      setLoading(true);
      setAnalysis(null);
      
      const neighborIds = links
        .filter(l => l.source === node.id || l.target === node.id)
        .map(l => l.source === node.id ? l.target : l.source);

      const relevantIds = [node.id, ...neighborIds];

      const nodeEvents = events
        .filter(e => e.nodeId && relevantIds?.includes(e.nodeId))
        .slice(0, 5) // Fetch a few more to filter/format
        .map(e => `[${e.nodeId === node.id ? 'SELF' : 'NEIGHBOR'}][${e.timestamp.toLocaleTimeString()}] ${e.message}`)
        .slice(0, 3) // Keep only 3
        .join('\n');

      const connections = neighborIds
        .map(id => {
          const n = nodes.find(n => n.id === id);
          return n ? `${n.label} (${n.type}, status: ${n.status})` : null;
        })
        .filter(Boolean)
        .join(', ');

      const fullContext = `Recent Activity:\n${nodeEvents}\n\nDirect Connections: ${connections}`;

      aiEngine.analyze({
        type: 'threat',
        context: {
          targetNode: node,
          nodes: nodes,
          links: links,
          recentActivity: events.slice(0, 5)
        }
      }).then(res => {
        setAnalysis(res.summary);
        setLoading(false);
      }).catch(() => {
        setAnalysis("Unable to retrieve cognitive intelligence.");
        setLoading(false);
      });
    }
  }, [node, nodes, links, events]);

  const [showParams, setShowParams] = useState(false);

  if (!node) return null;

  const data = [
    { subject: 'VULN', A: node.vulnerability * 100, fullMark: 100 },
    { subject: 'CRIT', A: node.criticality * 100, fullMark: 100 },
    { subject: 'THRT', A: node.threatScore, fullMark: 100 },
    { subject: 'RESP', A: 80, fullMark: 100 },
    { subject: 'TRFC', A: 40, fullMark: 100 },
  ];

  const neighbors = links
    .filter(l => l.source === node.id || l.target === node.id)
    .map(l => {
      const neighborId = l.source === node.id ? l.target : l.source;
      return nodes.find(n => n.id === neighborId);
    })
    .filter(Boolean) as NetworkNode[];

  const containerClasses = isPanel 
    ? "flex flex-col h-full bg-void overflow-hidden"
    : "fixed right-6 top-24 bottom-6 w-96 bg-void/95 border border-white/10 rounded-sm backdrop-blur-xl shadow-2xl z-50 flex flex-col overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-sm flex items-center justify-center border",
            node.status === 'safe' ? "bg-state-safe/10 border-state-safe/30 text-state-safe" : 
            node.status === 'compromised' ? "bg-state-danger/10 border-state-danger/30 text-state-danger" : "bg-state-iso/10 border-state-iso/30 text-state-iso"
          )}>
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-white font-display font-black uppercase text-[14px] tracking-[2px] leading-none">{node.label}</h2>
            <span className="text-[11px] font-heading text-text-secondary uppercase tracking-[1px] mt-1.5 block">NODE_UID: {node.id}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 rounded-sm bg-surface border border-border group overflow-hidden relative">
          <div className="flex flex-col relative z-10">
            <span className="text-[9px] font-heading text-text-secondary uppercase mb-1 tracking-[1px]">Operational State</span>
            <div className="flex items-center gap-2">
               <span className={cn(
                 "text-[12px] font-display font-bold tracking-[2px]",
                 node.status === 'safe' ? "text-state-safe" : 
                 node.status === 'compromised' ? "text-state-danger" : "text-state-iso"
               )}>
                 {node.status.toUpperCase()}
               </span>
               <div className={cn(
                 "w-1 h-1 rounded-full animate-ping",
                 node.status === 'safe' ? "bg-state-safe" : "bg-state-danger"
               )} />
            </div>
          </div>
          <Activity size={18} className="text-white/20 relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>

        {/* Radar Chart & Mini Topology Section */}
        <div className="grid grid-cols-1 gap-8">
           <div className="space-y-3">
              <span className="text-[10px] text-text-secondary font-heading font-black tracking-[2px] uppercase">Telemetry Signature</span>
              <div className="h-40 w-full bg-surface/30 rounded-sm border border-border/50">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#1A3050" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#5A7FA8', fontSize: 9, fontWeight: '700' }} />
                    <Radar
                      name="Metrics"
                      dataKey="A"
                      stroke="#00FFD1"
                      fill="#00FFD1"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary font-heading font-black tracking-[2px] uppercase">Connectivity Map</span>
                <span className="text-[9px] text-accent-cyan font-black tracking-[1px] uppercase">{neighbors.length} SYNC_CHANNELS</span>
              </div>
              <div className="bg-surface/30 rounded-sm border border-border/50 p-10 min-h-[220px] relative overflow-hidden group">
                 {/* Radial Gridlines */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <div className="w-24 h-24 border border-accent-cyan rounded-full" />
                    <div className="absolute w-40 h-40 border border-accent-cyan rounded-full" />
                 </div>

                 {/* Center Node (Self) */}
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className={cn(
                      "w-14 h-14 rounded-sm border-2 flex items-center justify-center bg-void shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all relative",
                      node.status === 'safe' ? "border-state-safe" : "border-state-danger"
                    )}>
                       <Cpu size={28} className={node.status === 'safe' ? "text-state-safe" : "text-state-danger"} />
                       <div className={cn(
                         "absolute -inset-1 opacity-20 blur-sm rounded-sm animate-pulse",
                         node.status === 'safe' ? "bg-state-safe" : "bg-state-danger"
                       )} />
                    </div>
                 </div>

                 {/* Peripheral Neighbors */}
                 <div className="relative w-full h-40">
                    {neighbors.map((neighbor, index) => {
                      const angle = (index / neighbors.length) * 2 * Math.PI;
                      const radius = 45;
                      const x = 50 + radius * Math.cos(angle);
                      const y = 50 + radius * Math.sin(angle);
                      
                      return (
                        <div 
                          key={neighbor.id} 
                          className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10 group/node"
                          style={{ left: `${x}%`, top: `${y}%` }}
                        >
                           <div className={cn(
                             "w-full h-full rounded-full border-2 flex items-center justify-center bg-void shadow-lg relative transition-all duration-300",
                             neighbor.status === 'safe' ? "border-accent-blue/30 text-accent-blue" : "border-state-danger text-state-danger shadow-[0_0_10px_rgba(255,17,68,0.3)]"
                           )}>
                              <Target size={14} className={neighbor.status === 'compromised' ? "animate-pulse" : ""} />
                              {neighbor.status === 'compromised' && (
                                <div className="absolute -inset-1 bg-state-danger/20 blur-sm rounded-full animate-ping" />
                              )}
                           </div>
                           <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-0.5 bg-black/80 border border-border text-[9px] font-black text-white/60 tracking-[1.5px] whitespace-nowrap opacity-0 group-hover/node:opacity-100 transition-opacity">
                              {neighbor.label}
                           </div>
                        </div>
                      );
                    })}

                    {/* Connecting Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                       {neighbors.map((neighbor, index) => {
                         const angle = (index / neighbors.length) * 2 * Math.PI;
                         const radius = 45;
                         const tx = 50 + radius * Math.cos(angle);
                         const ty = 50 + radius * Math.sin(angle);
                         return (
                           <motion.line 
                            key={neighbor.id}
                            x1="50%" y1="50%" 
                            x2={`${tx}%`} y2={`${ty}%`} 
                            stroke={neighbor.status === 'compromised' ? "#FF1144" : "#5A7FA8"} 
                            strokeWidth="1.5" 
                            strokeDasharray={neighbor.status === 'compromised' ? "0" : "4 4"}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            className={neighbor.status === 'compromised' ? "opacity-60" : "opacity-20"}
                           />
                         );
                       })}
                    </svg>
                 </div>

                 {neighbors.length === 0 && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 grayscale opacity-30">
                     <div className="w-12 h-12 rounded-full border border-dashed border-text-secondary flex items-center justify-center">
                        <Activity size={18} />
                     </div>
                     <span className="text-[10px] text-text-secondary font-black tracking-[4px] uppercase italic">NO_PEER_LINKS</span>
                   </div>
                 )}
                 
                 <div className="absolute inset-0 pointer-events-none border border-accent-cyan/0 group-hover:border-accent-cyan/10 transition-colors" />
              </div>
           </div>

           {/* Granular Parameters (Collapsible) */}
           <div className="space-y-3">
              <button 
                onClick={() => setShowParams(!showParams)}
                className="w-full flex items-center justify-between group"
              >
                <span className="text-[10px] text-text-secondary font-heading font-black tracking-[2px] uppercase">System Parameters</span>
                <ChevronDown size={14} className={cn("text-text-secondary transition-transform duration-300", showParams && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {showParams && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 p-1">
                      {[
                        { label: 'CRITICALITY', value: `${(node.criticality * 100).toFixed(0)}%`, color: 'text-accent-blue' },
                        { label: 'EXPOSURE', value: `${(node.vulnerability * 100).toFixed(0)}%`, color: 'text-state-warning' },
                        { label: 'THREAT_LVL', value: node.threatScore.toFixed(0), color: 'text-state-danger' },
                        { label: 'DEGRADATION', value: `${node.degradation || 0}%`, color: (node.degradation && node.degradation > 40) ? 'text-state-danger' : 'text-slate-400' },
                        { label: 'NET_LATENCY', value: `${node.latency || 12}ms`, color: (node.latency && node.latency > 100) ? 'text-state-warning' : 'text-accent-cyan' },
                        { label: 'MONITORING', value: `${node.monitoringLevel || 10}%`, color: 'text-emerald-400' },
                        { label: 'KEYS_ROTATED', value: node.credentialsRotated ? 'SUCCESS' : 'PENDING', color: node.credentialsRotated ? 'text-emerald-400' : 'text-slate-500' },
                        { label: 'LAST_SYN', value: node.lastActivity ? (typeof node.lastActivity === 'string' ? node.lastActivity : (node.lastActivity as Date).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })) : 'N/A', color: 'text-white/60' },
                      ].map((param, i) => (
                        <div key={i} className="p-3 bg-surface/50 border border-border/50 rounded-sm">
                           <span className="text-[9px] text-text-secondary font-heading font-black tracking-[1px] uppercase block mb-1">{param.label}</span>
                           <span className={cn("text-[13px] font-display font-black", param.color)}>{param.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Neighborhood List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary font-heading font-black tracking-[2px] uppercase">Node Neighborhood</span>
            <span className="text-[8px] font-mono text-white/30 uppercase">DIRECT_PEER_SYNC</span>
          </div>
          <div className="space-y-2">
            {neighbors.length > 0 ? (
              neighbors.map(n => (
                <div 
                  key={n.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-sm border transition-all duration-300",
                    n.status === 'safe' ? "bg-surface border-border hover:border-state-safe/30" : 
                    n.status === 'compromised' ? "bg-state-danger/5 border-state-danger/30 hover:bg-state-danger/10" : 
                    "bg-state-iso/5 border-state-iso/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border",
                      n.status === 'safe' ? "border-state-safe/30 text-state-safe bg-state-safe/10" : 
                      n.status === 'compromised' ? "border-state-danger/30 text-state-danger bg-state-danger/10" : 
                      "border-state-iso/30 text-state-iso bg-state-iso/10"
                    )}>
                      {n.status === 'safe' ? <ShieldCheck size={12} /> : 
                       n.status === 'compromised' ? <ShieldAlert size={12} /> : <Shield size={12} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-display font-black text-white/80 uppercase tracking-wider">{n.label}</span>
                      <span className="text-[8px] font-heading text-text-secondary uppercase">{n.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      n.status === 'safe' ? "bg-state-safe" : "bg-state-danger animate-pulse"
                    )} />
                    <span className={cn(
                      "text-[9px] font-bold tracking-[1px] uppercase",
                      n.status === 'safe' ? "text-state-safe" : 
                      n.status === 'compromised' ? "text-state-danger" : "text-state-iso"
                    )}>
                      {n.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 border border-dashed border-border flex flex-col items-center justify-center gap-2 opacity-30">
                <Activity size={18} />
                <span className="text-[10px] font-heading font-black tracking-[2px] uppercase italic">Air-Gapped Instance</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Intelligence Summary */}
        <div className="space-y-3">
          <div className={cn(
            "flex items-center gap-2 text-accent-cyan relative group",
            loading && "animate-pulse"
          )}>
            <Zap size={14} fill="currentColor" className={cn("relative z-10 transition-shadow duration-500", loading && "drop-shadow-[0_0_8px_#00FFD1]")} />
            <span className="text-[12px] font-display font-black uppercase tracking-[2px] relative z-10">Sentinel Analysis</span>
          </div>
          <div className="p-4 rounded-sm bg-panel border-l-2 border-accent-cyan relative overflow-hidden group">
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 w-full bg-accent-cyan/10 animate-pulse rounded" />
                <div className="h-3 w-5/6 bg-accent-cyan/10 animate-pulse rounded" />
              </div>
            ) : (
              <p className="text-[12px] text-white/80 leading-[1.6] font-mono lowercase">
                {analysis || "Awaiting intelligence feed..."}
              </p>
            )}
            <button 
              onClick={onViewAI}
              className="mt-3 text-[9px] text-accent-cyan/60 hover:text-accent-cyan transition-colors flex items-center gap-1 uppercase font-bold"
            >
              View Full Tactical Report <ChevronDown size={10} className="-rotate-90" />
            </button>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-accent-cyan/5 to-transparent h-[1px] w-full animate-scanline" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-4 border-t border-border">
          <button
            onClick={() => onIsolate(node.id)}
            disabled={node.status === 'isolated'}
            className={cn(
              "w-full flex items-center justify-center gap-3 p-5 rounded-sm font-display font-black uppercase tracking-[3px] text-[12px] transition-all relative overflow-hidden group",
              node.status === 'isolated' 
                ? "bg-void border border-border text-text-secondary/20 cursor-not-allowed"
                : "bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20"
            )}
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <Shield size={18} />
            {node.status === 'isolated' ? 'NODE_ISOLATED' : 'INITIATE_ISOLATION'}
            {node.status !== 'isolated' && (
               <div className="absolute inset-y-0 left-0 w-1.5 bg-accent-cyan animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
