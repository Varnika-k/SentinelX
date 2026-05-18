import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../../types/network';
import { cn } from '../../lib/utils';
import { ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { GraphNode } from './GraphNode';
import { GraphLink } from './GraphLink';
import { CyberGrid } from './CyberGrid';

interface D3Node extends NetworkNode, d3.SimulationNodeDatum {
  x: number;
  y: number;
}
interface D3Link extends Omit<NetworkLink, 'source' | 'target'>, d3.SimulationLinkDatum<D3Node> {
  source: D3Node;
  target: D3Node;
}

export interface VisualSettings {
  intensity: number;
  speed: number;
  glow: number;
  heatmapOpacity: number;
  pulseFrequency: number;
}

export function NetworkGraph({ 
  nodes, 
  links, 
  onNodeClick,
  selectedNodeId,
  highlightedNodeId,
  highlightedPaths,
  showHeatmap = false,
  visualSettings = {
    intensity: 1,
    speed: 1,
    glow: 1,
    heatmapOpacity: 0.15,
    pulseFrequency: 1
  }
}: { 
  nodes: NetworkNode[], 
  links: NetworkLink[],
  onNodeClick: (node: NetworkNode) => void,
  selectedNodeId?: string,
  highlightedNodeId?: string | null,
  highlightedPaths?: string[][],
  showHeatmap?: boolean,
  visualSettings?: VisualSettings
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulationNodes, setSimulationNodes] = useState<D3Node[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<D3Link[]>([]);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);

  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  const handleMouseEnter = useCallback((node: D3Node) => setHoveredNode(node), []);
  const handleMouseLeave = useCallback(() => setHoveredNode(null), []);

  // Initialize simulation data once and maintain it
  useEffect(() => {
    const validNodes = nodes.filter(n => n && n.id);
    const d3Nodes: D3Node[] = validNodes.map(n => ({ ...n }));
    
    const d3Links: D3Link[] = links
      .map(l => {
        if (!l) return null;
        const sourceId = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
        const targetId = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
        
        const sourceNode = d3Nodes.find(n => n.id === sourceId);
        const targetNode = d3Nodes.find(n => n.id === targetId);
        
        if (!sourceNode || !targetNode) return null;
        
        return {
          ...l,
          source: sourceNode,
          target: targetNode
        };
      })
      .filter((l): l is D3Link => l !== null);

    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(d3Links).id(d => d?.id || "").distance(60))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(150, 150))
      .force("collision", d3.forceCollide().radius(25));

    simulation.on("tick", () => {
      setSimulationNodes([...d3Nodes]);
      setSimulationLinks([...d3Links]);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, []); // Run once

  // Sync statuses from props to simulation nodes
  useEffect(() => {
    setSimulationNodes(prevNodes => {
      const anyChanged = nodes.some(n => {
        const sim = prevNodes.find(sn => sn.id === n.id);
        return sim && (sim.status !== n.status || sim.threatScore !== n.threatScore);
      });

      if (!anyChanged) return prevNodes;

      return prevNodes.map(simNode => {
        const updatedNode = nodes.find(n => n && n.id === simNode.id);
        return updatedNode ? { 
          ...simNode, 
          status: updatedNode.status, 
          label: updatedNode.label,
          threatScore: updatedNode.threatScore,
          lastAttackType: updatedNode.lastAttackType
        } : simNode;
      });
    });
  }, [nodes]);

  // Zoom and Drag behavior
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => setTransform(event.transform));

    svg.call(zoomBehavior);

    // Responsive centering
    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2 - 150, height / 2 - 150).scale(1.5));
    };

    updateSize();
    
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Drag on nodes
  useEffect(() => {
    if (!svgRef.current || simulationNodes.length === 0 || !simulationRef.current) return;
    const svg = d3.select(svgRef.current);
    const nodesSelection = svg.selectAll<SVGElement, D3Node>(".node-group")
      .data(simulationNodes.filter(n => n && n.id), (d: any) => d?.id || "");

    const dragBehavior = d3.drag<SVGElement, D3Node>()
      .on("start", (event, d) => {
        if (!d) return;
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => {
        if (!d) return;
        d.fx = event.x; d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!d) return;
        if (!event.active) simulationRef.current?.alphaTarget(0);
      });

    nodesSelection.call(dragBehavior);
  }, [simulationNodes]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-void overflow-hidden">
      <CyberGrid />
      
      {/* Edge Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
      
      <svg 
        ref={svgRef} 
        className="w-full h-full cursor-move relative z-10"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <radialGradient id="heatGradient">
            <stop offset="0%" stopColor="var(--color-state-danger)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="var(--color-state-danger)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-state-danger)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Risk Clusters (Enhanced Heatmap) */}
          <AnimatePresence>
            {showHeatmap && simulationNodes.filter(n => n.status === 'compromised').map(node => (
              <motion.circle
                key={`cluster-${node.id}`}
                initial={{ r: 0, opacity: 0 }}
                animate={{ 
                  r: (40 + (node.threatScore / 100) * 40) * visualSettings.intensity, 
                  opacity: visualSettings.heatmapOpacity 
                }}
                exit={{ r: 0, opacity: 0 }}
                cx={node.x}
                cy={node.y}
                className="fill-state-danger blur-2xl pointer-events-none"
              />
            ))}
          </AnimatePresence>

          {/* Links */}
          {simulationLinks.map(link => (
            <GraphLink 
              key={link.id}
              id={link.id}
              source={link.source}
              target={link.target}
              showHeatmap={showHeatmap}
              visualSettings={visualSettings}
            />
          ))}

          {/* Attack Path Overlays */}
          {highlightedPaths && highlightedPaths.map((path, pathIdx) => (
            <g key={`path-${pathIdx}`} className="pointer-events-none">
              {path.map((nodeId, nodeIdx) => {
                if (nodeIdx === path.length - 1) return null;
                const source = simulationNodes.find(n => n.id === nodeId);
                const target = simulationNodes.find(n => n.id === path[nodeIdx + 1]);
                if (!source || !target) return null;

                return (
                  <motion.line
                    key={`overlay-${nodeId}-${path[nodeIdx + 1]}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: 1, 
                      opacity: 1,
                      stroke: ["#ef4444", "#f59e0b", "#ef4444"]
                    }}
                    transition={{
                      stroke: { duration: 2, repeat: Infinity },
                      opacity: { duration: 0.5 }
                    }}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    strokeWidth={3}
                    className="stroke-state-danger opacity-50 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  />
                );
              })}
            </g>
          ))}

          {/* Nodes */}
          {simulationNodes.map(node => (
            <GraphNode 
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isHighlighted={highlightedNodeId === node.id}
              onNodeClick={onNodeClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              visualSettings={visualSettings}
            />
          ))}
        </g>
      </svg>

      {/* Node Tooltip */}
      <AnimatePresence>
        {hoveredNode && hoveredNode.x !== undefined && hoveredNode.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 pointer-events-none p-4 glass-panel min-w-[200px] shadow-2xl"
            style={{ 
              left: hoveredNode.x * transform.k + transform.x,
              top: hoveredNode.y * transform.k + transform.y - 140, // Offset above node
              transform: 'translateX(-50%)' 
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <div className="flex items-center gap-2">
                   {hoveredNode.status === 'safe' && <ShieldCheck size={12} className="text-state-safe" />}
                   {hoveredNode.status === 'compromised' && <ShieldAlert size={12} className="text-state-danger" />}
                   {hoveredNode.status === 'isolated' && <ShieldOff size={12} className="text-state-iso" />}
                   <span className="text-[12px] font-bold text-white uppercase tracking-tight">{hoveredNode.label}</span>
                </div>
                <span className={cn(
                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase",
                  hoveredNode.status === 'safe' ? "bg-state-safe/20 text-state-safe" : 
                  hoveredNode.status === 'compromised' ? "bg-state-danger/20 text-state-danger" : "bg-state-iso/20 text-state-iso"
                )}>
                  {hoveredNode.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                 <div className="flex flex-col">
                    <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Subsystem</span>
                    <span className="text-[11px] text-text-primary font-semibold uppercase">{hoveredNode.type}</span>
                 </div>
                 <div className="p-2 border border-border-bright/20 rounded-sm flex flex-col justify-center bg-void/50">
                    <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Risk Score</span>
                    <span className={cn(
                      "text-[16px] font-mono font-bold leading-none mt-1",
                      (hoveredNode.threatScore || 0) > 70 ? "text-state-danger" : (hoveredNode.threatScore || 0) > 40 ? "text-state-warning" : "text-state-safe"
                    )}>
                      {(hoveredNode.threatScore || 0).toFixed(0)}
                    </span>
                 </div>
                 <div className="flex flex-col col-span-2">
                    <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">System Identifier</span>
                    <span className="text-[10px] text-text-secondary font-mono overflow-hidden text-ellipsis whitespace-nowrap">{hoveredNode.id}</span>
                 </div>
              </div>
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-panel border-r border-b border-border-bright/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control UI - Zoom indicators */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 z-30">
         <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-text-tertiary tracking-[0.2em] uppercase">Viewport Scale</span>
            <span className="text-[10px] font-mono text-accent-cyan">{(transform.k * 100).toFixed(0)}%</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-text-tertiary tracking-[0.2em] uppercase">Delta Pos</span>
            <span className="text-[10px] font-mono text-text-secondary">{transform.x.toFixed(0)}:{transform.y.toFixed(0)}</span>
         </div>
      </div>
      
      {/* Interaction Hints */}
      <div className="absolute top-24 left-6 flex flex-col gap-4 z-30 opacity-60 hover:opacity-100 transition-opacity">
         <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 bg-accent-cyan group-hover:w-2 transition-all" />
               <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Scroll to Scale</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 bg-accent-cyan" />
               <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Drag to Pan</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 bg-accent-cyan" />
               <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Select to Inspect</span>
            </div>
         </div>
      </div>
    </div>
  );
}
