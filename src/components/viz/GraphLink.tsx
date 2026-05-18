import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { VisualSettings } from './NetworkGraph';

interface GraphLinkProps {
  id: string;
  source: { x: number, y: number, status: string };
  target: { x: number, y: number, status: string };
  showHeatmap: boolean;
  visualSettings?: VisualSettings;
}

export const GraphLink = React.memo(({ id, source, target, showHeatmap, visualSettings = {
  intensity: 1,
  speed: 1,
  glow: 1,
  heatmapOpacity: 0.15,
  pulseFrequency: 1
} }: GraphLinkProps) => {
  const isCompromised = source.status === 'compromised' || target.status === 'compromised';
  const bothCompromised = source.status === 'compromised' && target.status === 'compromised';
  const isIsolated = source.status === 'isolated' || target.status === 'isolated';
  const isActiveRed = isCompromised || showHeatmap;

  return (
    <g>
      <line
        x1={source.x || 0} y1={source.y || 0}
        x2={target.x || 0} y2={target.y || 0}
        className={cn(
          "transition-all duration-500",
          isCompromised ? "stroke-state-danger/40" : isIsolated ? "stroke-state-iso/10" : "stroke-white/10"
        )}
        strokeWidth={bothCompromised ? 2 * visualSettings.intensity : 1}
        strokeDasharray={isActiveRed ? "none" : "4 4"}
      />
      
      {/* Visual Flow Animation */}
      {isActiveRed ? (
        <motion.line
          x1={source.x || 0} y1={source.y || 0}
          x2={target.x || 0} y2={target.y || 0}
          animate={{ 
            strokeOpacity: [0.1, 0.5 * visualSettings.glow, 0.1],
            strokeWidth: [1, 3 * visualSettings.intensity, 1] 
          }}
          transition={{ duration: 1.5 / visualSettings.speed, repeat: Infinity, ease: "easeInOut" }}
          className="stroke-state-danger/30 pointer-events-none"
        />
      ) : !isIsolated && (
        <line
          x1={source.x || 0} y1={source.y || 0}
          x2={target.x || 0} y2={target.y || 0}
          strokeDasharray="4 4"
          className="stroke-white/20"
        >
          <animate 
            attributeName="stroke-dashoffset" 
            from="0" to="-20" 
            dur={`${3 / visualSettings.speed}s`}
            repeatCount="indefinite" 
          />
        </line>
      )}
      
      {/* Secondary Propagation Waves */}
      {isCompromised && (
        <React.Fragment>
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              r={2 * visualSettings.intensity}
              animate={{
                cx: [source.x || 0, target.x || 0],
                cy: [source.y || 0, target.y || 0],
                opacity: [0, 0.8 * visualSettings.glow, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{
                duration: 1.5 / visualSettings.speed,
                repeat: Infinity,
                ease: "linear",
                delay: i * (0.5 / visualSettings.speed)
              }}
              className="fill-state-danger blur-[1px]"
            />
          ))}
        </React.Fragment>
      )}

      {/* Packet flow */}
      {!isIsolated && (
         <motion.circle
           r={1.5 * visualSettings.intensity}
           animate={{
             cx: [source.x || 0, target.x || 0],
             cy: [source.y || 0, target.y || 0],
             opacity: [0, 1, 0]
           }}
           transition={{
             duration: 2 / visualSettings.speed,
             repeat: Infinity,
             ease: "linear",
             delay: Math.atan2(target.y - source.y, target.x - source.x) / (Math.PI * visualSettings.speed)
           }}
           className={cn(isCompromised ? "fill-state-danger" : "fill-accent-cyan")}
         />
      )}
    </g>
  );
}, (prev, next) => {
  return (
    prev.source.x === next.source.x &&
    prev.source.y === next.source.y &&
    prev.target.x === next.target.x &&
    prev.target.y === next.target.y &&
    prev.source.status === next.source.status &&
    prev.target.status === next.target.status &&
    prev.showHeatmap === next.showHeatmap
  );
});
