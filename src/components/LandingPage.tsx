import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Shield, Lock, Activity, Users, Zap, Search, ArrowRight, Server, Brain, Cpu, Network, FileText, Terminal as TerminalIcon, Eye, Globe, ChevronRight, ShieldAlert, Download, RotateCcw, Target, ShieldOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useRef, useState } from 'react';
import { NetworkNode, SimulationState } from '../types/simulation';
import { NetworkGraph } from './NetworkGraph';
import { ControlPanel } from './ControlPanel';
import { EventPanel } from './EventPanel';
import { MetricsPanel } from './MetricsPanel';
import { ThreatBanner } from './ThreatBanner';

export interface LandingPageProps {
  onEnterSimulation: () => void;
  onOpenManual: () => void;
}

export function LandingPage({ 
  onEnterSimulation,
  onOpenManual
}: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hero Animation Logic
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const nodes: any[] = [];
    for (let i = 0; i < 50; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
        color: i % 2 === 0 ? '#00FFD1' : '#4FC3F7'
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 255, 209, ${0.1 * (1 - dist / 200)})`;
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    }

    animate();
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="bg-void text-text-primary font-body select-none">
      {/* 1. Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-20 border-b border-border bg-void/80 backdrop-blur-xl flex items-center justify-between px-10">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-cyan" />
          <div className="font-display font-black text-[14px] tracking-[4px] text-white uppercase">
            SENTINEL <span className="text-accent-cyan">//</span> X
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-12">
          {[
            { label: 'PLATFORM', id: '#platform' },
            { label: 'CAPABILITIES', id: '#capabilities' },
            { label: 'ARCHITECTURE', id: '#architecture' },
            { label: 'ROADMAP', id: '#roadmap' },
          ].map(link => (
            <a 
              key={link.label}
              href={link.id}
              className="font-heading text-[10px] tracking-[2px] text-text-secondary hover:text-accent-cyan transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button 
           onClick={onOpenManual}
           className="px-6 py-2 border border-accent-cyan/30 text-accent-cyan font-display text-[10px] tracking-[3px] font-bold hover:bg-accent-cyan/10 transition-all uppercase"
           style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          VIEW MANUAL
        </button>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden px-6">
        <canvas ref={heroCanvasRef} className="absolute inset-0 z-0 opacity-40" />
        
        <div className="relative z-10 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-heading text-[9px] tracking-[6px] text-accent-cyan mb-8 uppercase"
          >
            // NEXT-GEN AUTONOMOUS CYBER DEFENSE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="font-display font-black text-[clamp(42px,8vw,88px)] leading-[0.9] text-white tracking-tighter mb-6 uppercase"
          >
            SENTINEL <span className="text-accent-cyan text-glow-accent">X</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="font-display text-[clamp(9px,1.5vw,13px)] tracking-[5px] text-accent-blue mb-10 uppercase"
          >
            AUTONOMOUS THREAT ORCHESTRATION & REAL-TIME RESILIENCE.
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="font-body text-[13px] leading-[1.8] text-text-secondary max-w-2xl mx-auto mb-12 uppercase tracking-wide font-medium"
          >
            Sentinel X is a high-fidelity cyber-simulation platform providing real-time visibility into complex attack propagation and autonomous defensive response. Designed for threat hunting, architectural validation, and AI-driven resilience training.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex flex-wrap justify-center gap-8 mb-24"
          >
             <button 
                onClick={onEnterSimulation}
                className="px-10 py-5 bg-accent-cyan text-void font-display font-bold text-[11px] tracking-[3px] hover:shadow-[0_0_30px_rgba(0,255,209,0.4)] transition-all uppercase"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
             >
               LAUNCH BATTLESPACE
             </button>
             <button 
                onClick={onOpenManual}
                className="px-10 py-5 border border-white/10 text-white font-display font-bold text-[11px] tracking-[3px] hover:bg-white/5 transition-all uppercase"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
             >
               OPERATIONS GUIDE
             </button>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="flex flex-wrap justify-center gap-10 md:gap-20 py-8 border-t border-border"
          >
            {[
              { val: '18', label: 'CRITICAL NODES' },
              { val: '6', label: 'ATTACK VECTORS' },
              { val: 'ZERO', label: 'TRUST ARCHITECTURE' },
              { val: '100%', label: 'AUTONOMOUS DEFENSE' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="font-display font-bold text-[16px] text-white">{stat.val}</span>
                <span className="font-heading text-[8px] tracking-[2px] text-text-secondary mt-1">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Corporate Features Panel */}
      <section id="platform" className="py-32 bg-surface border-y border-border">
         <div className="max-w-7xl mx-auto px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
               <div className="space-y-6">
                  <span className="font-heading text-[8px] tracking-[4px] text-accent-cyan uppercase">// CORE_ENGINE</span>
                  <h3 className="font-display text-[24px] text-white tracking-[2px] uppercase">THREAT PROPAGATION</h3>
                  <p className="font-body text-[11px] leading-[1.8] text-text-secondary uppercase">
                    Our proprietary simulation engine models recursive threat movement across distributed network clusters, allowing security architects to identify structural vulnerabilities before deployment.
                  </p>
               </div>
               <div className="space-y-6">
                  <span className="font-heading text-[8px] tracking-[4px] text-accent-blue uppercase">// AI_ORCHESTRATOR</span>
                  <h3 className="font-display text-[24px] text-white tracking-[2px] uppercase">AUTONOMIC RECOVERY</h3>
                  <p className="font-body text-[11px] leading-[1.8] text-text-secondary uppercase">
                    Leveraging advanced neural isolation, Sentinel X automatically severs compromised network segments to prevent lateral movement while maintaining mission-critical node availability.
                  </p>
               </div>
               <div className="space-y-6">
                  <span className="font-heading text-[8px] tracking-[4px] text-state-safe uppercase">// VISIBILITY</span>
                  <h3 className="font-display text-[24px] text-white tracking-[2px] uppercase">HEURISTIC TELEMETRY</h3>
                  <p className="font-body text-[11px] leading-[1.8] text-text-secondary uppercase">
                    Real-time visual telemetry provides high-fidelity insight into breach depth, criticality impact, and infrastructure resilience through standard heuristic monitoring.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Replace Live Demo section with Professional Callout */}
      <section id="capabilities" className="py-48 bg-panel flex flex-col items-center justify-center text-center px-6">
          <motion.div 
            whileInView={{ opacity: [0, 1], y: [40, 0] }}
            className="max-w-3xl space-y-12"
          >
             <h2 className="font-display text-[clamp(28px,4vw,48px)] text-white tracking-[4px] uppercase leading-tight">
               ENTER THE NEXT FRONTIER OF CYBER RESILIENCE.
             </h2>
             <button 
                onClick={onEnterSimulation}
                className="px-12 py-5 bg-accent-cyan text-void font-display font-bold text-[11px] tracking-[4px] uppercase hover:scale-105 transition-all"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
             >
               ENTER BATTLESPACE EXPERT MODE
             </button>
          </motion.div>
      </section>

      {/* 5. Feature capabilities grid callout */}
      <section id="deployment" className="py-32 bg-void border-t border-border">
         <div className="max-w-7xl mx-auto px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
               <div className="space-y-4">
                  <h4 className="font-display text-[16px] text-white tracking-[2px] uppercase">DEPLOYMENT_STAKE</h4>
                  <p className="text-[11px] text-text-secondary leading-[1.8] uppercase">
                    Sentinel X is deployed across global node clusters to provide unparalleled visibility into adversarial movement.
                  </p>
               </div>
               <div className="space-y-4">
                  <h4 className="font-display text-[16px] text-white tracking-[2px] uppercase">OPERATIONAL_SLOT</h4>
                  <p className="text-[11px] text-text-secondary leading-[1.8] uppercase">
                    Our platform integrates directly into existing SOC workflows, providing AI-assisted remediation suggestions.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* 6. Features Grid */}
      <section className="py-24 bg-void">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col gap-4 mb-16 text-center">
            <span className="font-heading text-[8px] tracking-[4px] text-accent-cyan uppercase">// SYSTEM_CAPABILITIES</span>
            <h2 className="font-display font-bold text-[32px] text-white tracking-[3px] uppercase">
              PLATFORM FEATURES
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
             {[
               { icon: Activity, title: 'REALTIME TELEMETRY', text: 'Live packet-level monitoring across all network segments.', target: '#platform' },
               { icon: Brain, title: 'NEURAL DEFENSE', text: 'AI agents that learn and adapt to player attack strategies.', target: '#capabilities' },
               { icon: Zap, title: 'ZERO-LATENCY SYNC', text: 'High-performance event bus for instant state propagation.', target: '#deployment' },
               { icon: Lock, title: 'VAULT ARCHITECTURE', text: 'Military-grade encryption for all sensitive data transitions.', target: '#architecture' },
               { icon: Eye, title: 'BREACH VISUALIZER', text: 'Advanced 2D/3D visualization of threat propagation paths.', target: '#platform' },
               { icon: Server, title: 'MICRO-INFRA', text: 'Simulated microservices architecture with inter-node dependencies.', target: '#architecture' },
               { icon: Target, title: 'PRECISION TRIAGE', text: 'Automated threat scoring with 99.9% accuracy rate.', target: '#capabilities' },
               { icon: FileText, title: 'AI LOG SUMMARY', text: 'Gemini-powered natural language summaries of each incident.', target: '#ai-intelligence' },
             ].map(feat => (
               <button 
                 key={feat.title} 
                 onClick={() => feat.target.startsWith('#') ? document.querySelector(feat.target)?.scrollIntoView({ behavior: 'smooth' }) : onOpenManual()}
                 className="bg-panel p-8 group hover:bg-elevated transition-all flex flex-col items-center text-center cursor-pointer border-none outline-none"
               >
                 <feat.icon className="w-6 h-6 text-accent-cyan mb-6 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                 <h4 className="font-display text-[10px] tracking-[2px] text-white mb-3 uppercase">{feat.title}</h4>
                 <p className="font-heading text-[10px] leading-[1.7] text-text-secondary uppercase">{feat.text}</p>
                 <div className="mt-4 flex items-center gap-2 text-[8px] text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                    <Search size={10} />
                    <span>EXTRACT_INTEL</span>
                 </div>
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* 7. AI Intelligence */}
      <section id="ai-intelligence" className="py-24 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-10">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="bg-void border border-border p-8 h-96 overflow-hidden flex flex-col shadow-2xl">
                 <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                    <TerminalIcon className="w-4 h-4 text-accent-cyan" />
                    <span className="font-heading text-[8px] tracking-[4px] text-text-secondary">AI_TERMINAL_SESSION_0x83F</span>
                 </div>
                 <div className="flex-1 font-ai text-[11px] leading-[1.8] text-accent-cyan/80 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                       <p>▶ INITIALIZING_GEMINI_INTEL_MODEL...</p>
                       <p className="text-text-secondary opacity-60">▶ MODEL_SPEC: FLASH-2.0-SENTINEL_OPTIMIZED</p>
                       <p>▶ SCANNING_NETWORK_FOR_ANOMALIES...</p>
                       <div className="pl-4 border-l border-accent-cyan/20 space-y-2">
                          <p className="text-white hover:text-accent-cyan transition-colors cursor-default">0ms: NO_ANOMALIES_DETECTED</p>
                          <p className="text-white">142ms: PACKET_BURST_DETECTED_ZONE_CORE</p>
                          <p className="text-state-warning">284ms: THREAT_LEVEL_INCREASED_TO_MEDIUM</p>
                          <p className="text-state-danger">512ms: BREACH_DETECTED // NODE: HR_ENDPOINT</p>
                       </div>
                       <p className="animate-pulse">▶ AWAITING_DEFENDER_INPUT_...</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-12">
                 <div className="space-y-4">
                    <span className="font-heading text-[8px] tracking-[4px] text-accent-cyan uppercase">// AI_INTELLIGENCE</span>
                    <h2 className="font-display font-bold text-[32px] text-white tracking-[3px] uppercase">
                      THE MACHINE THINKS FOR ITSELF.
                    </h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { title: 'AUTONOMOUS AGENTS', text: 'Self-healing routines that activate without human intervention.' },
                      { title: 'PATTERN MATCHING', text: 'Heuristic models that detect unknown malware signatures.' },
                      { title: 'PREDICTIVE ANALYTICS', text: 'Forecasting breach probability based on current traffic.' },
                      { title: 'COGNITIVE SOC', text: 'Natural language interaction with the network state.' },
                    ].map(card => (
                      <div key={card.title} className="p-6 bg-panel border border-border group hover:border-accent-cyan/30 transition-all">
                        <h4 className="font-display text-[10px] tracking-[2px] text-white mb-2 uppercase">{card.title}</h4>
                        <p className="font-heading text-[10px] leading-[1.7] text-text-secondary uppercase">{card.text}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 8. Architecture Diagram */}
      <section id="architecture" className="py-24 bg-void">
         <div className="max-w-7xl mx-auto px-10 text-center">
            <div className="flex flex-col gap-4 mb-20 items-center">
              <span className="font-heading text-[8px] tracking-[4px] text-accent-cyan uppercase">// SYSTEM_STAKE_MAP</span>
              <h2 className="font-display font-bold text-[32px] text-white tracking-[3px] uppercase">
                ARCHITECTURE LAYERS
              </h2>
            </div>

            <div className="relative flex flex-col gap-12 items-center">
               {[
                 { layer: 'FRONTEND_NODES', chips: ['NEXT.JS 15', 'THREE.JS', 'D3.JS v7', 'FRAMER MOTION', 'GSAP 3'], color: 'border-accent-cyan/20' },
                 { layer: 'SIMULATION_NODES', chips: ['GEMINI API', 'NETWORKX', 'SIR_MODEL', 'WEBSOCKETS'], color: 'border-white/10' },
                 { layer: 'AI_NODES', chips: ['PYTORCH', 'SB3', 'REINFORCEMENT LEARNING', 'NLP'], color: 'border-state-patched/20' },
                 { layer: 'DATA_NODES', chips: ['REDIS STREAMS', 'POSTGRES', 'ELASTICSEARCH'], color: 'border-state-danger/20' },
                 { layer: 'INFRA_NODES', chips: ['DOCKER', 'K8S', 'TERRAFORM', 'GCP'], color: 'border-state-safe/20' }
               ].map((arch, i) => (
                 <div key={arch.layer} className="relative w-full flex flex-col items-center">
                    {i > 0 && <div className="absolute -top-12 h-12 w-px bg-border" />}
                    <div className={cn("p-8 bg-panel border w-full max-w-4xl relative z-10", arch.color)}>
                       <span className="font-heading text-[9px] tracking-[1px] text-text-secondary uppercase block mb-6">{arch.layer}</span>
                       <div className="flex flex-wrap justify-center gap-4">
                          {arch.chips.map(chip => (
                            <span key={chip} className="px-4 py-2 bg-void border border-border text-white font-heading text-[10px] tracking-[2px] uppercase">
                              {chip}
                            </span>
                          ))}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 9. Roadmap */}
      <section id="roadmap" className="py-24 bg-surface border-y border-border">
         <div className="max-w-7xl mx-auto px-10">
            <div className="flex flex-col gap-4 mb-20">
              <span className="font-heading text-[8px] tracking-[4px] text-accent-cyan uppercase">// EVOLUTION_PATH</span>
              <h2 className="font-display font-bold text-[32px] text-white tracking-[3px] uppercase">
                ROADMAP_TO_INTELLIGENCE
              </h2>
              <p className="font-body text-[12px] leading-[1.9] text-text-secondary max-w-xl uppercase">The platform evolves through five distinct phases of intelligence integration.</p>
            </div>

            <div className="relative pl-12 space-y-12">
               {/* Vertical line with diamond markers */}
               <div className="absolute left-[3px] top-4 bottom-4 w-px bg-border" />
               {[
                 { title: 'PHASE 01: FOUNDATION', tag: 'ACTIVE', desc: 'Core simulation engine with deterministic attack patterns and real-time graph visualization.' },
                 { title: 'PHASE 02: DETECTION', tag: 'BETA', desc: 'Integration of anomaly detection models and live threat scoring for every node.' },
                 { title: 'PHASE 03: PREDICTION', tag: 'PLANNED', desc: 'Predictive analytics engine forecasting the next 60 seconds of threat movement.' },
                 { title: 'PHASE 04: AGENT_TRAINING', tag: 'FUTURE', desc: 'Reinforcement learning arena for training defender agents in zero-day scenarios.' },
                 { title: 'PHASE 05: GLOBAL_MESH', tag: 'FUTURE', desc: 'Decentralized soc mode with multi-user collaborative defense capabilities.' },
               ].map((phase, i) => (
                 <div key={phase.title} className="relative group">
                    <div className="absolute -left-[14px] top-2 w-[11px] h-[11px] rotate-45 border border-border bg-void z-10 group-hover:bg-accent-cyan group-hover:border-accent-cyan transition-colors" />
                    <div className="space-y-4">
                       <span className="font-heading text-[8px] tracking-[3px] text-accent-cyan px-2 py-1 bg-accent-cyan/10 uppercase">[{phase.tag}]</span>
                       <h4 className="font-display text-[14px] tracking-[2px] text-white uppercase">{phase.title}</h4>
                       <p className="font-body text-[11px] leading-[1.7] text-text-secondary max-w-2xl uppercase">{phase.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 10. Footer CTA */}
      <section className="py-48 bg-void relative overflow-hidden flex items-center justify-center border-b border-border">
          {/* Watermark Title */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden flex items-center justify-center">
             <div className="font-display text-[clamp(100px,25vw,400px)] font-black text-white whitespace-nowrap -rotate-6">SENTINEL X</div>
          </div>

          <div className="relative z-10 text-center px-6">
             <h2 className="font-display font-bold text-[clamp(28px,5vw,52px)] text-white tracking-[4px] mb-8 uppercase leading-tight">
               READY TO DEFEND THE GRID?
             </h2>
             <p className="font-body text-[12px] leading-[1.9] text-text-secondary max-w-xl mx-auto mb-16 uppercase tracking-wider">
               Join the autonomous vanguard. Access the simulation and study the future of cyber warfare.
             </p>
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-12 py-5 bg-accent-cyan text-void font-display font-bold text-[10px] tracking-[3px] hover:shadow-[0_0_50px_rgba(0,255,209,0.5)] transition-all uppercase"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
             >
               BACK TO TOP
             </button>
          </div>
      </section>

      {/* 11. Footer */}
      <footer className="py-20 bg-void border-t border-border">
         <div className="max-w-7xl mx-auto px-10">
            <div className="flex flex-col items-center gap-12 text-center">
               <div className="flex items-center gap-2">
                 <Shield className="w-5 h-5 text-accent-cyan opacity-40" />
                 <div className="font-display font-black text-[14px] tracking-[4px] text-white opacity-40 uppercase">
                   SENTINEL <span className="text-accent-cyan">//</span> X
                 </div>
               </div>

               <div className="flex flex-wrap justify-center gap-12">
                  {['PLATFORM', 'CAPABILITIES', 'ARCHITECTURE', 'ROADMAP'].map(link => (
                    <a key={link} href={`#${link.toLowerCase()}`} className="font-heading text-[10px] tracking-[2px] text-text-secondary hover:text-accent-cyan transition-colors uppercase">
                      {link}
                    </a>
                  ))}
               </div>

               <div className="font-heading text-[9px] tracking-[1px] text-text-secondary opacity-40 max-w-2xl leading-loose uppercase">
                 SENTINEL X — AUTONOMOUS CYBER DEFENSE SIMULATOR — GENERATION III<br />
                 © 2026 PROTECT THE CORE — FOR INVESTIGATION ONLY
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
