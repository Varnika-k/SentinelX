import React, { useState, useMemo } from 'react';
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
  activeWorkspace?: string;
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
  hideLabel = false,
  activeWorkspace = 'operations'
}: GraphNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = TYPE_ICONS[node.type as keyof typeof TYPE_ICONS] || Server;
  const isCompromised = node.status === 'compromised';
  const isIsolated = node.status === 'isolated';
  const isQuarantined = node.status === 'quarantined';
  const isDegraded = node.status === 'degraded';

  // Sizing Hierarchy (Objective 5)
  const nodeScale = useMemo(() => {
    if (node.type === 'database' || node.type === 'hr-system') return 1.35; // DB & Sensitive Vaults are prominent
    if (node.type === 'gateway') return 1.30;                             // Border gateways are strategically distinct
    if (node.type === 'firewall') return 1.15;                            // Firewalls are distinct
    if (node.type === 'workstation') return 0.90;                         // Lower tier endpoints are small
    return 1.05;                                                          // Servers are standard
  }, [node.type]);

  const attackColors = {
    ransomware: 'stroke-[#FF0055]',
    ddos: 'stroke-[#FFDD00]',
    phishing: 'stroke-[#00D4FF]',
    insider: 'stroke-[#AA33FF]',
    apt: 'stroke-[#FF6600]',
    'zero-day': 'stroke-[#FFFFFF]',
  };

  const attackColor = node.lastAttackType ? attackColors[node.lastAttackType as keyof typeof attackColors] : 'stroke-state-danger';

  // State Styles Mapper - Restrained, Elite, and Unified
  const getStrokeClass = () => {
    if (isCompromised) return attackColor;
    if (isIsolated) return "stroke-state-iso text-state-iso";
    if (isQuarantined) return "stroke-amber-500 text-amber-500";
    if (isDegraded) return "stroke-rose-400 text-rose-400 stroke-dasharray-[2_2]";
    if (isHighlighted) return "stroke-state-warning";
    return "stroke-border-bright text-accent-cyan";
  };

  // Get segmentation segment definitions
  const isDmz = node.type === 'gateway' || node.type === 'firewall';
  const isDatabaseVault = node.type === 'database' || node.type === 'hr-system';

  const getSegmentationColor = () => {
    if (isDmz) return "stroke-accent-blue/35 text-accent-blue";
    if (isDatabaseVault) return "stroke-state-warning/35 text-state-warning";
    return "stroke-emerald-500/35 text-emerald-500";
  };

  const getSegmentationLabel = () => {
    if (isDmz) return "DMZ_ALPHA";
    if (isDatabaseVault) return "DB_VAULT_SECURE";
    return "LAN_ZONE";
  };

  const radiusOuter = 14 * nodeScale;
  const radiusInner1 = 11 * nodeScale;
  const radiusInner2 = 9 * nodeScale;

  return (
    <g 
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      onClick={(e) => {
        e.stopPropagation();
        onNodeClick(node);
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter(node);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave();
      }}
      className="node-group cursor-pointer"
    >
      {/* Threat Aura (Background Glow) */}
      {(node.threatScore > 0 || isDegraded || isQuarantined) && (
        <motion.circle
          r={(15 + (node.threatScore / 100) * 15) * nodeScale * visualSettings.intensity}
          animate={{
            opacity: [0.04, 0.10 * ((node.threatScore || 40) / 100) * visualSettings.glow, 0.04],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: (5 - ((node.threatScore || 40) / 100) * 2.5) / visualSettings.speed,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "pointer-events-none blur-md",
            node.threatScore > 75 ? "fill-state-danger/70" : 
            isQuarantined ? "fill-amber-500/15" :
            isDegraded ? "fill-rose-400/15" :
            node.threatScore > 40 ? "fill-state-warning/60" : "fill-accent-cyan/15"
          )}
        />
      )}

      {/* Latency and Pressure Overlays */}
      {node.latency && node.latency > 10 && (
        <g transform={`translate(0, -${radiusOuter + 10})`} className="pointer-events-none">
          <rect x="-16" y="-6" width="32" height="10" rx="1" className="fill-void/90 stroke-border/40 stroke-[0.5px]" />
          <text textAnchor="middle" y="1" className="fill-rose-400/90 font-mono text-[6px] font-bold tracking-tight">
            {node.latency}ms
          </text>
        </g>
      )}

      {/* Degradation Arc (visual pressure indicator around node) */}
      {node.degradation && node.degradation > 0 && (
        <circle
          r={radiusOuter + 4}
          className="fill-none stroke-rose-500/20 stroke-[1.5px] pointer-events-none"
          strokeDasharray="150"
          strokeDashoffset={150 - (150 * node.degradation) / 100}
        />
      )}

      {/* Operational Segmentation Boundary Halos */}
      {showSegmentation && (
        <circle
          r={radiusOuter + 6}
          className={cn("fill-none stroke-[1px] stroke-dasharray-[2_2] pointer-events-none", getSegmentationColor())}
        />
      )}

      {/* Isolation / Quarantine Ripple */}
      <AnimatePresence>
        {(isIsolated || isQuarantined) && (
          <motion.circle
            initial={{ r: radiusOuter, opacity: 0 }}
            animate={{ r: [radiusOuter, radiusOuter + 14, radiusOuter], opacity: [0, 0.35, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
            className={cn(
              "fill-none stroke-[1px] pointer-events-none",
              isQuarantined ? "stroke-amber-500" : "stroke-accent-cyan"
            )}
          />
        )}
      </AnimatePresence>

      {/* Highlight Glow */}
      <AnimatePresence>
        {(isHighlighted || isHovered) && (
          <motion.circle
            initial={{ r: radiusOuter, opacity: 0 }}
            animate={{ r: radiusOuter + 8, opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="fill-state-warning mix-blend-screen pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Active Defense / Forensics Tactical Boundaries (Objective 7) */}
      {activeWorkspace === 'defense' && (isIsolated || isQuarantined || isCompromised) && (
        <g>
          <motion.circle
            r={radiusOuter + 8}
            className={cn(
              "fill-none stroke-[1.2px] pointer-events-none stroke-dasharray-[4_3]",
              isCompromised ? "stroke-state-danger/60" : isQuarantined ? "stroke-amber-500/60" : "stroke-state-iso/60"
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <text
            textAnchor="middle"
            y={-radiusOuter - 15}
            stroke="#06090e"
            strokeWidth="2"
            className="font-mono text-[5px] font-black tracking-widest pointer-events-none fill-none"
          >
            {isCompromised ? "THREAT_BLOCK_ZONE" : "SHIELD_CONTAINED"}
          </text>
          <text
            textAnchor="middle"
            y={-radiusOuter - 15}
            className={cn(
              "font-mono text-[5px] font-black tracking-widest pointer-events-none",
              isCompromised ? "fill-rose-400" : isQuarantined ? "fill-amber-400" : "fill-accent-cyan"
            )}
          >
            {isCompromised ? "THREAT_BLOCK_ZONE" : "SHIELD_CONTAINED"}
          </text>
        </g>
      )}

      {activeWorkspace === 'forensics' && (
        <g>
          <text
            textAnchor="middle"
            y={-radiusOuter - 15}
            stroke="#06090e"
            strokeWidth="2"
            className="font-mono text-[5px] font-extrabold fill-none tracking-widest pointer-events-none"
          >
            STATE:TEMPORAL_LOCK
          </text>
          <text
            textAnchor="middle"
            y={-radiusOuter - 15}
            className="font-mono text-[5px] font-extrabold fill-amber-500/70 tracking-widest pointer-events-none"
          >
            STATE:TEMPORAL_LOCK
          </text>
        </g>
      )}

       {/* Label and Segment Markers (Objective 4: Offset, backdrop, collide-safe) */}
      {(!hideLabel || isHovered || isSelected || isCompromised) && (
        <g transform={`translate(0, ${radiusOuter + 14})`} className="pointer-events-none select-none">
           {/* High contrast Cartographic text background outline */}
           <text
             textAnchor="middle"
             stroke="#020408"
             strokeWidth="4"
             strokeLinejoin="round"
             className="text-[8px] font-semibold tracking-[0.15em] font-mono select-none uppercase fill-none"
           >
             {node.label}
           </text>
           <text
             textAnchor="middle"
             className={cn(
               "text-[8px] font-mono font-semibold tracking-[0.15em] uppercase select-none transition-all duration-300",
               isCompromised ? "fill-state-danger" : isSelected ? "fill-accent-cyan" : "fill-text-secondary"
             )}
           >
             {node.label}
           </text>
           {showSegmentation && (
             <text
               textAnchor="middle"
               y="8"
               className={cn("text-[5.5px] font-mono font-bold tracking-[0.08em] pointer-events-none", getSegmentationColor())}
             >
               {getSegmentationLabel()}
             </text>
           )}
           {isSelected && (
             <motion.rect
               layoutId="node-underline"
               x="-12"
               y="11"
               width="24"
               height="1.5"
               className="fill-accent-cyan"
             />
           )}
        </g>
      )}

      {/* Node Framing (Precision Corners/Crosshairs) */}
      <AnimatePresence>
        {(isSelected || isCompromised) && (
          <motion.g
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
          >
            <path d={`M-${radiusOuter + 2} -${radiusOuter + 2} L-${radiusOuter - 3} -${radiusOuter + 2} M-${radiusOuter + 2} -${radiusOuter + 2} L-${radiusOuter + 2} -${radiusOuter - 3}`} className="stroke-accent-cyan/60 stroke-[1px] fill-none" />
            <path d={`M${radiusOuter + 2} -${radiusOuter + 2} L${radiusOuter - 3} -${radiusOuter + 2} M${radiusOuter + 2} -${radiusOuter + 2} L${radiusOuter + 2} -${radiusOuter - 3}`} className="stroke-accent-cyan/60 stroke-[1px] fill-none" />
            <path d={`M-${radiusOuter + 2} ${radiusOuter + 2} L-${radiusOuter - 3} ${radiusOuter + 2} M-${radiusOuter + 2} ${radiusOuter + 2} L-${radiusOuter + 2} ${radiusOuter - 3}`} className="stroke-accent-cyan/60 stroke-[1px] fill-none" />
            <path d={`M${radiusOuter + 2} ${radiusOuter + 2} L${radiusOuter - 3} ${radiusOuter + 2} M${radiusOuter + 2} ${radiusOuter + 2} L${radiusOuter + 2} ${radiusOuter - 3}`} className="stroke-accent-cyan/60 stroke-[1px] fill-none" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Outer Ring */}
      <motion.circle
        r={radiusOuter}
        animate={{
          strokeOpacity: isCompromised ? [0.4, 0.9, 0.4] : (isSelected || isHighlighted || isHovered) ? 1 : 0.25
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          "fill-void stroke-[1.5px] transition-colors duration-500",
          getStrokeClass()
        )}
      />

      {/* Hexagonal Inner Frames */}
      <circle r={radiusInner1} className="fill-void stroke-white/5 stroke-[1px]" />
      <circle r={radiusInner2} className="fill-void stroke-white/10 stroke-[1px]" />

      {/* Selection pulses */}
      <AnimatePresence>
        {isSelected && (
          <motion.circle
            initial={{ r: radiusOuter, opacity: 1 }}
            animate={{ r: radiusOuter + 14, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="fill-none stroke-accent-cyan stroke-[0.5px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Icon Wrapper matching responsive scaling size */}
      <g className={cn(
        "transition-all duration-300",
        (isSelected || isHovered) ? "scale-105" : "scale-100"
      )}>
        <foreignObject x="-6" y="-6" width="12" height="12" className="pointer-events-none select-none">
          <div className={cn(
            "w-full h-full flex items-center justify-center transition-colors duration-500",
            isCompromised ? "text-state-danger" : 
            isIsolated ? "text-state-iso" : 
            isQuarantined ? "text-amber-500" :
            isDegraded ? "text-rose-400" :
            (isSelected || isHovered) ? "text-accent-cyan" : "text-white/35"
          )}>
            <Icon size={9} strokeWidth={(isSelected || isHovered) ? 2.5 : 2} />
          </div>
        </foreignObject>
      </g>

      {/* Micro Status Indicators (Data Trapping Nodes) */}
      {(isSelected || isHovered) && (
        <g className="pointer-events-none">
           <circle cx={radiusOuter} cy="0" r="1.2" className="fill-accent-cyan" />
           <circle cx={-radiusOuter} cy="0" r="1.2" className="fill-accent-cyan" />
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
    prev.showSegmentation === next.showSegmentation &&
    prev.hideLabel === next.hideLabel
  );
});
