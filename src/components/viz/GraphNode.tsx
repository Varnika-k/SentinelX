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
  visualSettings?: VisualSettings;
}

export const GraphNode = React.memo(({ 
  node, 
  isSelected, 
  isHighlighted, 
  onNodeClick, 
  onMouseEnter, 
  onMouseLeave,
  visualSettings = {
    intensity: 1,
    speed: 1,
    glow: 1,
    heatmapOpacity: 0.15,
    pulseFrequency: 1
  }
}: GraphNodeProps) => {
  const Icon = TYPE_ICONS[node.type as keyof typeof TYPE_ICONS] || Server;
  const isCompromised = node.status === 'compromised';
  const isIsolated = node.status === 'isolated';

  const attackColors = {
    ransomware: 'stroke-[#FF0055]',
    ddos: 'stroke-[#FFDD00]',
    phishing: 'stroke-[#00D4FF]',
    insider: 'stroke-[#AA33FF]',
    apt: 'stroke-[#FF6600]',
    'zero-day': 'stroke-[#FFFFFF]',
  };

  const attackColor = node.lastAttackType ? attackColors[node.lastAttackType as keyof typeof attackColors] : 'stroke-state-danger';

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
      {node.threatScore > 0 && (
        <motion.circle
          r={(15 + (node.threatScore / 100) * 20) * visualSettings.intensity}
          animate={{
            opacity: [0.1, 0.3 * (node.threatScore / 100) * visualSettings.glow, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: (3 - (node.threatScore / 100) * 2) / visualSettings.speed,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "pointer-events-none blur-md",
            node.threatScore > 70 ? "fill-state-danger" : 
            node.threatScore > 40 ? "fill-state-warning" : "fill-accent-cyan"
          )}
        />
      )}

      {/* Isolation Ripple */}
      <AnimatePresence>
        {isIsolated && (
          <motion.circle
            initial={{ r: 12, opacity: 0 }}
            animate={{ r: [12, 28, 12], opacity: [0, 0.4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            className="fill-none stroke-accent-cyan stroke-[1px] pointer-events-none"
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

      {/* Label */}
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
         {isSelected && (
           <motion.rect
             layoutId="node-underline"
             x="-15"
             y="4"
             width="30"
             height="1.5"
             className="fill-accent-cyan"
           />
         )}
      </g>

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
          isCompromised ? attackColor : 
          isIsolated ? "stroke-state-iso text-state-iso" : 
          isHighlighted ? "stroke-state-warning shadow-[0_0_15px_rgba(245,158,11,0.5)]" :
          "stroke-border-bright text-accent-cyan"
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
            isCompromised ? "text-state-danger" : isIsolated ? "text-state-iso" : isSelected ? "text-accent-cyan" : "text-white/40"
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
    prev.isHighlighted === next.isHighlighted
  );
});
