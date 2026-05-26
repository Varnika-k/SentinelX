import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { VisualSettings } from './NetworkGraph';

interface GraphLinkProps {
  id: string;
  source: { x: number, y: number, status: string, latency?: number };
  target: { x: number, y: number, status: string, latency?: number };
  showHeatmap: boolean;
  showCommunicationInstability?: boolean;
  traffic?: number;
  riskWeight?: number;
  visualSettings?: VisualSettings;
  zoomScale?: number;
  type?: 'telemetry' | 'authentication' | 'database' | 'api' | 'cloud' | 'trust' | 'replication';
}

export const GraphLink = React.memo(({ 
  id, 
  source, 
  target, 
  showHeatmap, 
  showCommunicationInstability = false,
  traffic = 0.2,
  riskWeight = 0.1,
  visualSettings = {
    intensity: 1,
    speed: 1,
    glow: 1,
    heatmapOpacity: 0.15,
    pulseFrequency: 1
  },
  zoomScale = 1,
  type
}: GraphLinkProps) => {
  const isCompromised = source.status === 'compromised' || target.status === 'compromised';
  const bothCompromised = source.status === 'compromised' && target.status === 'compromised';
  const isIsolated = source.status === 'isolated' || target.status === 'isolated';
  const isQuarantined = source.status === 'quarantined' || target.status === 'quarantined';
  
  // Instability check: high latency source/target OR high traffic weight
  const isUnstable = showCommunicationInstability && (traffic > 0.65 || (source.latency && source.latency > 50) || (target.latency && target.latency > 50));
  const isActiveRed = isCompromised || showHeatmap;
  const isRerouted = traffic !== undefined && traffic > 0.45 && source.status === 'safe' && target.status === 'safe';

  // Level of detail check: when zooming out closely, simplify graph links for massive viewport rendering acceleration
  const isSimplified = zoomScale < 0.65;

  // Custom line stroke width and style mappings
  const strokeWidth = bothCompromised 
    ? 2.5 * visualSettings.intensity 
    : isUnstable 
    ? 2 * visualSettings.intensity 
    : isRerouted
    ? 1.8 * visualSettings.intensity
    : isIsolated 
    ? 0.5
    : 1;

  const getLineClassName = () => {
    if (isIsolated) return "stroke-state-iso/5";
    if (isCompromised) return "stroke-state-danger/40";
    if (isQuarantined) return "stroke-amber-500/35";
    if (isUnstable) return "stroke-state-warning/50";
    if (isRerouted) return "stroke-accent-cyan/50";
    
    // Connection specific aesthetic branding
    if (type === 'authentication') return "stroke-purple-400/25";
    if (type === 'database') return "stroke-accent-cyan/30";
    if (type === 'api') return "stroke-emerald-400/25";
    if (type === 'cloud') return "stroke-indigo-400/20";
    if (type === 'trust') return "stroke-sky-400/20";
    if (type === 'replication') return "stroke-blue-400/30";
    return "stroke-white/10";
  };

  return (
    <g>
      <line
        x1={source.x || 0} y1={source.y || 0}
        x2={target.x || 0} y2={target.y || 0}
        className={cn("transition-all duration-500", getLineClassName())}
        strokeWidth={strokeWidth}
        strokeDasharray={isIsolated ? "1 8" : isActiveRed ? "none" : isUnstable ? "2 2" : "4 4"}
      />
      
      {/* Dynamic Visual Flow Animation / Pulsing overlay - Avoid rendering when simplified (zoomed out) */}
      {!isSimplified && (
        <>
          {isIsolated ? null : isActiveRed ? (
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
          ) : isQuarantined ? (
            <motion.line
              x1={source.x || 0} y1={source.y || 0}
              x2={target.x || 0} y2={target.y || 0}
              animate={{ 
                strokeOpacity: [0.2, 0.6 * visualSettings.glow, 0.2],
                strokeWidth: [1, 2.5 * visualSettings.intensity, 1] 
              }}
              transition={{ duration: 2 / visualSettings.speed, repeat: Infinity, ease: "easeInOut" }}
              className="stroke-amber-500/25 pointer-events-none"
            />
          ) : isRerouted ? (
            <motion.line
              x1={source.x || 0} y1={source.y || 0}
              x2={target.x || 0} y2={target.y || 0}
              animate={{ 
                strokeOpacity: [0.3, 0.75 * visualSettings.glow, 0.3],
                strokeWidth: [1, 2.5 * visualSettings.intensity, 1] 
              }}
              transition={{ duration: 1 / visualSettings.speed, repeat: Infinity, ease: "easeInOut" }}
              className="stroke-accent-cyan/40 pointer-events-none"
            />
          ) : isUnstable ? (
            <motion.line
              x1={source.x || 0} y1={source.y || 0}
              x2={target.x || 0} y2={target.y || 0}
              animate={{ 
                strokeOpacity: [0.3, 0.8 * visualSettings.glow, 0.3],
                strokeWidth: [1.5, 3.5 * visualSettings.intensity, 1.5] 
              }}
              transition={{ duration: 0.8 / visualSettings.speed, repeat: Infinity, ease: "easeIn" }}
              className="stroke-state-warning/40 pointer-events-none"
            />
          ) : (
            <line
              x1={source.x || 0} y1={source.y || 0}
              x2={target.x || 0} y2={target.y || 0}
              strokeDasharray="4 4"
              className="stroke-white/20"
            >
              <animate 
                attributeName="stroke-dashoffset" 
                from="0" to="-20" 
                dur={`${3 / (visualSettings.speed * (1 + traffic))}s`}
                repeatCount="indefinite" 
              />
            </line>
          )}

          {/* Secondary Propagation Waves */}
          {isCompromised && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  r={1.2 * visualSettings.intensity}
                  animate={{
                    cx: [source.x || 0, target.x || 0],
                    cy: [source.y || 0, target.y || 0],
                    opacity: [0, 0.42 * visualSettings.glow, 0],
                    scale: [0.7, 1.2, 0.7]
                  }}
                  transition={{
                    duration: 1.8 / visualSettings.speed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * (0.6 / visualSettings.speed)
                  }}
                  className="fill-state-danger/70 blur-[0.2px]"
                />
              ))}
            </g>
          )}

          {/* Quarantine alert glow waves */}
          {isQuarantined && (
            <g>
              {[0, 1].map((i) => (
                <motion.circle
                  key={`quar-pulse-${i}`}
                  r={1.2 * visualSettings.intensity}
                  animate={{
                    cx: [source.x || 0, target.x || 0],
                    cy: [source.y || 0, target.y || 0],
                    opacity: [0, 0.35 * visualSettings.glow, 0],
                    scale: [0.8, 1.3, 0.8]
                  }}
                  transition={{
                    duration: 2.4 / visualSettings.speed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * (1.2 / visualSettings.speed)
                  }}
                  className="fill-amber-500/70 blur-[0.2px]"
                />
              ))}
            </g>
          )}

          {/* Illuminated rerouted data waves */}
          {isRerouted && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`reroute-wave-${i}`}
                  r={1.2 * visualSettings.intensity}
                  animate={{
                    cx: [source.x || 0, target.x || 0],
                    cy: [source.y || 0, target.y || 0],
                    opacity: [0, 0.45 * visualSettings.glow, 0],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 1.5 / visualSettings.speed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * (0.5 / visualSettings.speed)
                  }}
                  className="fill-accent-cyan/70 blur-[0.2px]"
                />
              ))}
            </g>
          )}

          {/* Latency Jitter packets */}
          {isUnstable && (
            <g>
              {[0, 1].map((i) => (
                <motion.circle
                  key={`jitter-${i}`}
                  r={1.8 * visualSettings.intensity}
                  animate={{
                    cx: [source.x || 0, target.x || 0],
                    cy: [source.y || 0, target.y || 0],
                    opacity: [0, 0.52 * visualSettings.glow, 0]
                  }}
                  transition={{
                    duration: 1.4 / visualSettings.speed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.7
                  }}
                  className="fill-state-warning/70 blur-[0.2px]"
                />
              ))}
            </g>
          )}

          {/* Packet flow */}
          {!isIsolated && !isUnstable && (
             <motion.circle
               r={1.0 * visualSettings.intensity}
               animate={{
                 cx: [source.x || 0, target.x || 0],
                 cy: [source.y || 0, target.y || 0],
                 opacity: [0, 0.8, 0]
               }}
               transition={{
                 duration: 2.5 / (visualSettings.speed * (1 + traffic)),
                 repeat: Infinity,
                 ease: "linear",
                 delay: Math.atan2(target.y - source.y, target.x - source.x) / (Math.PI * visualSettings.speed)
               }}
               className={cn(isCompromised ? "fill-state-danger/70" : "fill-accent-cyan/80")}
             />
          )}
        </>
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
    prev.source.latency === next.source.latency &&
    prev.target.latency === next.target.latency &&
    prev.showHeatmap === next.showHeatmap &&
    prev.showCommunicationInstability === next.showCommunicationInstability &&
    prev.traffic === next.traffic &&
    prev.riskWeight === next.riskWeight &&
    prev.zoomScale === next.zoomScale
  );
});
