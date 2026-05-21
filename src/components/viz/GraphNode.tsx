import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Shield, Globe, Database, User, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NetworkNode } from '../../types/network';
import { VisualSettings } from './NetworkGraph';

const TYPE_ICONS = {
  gateway: Globe,
  firewall: Shield,
  server: Server,
  database: Database,
  workstation: User,
  'hr-system': ShieldAlert,
};

interface GraphNodeProps {
  node: NetworkNode & { x?: number, y?: number };
  isSelected: boolean;
  isHighlighted: boolean;
  onNodeClick: (node: NetworkNode) => void;
  onMouseEnter: (node: any) => void;
  onMouseLeave: () => void;
  showSegmentation?: boolean;
  visualSettings?: VisualSettings;
  hideLabel?: boolean;
}

export const GraphNode = React.memo(({ 
  node, 
  isSelected, 
  isHighlighted, 
  onNodeClick, 
  onMouseEnter, 
  onMouseLeave,
  showSegmentation = false,
  visualSettings = {
    intensity: 1,
    speed: 1,
    glow: 1,
    heatmapOpacity: 0.15,
    pulseFrequency: 1
  },
  hideLabel = false
}: GraphNodeProps) => {
  const Icon = TYPE_ICONS[node.type as keyof typeof TYPE_ICONS] || Server;
  const isCompromised = node.status === 'compromised';
  const isIsolated = node.status === 'isolated';
  const isQuarantined = node.status === 'quarantined';
  const isDegraded = node.status === 'degraded';

  const attackColors = {
    ransomware: 'stroke-[#FF0055]',
    ddos: 'stroke-[#FFDD00]',
    phishing: 'stroke-[#00D4FF]',
    insider: 'stroke-[#AA33FF]',
    apt: 'stroke-[#FF6600]',
    'zero-day': 'stroke-[#FFFFFF]',
  };

  const attackColor = node.lastAttackType ? attackColors[node.lastAttackType as keyof typeof attackColors] : 'stroke-state-danger';

  // State Styles Mapper
  const getStrokeClass = () => {
    if (isCompromised) return attackColor;
    if (isIsolated) return "stroke-state-iso text-state-iso";
    if (isQuarantined) return "stroke-amber-500 text-amber-500";
    if (isDegraded) return "stroke-rose-400 text-rose-400 stroke-dasharray-[2_2]";
    if (isHighlighted) return "stroke-state-warning shadow-[0_0_15px_rgba(245,158,11,0.5)]";
    return "stroke-border-bright text-accent-cyan";
  };

  // Get segmentation segment definitions
  const isDmz = node.type === 'gateway' || node.type === 'firewall';
  const isDatabaseVault = node.type === 'database' || node.type === 'hr-system';
  const isInternalServer = node.type === 'server' || node.type === 'workstation';

  const getSegmentationColor = () => {
    if (isDmz) return "stroke-accent-blue/35 text-accent-blue";
    if (isDatabaseVault) return "stroke-state-warning/35 text-state-warning";
    return "stroke-emerald-500/35 text-emerald-500";
  };

  const getSegmentationLabel = () => {
    if (isDmz) return "DMZ_SEG_ALPHA";
    if (isDatabaseVault) return "SECURE_DATA_BOUND";
    return "INTERNAL_CORP_LAN";
  };

  return (
    <g 
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      onClick={(e) => {
        e.stopPropagation();
        onNodeClick(node);
      }}
      onMouseEnter={() => onMouseEnter(node)}
      onMouseLeave={onMouseLeave}
      className="node-group cursor-pointer"
    >
      {/* Threat Aura (Background Glow) */}
      {(node.threatScore > 0 || isDegraded || isQuarantined) && (
        <motion.circle
          r={(15 + (node.threatScore / 100) * 20) * visualSettings.intensity}
          animate={{
            opacity: [0.1, 0.3 * ((node.threatScore || 40) / 100) * visualSettings.glow, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: (3 - ((node.threatScore || 40) / 100) * 2) / visualSettings.speed,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "pointer-events-none blur-md",
            node.threatScore > 70 ? "fill-state-danger" : 
            isQuarantined ? "fill-amber-500/20" :
            isDegraded ? "fill-rose-400/20" :
            node.threatScore > 40 ? "fill-state-warning" : "fill-accent-cyan"
          )}
        />
      )}

      {/* Latency and Pressure Overlays */}
      {node.latency && node.latency > 10 && (
        <g transform="translate(0, -22)" className="pointer-events-none">
          <rect x="-16" y="-6" width="32" height="10" rx="1.5" className="fill-void/90 stroke-border/50 stroke-[0.5px]" />
          <text textAnchor="middle" className="fill-rose-400/90 font-mono text-[6.5px] font-bold tracking-tight">
            {node.latency}ms
          </text>
        </g>
      )}

      {/* Degradation Arc (visual pressure indicator around node) */}
      {node.degradation && node.degradation > 0 && (
        <circle
          r={18}
          className="fill-none stroke-rose-400/30 stroke-[1.5px] pointer-events-none"
          strokeDasharray="112"
          strokeDashoffset={112 - (112 * node.degradation) / 100}
        />
      )}

      {/* Operational Segmentation Boundary Halos */}
      {showSegmentation && (
        <circle
          r={21}
          className={cn("fill-none stroke-[1px] stroke-dasharray-[2_2] pointer-events-none", getSegmentationColor())}
        />
      )}

      {/* Isolation / Quarantine Ripple */}
      <AnimatePresence>
        {(isIsolated || isQuarantined) && (
          <motion.circle
            initial={{ r: 12, opacity: 0 }}
            animate={{ r: [12, 28, 12], opacity: [0, 0.4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            className={cn(
              "fill-none stroke-[1px] pointer-events-none",
              isQuarantined ? "stroke-amber-500" : "stroke-accent-cyan"
            )}
          />
        )}
      </AnimatePresence>

      {/* Highlight Glow */}
      <AnimatePresence>
        {isHighlighted && (
          <motion.circle
            initial={{ r: 12, opacity: 0 }}
            animate={{ r: 24, opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fill-state-warning mix-blend-screen pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Label and Segment Markers */}
      {!hideLabel && (
        <g transform={`translate(0, 32)`}>
           <text
             textAnchor="middle"
             className={cn(
               "text-[9px] font-bold tracking-[0.2em] uppercase select-none transition-colors",
               isCompromised ? "fill-state-danger" : isSelected ? "fill-accent-cyan" : "fill-text-secondary"
             )}
           >
             {node.label}
           </text>
           {showSegmentation && (
             <text
               textAnchor="middle"
               y="10"
               className={cn("text-[6px] font-mono font-bold tracking-[0.1em] pointer-events-none select-none", getSegmentationColor())}
             >
               {getSegmentationLabel()}
             </text>
           )}
           {isSelected && (
             <motion.rect
               layoutId="node-underline"
               x="-15"
               y="12"
               width="30"
               height="1.5"
               className="fill-accent-cyan"
             />
           )}
        </g>
      )}

      {/* Node Framing (Precision Corners) */}
      <AnimatePresence>
        {(isSelected || isCompromised) && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <path d="M-16 -16 L-10 -16 M-16 -16 L-16 -10" className="stroke-accent-cyan/50 stroke-[1px] fill-none" />
            <path d="M16 -16 L10 -16 M16 -16 L16 -10" className="stroke-accent-cyan/50 stroke-[1px] fill-none" />
            <path d="M-16 16 L-10 16 M-16 16 L-16 10" className="stroke-accent-cyan/50 stroke-[1px] fill-none" />
            <path d="M16 16 L10 16 M16 16 L16 10" className="stroke-accent-cyan/50 stroke-[1px] fill-none" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Outer Ring */}
      <motion.circle
        r={14}
        animate={{
          strokeOpacity: isCompromised ? [0.3, 0.8, 0.3] : (isSelected || isHighlighted) ? 1 : 0.1
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn(
          "fill-void stroke-[1px] transition-colors duration-500",
          getStrokeClass()
        )}
      />

      {/* Hexagonal Inner Frame (Optional visual touch) */}
      <circle r={11} className="fill-void stroke-white/5 stroke-[1px]" />
      <circle r={9} className="fill-void stroke-white/10 stroke-[1px]" />

      {/* Selection pulses */}
      <AnimatePresence>
        {isSelected && (
          <motion.circle
            initial={{ r: 14, opacity: 1 }}
            animate={{ r: 32, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="fill-none stroke-accent-cyan stroke-[0.5px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Icon Wrapper */}
      <g className={cn(
        "transition-all duration-500",
        isSelected ? "scale-110" : "scale-100"
      )}>
        <foreignObject x="-7" y="-7" width="14" height="14" className="pointer-events-none">
          <div className={cn(
            "w-full h-full flex items-center justify-center transition-colors duration-500",
            isCompromised ? "text-state-danger" : 
            isIsolated ? "text-state-iso" : 
            isQuarantined ? "text-amber-500" :
            isDegraded ? "text-rose-400" :
            isSelected ? "text-accent-cyan" : "text-white/40"
          )}>
            <Icon size={10} strokeWidth={isSelected ? 3 : 2} />
          </div>
        </foreignObject>
      </g>

      {/* Small Data Markers (Clockwise position) */}
      {isSelected && (
        <g className="pointer-events-none">
           <circle cx="14" cy="0" r="1.5" className="fill-accent-cyan animate-pulse-precision" />
           <circle cx="-14" cy="0" r="1.5" className="fill-accent-cyan animate-pulse-precision delay-75" />
        </g>
      )}
    </g>
  );
}, (prev, next) => {
  return (
    prev.node.status === next.node.status &&
    prev.node.threatScore === next.node.threatScore &&
    prev.node.x === next.node.x &&
    prev.node.y === next.node.y &&
    prev.isSelected === next.isSelected &&
    prev.isHighlighted === next.isHighlighted &&
    prev.showSegmentation === next.showSegmentation
  );
});
