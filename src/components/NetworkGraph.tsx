import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../types/simulation';
import { cn } from '../lib/utils';
import { Server, Shield, Globe, Database, User, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';

const TYPE_ICONS = {
  gateway: Globe,
  firewall: Shield,
  server: Server,
  database: Database,
  workstation: User,
  'hr-system': ShieldAlert,
};

const STATUS_COLORS = {
  safe: 'stroke-state-safe text-state-safe fill-state-safe/10',
  compromised: 'stroke-state-danger text-state-danger fill-state-danger/20',
  isolated: 'stroke-state-iso text-state-iso fill-state-iso/20',
};

interface D3Node extends NetworkNode, d3.SimulationNodeDatum {
  x: number;
  y: number;
}
interface D3Link extends Omit<NetworkLink, 'source' | 'target'>, d3.SimulationLinkDatum<D3Node> {
  source: D3Node;
  target: D3Node;
}

export function NetworkGraph({ 
  nodes, 
  links, 
  onNodeClick,
  selectedNodeId,
  highlightedNodeId,
  showHeatmap = false
}: { 
  nodes: NetworkNode[], 
  links: NetworkLink[],
  onNodeClick: (node: NetworkNode) => void,
  selectedNodeId?: string,
  highlightedNodeId?: string | null,
  showHeatmap?: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulationNodes, setSimulationNodes] = useState<D3Node[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<D3Link[]>([]);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);

  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  // Initialize simulation data once and maintain it
  useEffect(() => {
    // We create a copy to avoid mutating props directly
    // Ensure nodes exist and have IDs
    const validNodes = nodes.filter(n => n && n.id);
    const d3Nodes: D3Node[] = validNodes.map(n => ({ ...n }));
    
    // Ensure links exist and point to valid nodes
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
      .force("center", d3.forceCenter(150, 150)) // Arbitrary center, zoom will handle view
      .force("collision", d3.forceCollide().radius(25));

    simulation.on("tick", () => {
      setSimulationNodes([...d3Nodes]);
      setSimulationLinks([...d3Links]);
    });

    simulationRef.current = simulation;

    // Handle updates to node status without resetting simulation positions
    return () => simulation.stop();
  }, []); // Only run once on mount to establish the structure

  // Sync statuses from props to simulation nodes
  useEffect(() => {
    setSimulationNodes(prevNodes => prevNodes
      .filter(n => n && n.id)
      .map(simNode => {
        const updatedNode = nodes.find(n => n && n.id === simNode.id);
        return updatedNode ? { 
          ...simNode, 
          status: updatedNode.status, 
          label: updatedNode.label,
          threatScore: updatedNode.threatScore
        } : simNode;
      })
    );
  }, [nodes]);

  // Zoom and Drag behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Zoom setup
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    svg.call(zoomBehavior);

    // Initial centering
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2 - 150, height / 2 - 150).scale(1.5));
    }
  }, []);

  // Setup D3 Drag on nodes
  useEffect(() => {
    if (!svgRef.current || simulationNodes.length === 0 || !simulationRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Crucially: Bind data to the React-rendered elements for D3 drag to work
    const nodesSelection = svg.selectAll<SVGElement, D3Node>(".node-group")
      .data(simulationNodes.filter(n => n && n.id), (d: unknown) => (d as D3Node)?.id || "");

    const dragBehavior = d3.drag<SVGElement, D3Node>()
      .on("start", (event, d) => {
        if (!d) return;
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        if (!d) return;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!d) return;
        if (!event.active) simulationRef.current?.alphaTarget(0);
        // We keep fx/fy to pin the nodes after drag
      });

    nodesSelection.call(dragBehavior);
  }, [simulationNodes]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#03060F] overflow-hidden">
      {/* HUD Borders */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 z-10" />
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-accent-cyan/20 pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-accent-cyan/20 pointer-events-none z-10" />

      <svg 
        ref={svgRef} 
        className="w-full h-full cursor-move"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <radialGradient id="heatGradient">
            <stop offset="0%" stopColor="#FF2244" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FF2244" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF2244" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Heatmap Layer */}
          {showHeatmap && (
            <g className="heatmap-layer pointer-events-none">
              {simulationNodes.filter(n => n && n.id).map(node => {
                const isCompromised = node.status === 'compromised';
                
                // Calculate proximity to compromised nodes
                const neighbors = simulationLinks.filter(l => {
                  if (!l) return false;
                  const sId = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
                  const tId = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
                  return sId === node.id || tId === node.id;
                });
                const nearCompromised = neighbors.some(l => {
                  if (!l) return false;
                  const sId = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
                  const tId = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
                  const otherId = sId === node.id ? tId : sId;
                  if (!otherId) return false;
                  const otherNode = simulationNodes.find(n => n && n.id === otherId);
                  return otherNode?.status === 'compromised';
                });

                let intensity = (node.threatScore || 0) / 100;
                if (isCompromised) intensity = 1.0;
                else if (nearCompromised) intensity = Math.max(intensity, 0.4);

                if (intensity < 0.1) return null;

                return (
                  <motion.circle
                    key={`heat-${node.id}`}
                    cx={node.x || 0}
                    cy={node.y || 0}
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ 
                      r: [30 + intensity * 40, 35 + intensity * 45, 30 + intensity * 40],
                      opacity: intensity * 0.5 
                    }}
                    transition={{ 
                      duration: 2 + Math.random(), 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    fill="url(#heatGradient)"
                  />
                );
              })}
            </g>
          )}

          {/* Links */}
          {simulationLinks.filter(l => l && l.id).map(link => {
            const source = link.source as D3Node;
            const target = link.target as D3Node;
            if (!source || !target) return null;

            const isCompromised = source.status === 'compromised' || target.status === 'compromised';
            const bothCompromised = source.status === 'compromised' && target.status === 'compromised';
            const isIsolated = source.status === 'isolated' || target.status === 'isolated';
            const isActiveRed = isCompromised || showHeatmap;

            return (
              <g key={link.id}>
                <line
                  x1={source.x || 0} y1={source.y || 0}
                  x2={target.x || 0} y2={target.y || 0}
                  className={cn(
                    "transition-all duration-500",
                    isCompromised ? "stroke-state-danger/40" : isIsolated ? "stroke-state-iso/10" : "stroke-white/10"
                  )}
                  strokeWidth={bothCompromised ? 2 : 1}
                  strokeDasharray={isActiveRed ? "none" : "4 4"}
                />
                
                {/* Visual Flow Animation */}
                {isActiveRed ? (
                  <motion.line
                    x1={source.x || 0} y1={source.y || 0}
                    x2={target.x || 0} y2={target.y || 0}
                    animate={{ 
                      strokeOpacity: [0.1, 0.5, 0.1],
                      strokeWidth: [1, 3, 1] 
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
                      dur="3s" 
                      repeatCount="indefinite" 
                    />
                  </line>
                )}
                
                {/* Packet flow */}
                {!isIsolated && (
                   <motion.circle
                     r="1.5"
                     animate={{
                       cx: [source.x || 0, target.x || 0],
                       cy: [source.y || 0, target.y || 0],
                       opacity: [0, 1, 0]
                     }}
                     transition={{
                       duration: 2,
                       repeat: Infinity,
                       ease: "linear",
                       delay: Math.random() * 2
                     }}
                     className={cn(isCompromised ? "fill-state-danger" : "fill-accent-cyan")}
                   />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {simulationNodes.filter(n => n && n.id).map(node => {
            const Icon = TYPE_ICONS[node.type as keyof typeof TYPE_ICONS] || Server;
            const isSelected = selectedNodeId === node.id;
            const isHighlighted = highlightedNodeId === node.id;
            const isCompromised = node.status === 'compromised';
            const isIsolated = node.status === 'isolated';

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x || 0}, ${node.y || 0})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(node);
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="node-group cursor-pointer"
              >
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

                {/* Highlight Glow (Exposure Slider) */}
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

                {/* Outer Ring */}
                <motion.circle
                  r={12}
                  animate={{
                    r: isCompromised ? [12, 14, 12] : 12,
                    strokeOpacity: isCompromised ? [0.3, 0.8, 0.3] : (isSelected || isHighlighted) ? 1 : 0.2
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn(
                    "fill-void stroke-2 transition-colors duration-500",
                    isCompromised ? "stroke-state-danger text-state-danger" : 
                    isIsolated ? "stroke-state-iso text-state-iso" : 
                    isHighlighted ? "stroke-state-warning shadow-[0_0_15px_#FF9500]" :
                    "stroke-accent-cyan text-accent-cyan"
                  )}
                  filter={(isSelected || isCompromised || isHighlighted) ? "url(#glow)" : ""}
                />

                {/* Node Center */}
                <circle
                  r={9}
                  className="fill-[#0A101F] stroke-white/10 stroke-1"
                />

                {/* Icon Container using ForeignObject for Lucide icons */}
                <foreignObject x="-6" y="-6" width="12" height="12" className="pointer-events-none">
                  <div className={cn(
                    "w-full h-full flex items-center justify-center transition-colors duration-500",
                    isCompromised ? "text-state-danger" : isIsolated ? "text-state-iso" : isSelected ? "text-accent-cyan" : "text-white/60"
                  )}>
                    <Icon size={8} strokeWidth={2.5} />
                  </div>
                </foreignObject>

                {/* Label */}
                <text
                  y={28}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] font-heading tracking-widest uppercase font-bold select-none transition-colors",
                    isCompromised ? "fill-state-danger" : isSelected ? "fill-accent-cyan" : "fill-text-secondary"
                  )}
                >
                  {node.label}
                </text>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.circle
                      initial={{ r: 12, opacity: 1 }}
                      animate={{ r: 24, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="fill-none stroke-accent-cyan stroke-1 pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Node Tooltip */}
      <AnimatePresence>
        {hoveredNode && hoveredNode.x !== undefined && hoveredNode.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 pointer-events-none p-4 bg-void/90 border border-border backdrop-blur-md rounded-sm min-w-[180px] shadow-2xl"
            style={{ 
              left: hoveredNode.x * transform.k + transform.x,
              top: hoveredNode.y * transform.k + transform.y - 140, // Offset above node
              transform: 'translateX(-50%)' 
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
                <div className="flex items-center gap-2">
                   {hoveredNode.status === 'safe' && <ShieldCheck size={12} className="text-state-safe" />}
                   {hoveredNode.status === 'compromised' && <ShieldAlert size={12} className="text-state-danger" />}
                   {hoveredNode.status === 'isolated' && <ShieldOff size={12} className="text-state-iso" />}
                   <span className="text-[12px] font-display font-black text-white uppercase tracking-[1px]">{hoveredNode.label}</span>
                </div>
                <span className={cn(
                  "text-[10px] font-heading font-black px-1.5 py-0.5 rounded-full uppercase",
                  hoveredNode.status === 'safe' ? "bg-state-safe/20 text-state-safe" : 
                  hoveredNode.status === 'compromised' ? "bg-state-danger/20 text-state-danger" : "bg-state-iso/20 text-state-iso"
                )}>
                  {hoveredNode.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                 <div className="flex flex-col">
                    <span className="text-[9px] text-text-secondary font-heading font-black uppercase tracking-[1px]">Type</span>
                    <span className="text-[11px] text-white font-display font-bold uppercase">{hoveredNode.type}</span>
                 </div>
                 <div className="p-2 bg-white/5 border border-white/5 rounded-sm flex flex-col justify-center">
                    <span className="text-[9px] text-text-secondary font-heading font-black uppercase tracking-[1px]">Threat Score</span>
                    <span className={cn(
                      "text-[16px] font-display font-black leading-none mt-1",
                      (hoveredNode.threatScore || 0) > 70 ? "text-state-danger" : (hoveredNode.threatScore || 0) > 40 ? "text-state-warning" : "text-state-safe"
                    )}>
                      {(hoveredNode.threatScore || 0).toFixed(0)}
                    </span>
                 </div>
                 <div className="flex flex-col col-span-2 mt-1">
                    <span className="text-[9px] text-text-secondary font-heading font-black uppercase tracking-[1px]">UID</span>
                    <span className="text-[10px] text-white/40 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{hoveredNode.id}</span>
                 </div>
              </div>
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-void/90 border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control UI - Zoom indicators */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20">
         <div className="text-[10px] font-ui font-black text-text-secondary tracking-[0.3em] uppercase opacity-60">
            ZOOM_LEVEL: {(transform.k * 100).toFixed(0)}%
         </div>
         <div className="text-[10px] font-ui font-black text-text-secondary tracking-[0.3em] uppercase opacity-60">
            COORDS: {transform.x.toFixed(0)}, {transform.y.toFixed(0)}
         </div>
      </div>
      
      {/* Interactions hints */}
      <div className="absolute top-6 right-6 p-4 bg-void/80 border border-white/5 flex flex-col gap-3 z-20">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            <span className="text-[9px] font-bold font-ui text-text-secondary uppercase tracking-widest">WHEEL_TO_ZOOM</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            <span className="text-[9px] font-bold font-ui text-text-secondary uppercase tracking-widest">DRAG_TO_PAN</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            <span className="text-[9px] font-bold font-ui text-text-secondary uppercase tracking-widest">GRAB_NODE_TO_FIX</span>
         </div>
      </div>
    </div>
  );
}
