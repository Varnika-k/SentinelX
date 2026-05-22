import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, ShieldAlert, Zap, Activity, Info, ChevronRight, Loader2, Sparkles, 
  AlertTriangle, Shield, Network, Skull, Layers, Globe, Fingerprint, Terminal,
  Gauge, Play, Compass, HardDrive, Cpu, Percent, AlertCircle
} from 'lucide-react';
import { aiEngine } from '../../lib/ai-engine';
import { GraphIntelligenceEngine } from '../../lib/graph-intelligence';
import { AIAnalysisResponse, AIMitigation } from '../../types/ai';
import { NetworkNode, NetworkLink } from '../../types/network';
import { CyberKnowledgeBase } from '../../types/intelligence';
import { cn } from '../../lib/utils';

interface Props {
  selectedNode: NetworkNode | null;
  allNodes: NetworkNode[];
  allLinks: NetworkLink[];
  knowledgeBase: CyberKnowledgeBase;
  defenseRecommendations?: any[];
  onHighlightNode?: (nodeId: string | null) => void;
}

export function AIIntelligencePanel({ selectedNode, allNodes, allLinks, knowledgeBase, defenseRecommendations, onHighlightNode }: Props) {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    performAnalysis();
  }, [selectedNode?.id, selectedNode?.status]);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    setStreamedText("");
    setIsStreaming(true);

    try {
      const graphEngine = new GraphIntelligenceEngine(allNodes, allLinks);
      const graphReport = graphEngine.generateFullReport();

      // Get full structured analysis
      const result = await aiEngine.analyze({
        type: selectedNode ? 'threat' : 'prediction',
        context: {
          nodes: allNodes,
          links: allLinks,
          targetNode: selectedNode || undefined,
          graphAnalytics: graphReport,
          knowledgeBase,
          defenseRecommendations: defenseRecommendations || [], 
          recentActivity: [] 
        }
      });
      setAnalysis(result);

      // Stream the raw technical reasoning
      for await (const chunk of aiEngine.streamAnalysis({
         type: selectedNode ? 'threat' : 'prediction',
         context: { 
           nodes: allNodes,
           links: allLinks,
           targetNode: selectedNode || undefined,
           graphAnalytics: graphReport,
           knowledgeBase
         }
      })) {
        setStreamedText(prev => prev + chunk);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error("Operational intelligence acquisition failure:", error);
    } finally {
      setIsAnalyzing(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#020408]/95 font-sans border border-white/5 relative overflow-hidden text-text-primary">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent-cyan/5 blur-3xl rounded-full -mr-24 -mt-24 pointer-events-none" />

      {/* Military Grade Terminal Header */}
      <div className="p-4 border-b border-white/5 bg-[#030712]/80 flex items-center justify-between relative z-10 font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-cyan/10 rounded border border-accent-cyan/30 animate-pulse-precision">
            <Brain className="w-4.5 h-4.5 text-accent-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black tracking-[0.25em] text-white uppercase">
                SENTINEL_X // INTEL_CORE
              </h3>
              <span className="text-[6.5px] bg-accent-cyan/10 border border-accent-cyan/25 text-accent-cyan rounded px-1.5 py-0.5 uppercase tracking-wide">
                Active_Runtime
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[7.5px] text-text-tertiary">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>COGNITIVE FLOW STABILIZED // RESILIENCE INDEX CALIBRATED</span>
            </div>
          </div>
        </div>
        <div className="text-[8px] font-bold bg-[#0f172a]/80 text-text-tertiary px-3 py-1.5 rounded border border-white/10 tracking-[0.1em] uppercase">
          SECLEVEL_ALPHA_IV_RESTRICTED
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 relative z-10">
        {/* Loading Overlay */}
        {isAnalyzing && !analysis && (
          <div className="flex flex-col gap-4 py-16 text-center items-center justify-center font-mono">
            <Loader2 className="w-8 h-8 animate-spin text-accent-cyan opacity-60" />
            <div className="space-y-1.5">
              <span className="text-[10px] text-accent-cyan animate-pulse tracking-widest uppercase">
                traversing.cyber_twin_lattice...
              </span>
              <p className="text-[8px] text-text-tertiary lowercase tracking-wider">
                evaluating trust boundaries & cascading vectors
              </p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            
            {/* SECTION 1: DYNAMICS & CLASSIFICATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Skull className="w-3.5 h-3.5 text-state-danger" />
                  <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase select-none font-mono">
                    Operational_Threat_Identification
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[7.5px] text-text-tertiary">CONFIDENCE:</span>
                  <span className="text-[9px] text-accent-cyan font-black">
                    {(analysis.confidence * 100).toFixed(0)}%
                  </span>
                  <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-accent-cyan h-full rounded-full" style={{ width: `${analysis.confidence * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Threat Classification & Status Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 p-3 bg-white/[0.02] border border-white/5 rounded relative flex flex-col justify-between font-mono">
                  <span className="text-[6.5px] text-text-tertiary uppercase">Threat Vector Classification</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Activity size={12} className="text-state-warning shrink-0" />
                    <span className="text-[11px] text-white font-bold uppercase truncate">
                      {analysis.threatClassification || 'Adaptive Cyber Intrusion'}
                    </span>
                  </div>
                </div>
                
                <div className={cn(
                  "p-3 rounded border flex flex-col justify-between font-mono",
                  analysis.threatLevel === 'critical' ? "bg-red-500/10 border-red-505/20 text-red-400" :
                  analysis.threatLevel === 'high' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                  "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan"
                )}>
                  <span className="text-[6.5px] uppercase opacity-75">Classification Tier</span>
                  <span className="text-[10px] font-black uppercase mt-1">
                    {analysis.threatLevel}_RISK
                  </span>
                </div>
              </div>

              {/* MITRE ATT&CK Alignment Card */}
              {analysis.adversaryBehavior && (
                <div className="p-3 bg-white/[0.01] border border-dashed border-white/5 rounded font-mono space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[7px] text-text-tertiary uppercase flex items-center gap-1">
                      <Layers size={9} className="text-violet-400" />
                      MITRE ATT&CK Matrix Alignment
                    </span>
                    <span className="text-[8px] bg-white/5 text-text-secondary px-1.5 py-0.5 rounded border border-white/5 text-right truncate max-w-[120px]">
                      {analysis.adversaryBehavior.mitreAlignment}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                    <div className="p-1.5 bg-[#030712]/40 rounded border border-white/5">
                      <span className="text-text-tertiary text-[5.5px] uppercase">Active Tactics</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.adversaryBehavior.tactics.map((t, idx) => (
                          <span key={idx} className="bg-red-500/10 border border-red-400/20 text-red-400 rounded px-1.5 py-0.5 select-none truncate">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-1.5 bg-[#030712]/40 rounded border border-white/5">
                      <span className="text-text-tertiary text-[5.5px] uppercase">Observed Techs</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.adversaryBehavior.techniques.map((t, idx) => (
                          <span key={idx} className="bg-violet-500/10 border border-violet-400/20 text-violet-400 rounded px-1.5 py-0.5 select-none truncate">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: ATTACK PROPAGATION & BLAST RADIUS SUBSTRATE */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Network className="w-3.5 h-3.5 text-accent-cyan" />
                <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase">
                  Attack_Progression_&_Propagation_Matrix
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[8px]">
                {/* Blast Radius */}
                <div className="bg-white/[0.01] border border-white/5 p-3 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-text-tertiary text-[6px] uppercase">Active Blast Radius</span>
                    <div className="text-[13px] font-black text-rose-400 mt-1">
                      {analysis.blastRadius ?? 0}%
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-rose-500 h-full rounded" style={{ width: `${analysis.blastRadius ?? 0}%` }} />
                  </div>
                </div>

                {/* Trust Bound Impact */}
                <div className="bg-white/[0.01] border border-white/5 p-3 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-text-tertiary text-[6px] uppercase">Trust Bound Degradation</span>
                    <div className="text-[13px] font-black text-amber-400 mt-1">
                      {analysis.trustDegradation ?? 0}%
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-amber-500 h-full rounded" style={{ width: `${analysis.trustDegradation ?? 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Lateral Probability & Affected Infrastructure */}
              <div className="p-3 bg-[#030712]/50 border border-white/5 rounded space-y-3 text-[8.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-[7.5px] text-text-tertiary uppercase">Lateral Spread Risk:</span>
                  <span className={cn(
                    "font-bold text-[9px]",
                    (analysis.propagationProbability ?? 40) > 60 ? "text-red-400" : "text-emerald-400"
                  )}>
                    {(analysis.propagationProbability ?? 40)}% Propagation Probability
                  </span>
                </div>
                
                {/* Affected Node Badges */}
                <div className="space-y-1.5">
                  <span className="text-[6.5px] text-text-tertiary uppercase flex items-center gap-1 select-none">
                    <Globe size={8} className="text-accent-cyan" />
                    Target Area Blast Coordinates
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto p-1 bg-white/[0.01] rounded border border-white/5">
                    {analysis.affectedInfrastructure && analysis.affectedInfrastructure.length > 0 ? (
                      analysis.affectedInfrastructure.map((node, i) => {
                        const match = allNodes.find(n => n.label === node || n.id === node);
                        return (
                          <div 
                            key={i} 
                            onMouseEnter={() => match && onHighlightNode?.(match.id)}
                            onMouseLeave={() => onHighlightNode?.(null)}
                            className="flex items-center gap-1.5 bg-[#0f172a]/80 hover:bg-rose-500/15 hover:border-rose-400/30 text-[#94a3b8] hover:text-white px-2 py-1 rounded border border-white/5 font-mono text-[7.5px] cursor-crosshair transition-all"
                          >
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse-precision" />
                            <span>{node}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-text-tertiary text-[7.5px] italic p-1">No severe cascade coordinate highlights flagged.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: REPLAY ANALYSIS (IF ACTIVE) */}
            {analysis.replayAnalysis && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Play className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase">
                    Incident_Forensic_Timeline_Reconstruction
                  </span>
                </div>

                <div className="p-3.5 bg-violet-950/[0.05] border border-violet-500/15 rounded text-[8.5px] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[6.5px] text-violet-405 font-bold uppercase">Chronological Range Auditors</span>
                    <span className="text-[8px] opacity-75">
                      Duration: <strong className="text-white font-mono">{analysis.replayAnalysis.incidentDurationSeconds ?? 120}s</strong>
                    </span>
                  </div>
                  
                  {analysis.replayAnalysis.timelineSummary && (
                    <div className="p-2 bg-[#020408]/60 rounded border border-white/5 space-y-1">
                      <span className="text-[6px] text-text-tertiary uppercase">Sequence Summary</span>
                      <p className="text-[8px] leading-relaxed text-text-secondary italic">
                        "{analysis.replayAnalysis.timelineSummary}"
                      </p>
                    </div>
                  )}

                  {analysis.replayAnalysis.rootCauseReasoning && (
                    <div className="space-y-1 bg-[#020408]/40 p-2 rounded border border-white/5">
                      <span className="text-[6px] text-text-tertiary uppercase font-bold text-violet-400">Root Cause Analyzer Summary</span>
                      <p className="text-[8.5px] leading-relaxed text-text-primary font-mono select-text">
                        {analysis.replayAnalysis.rootCauseReasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: ADAPTIVE AI THREAT PROFILER (SECTION I) */}
            {analysis.adaptiveThreatDetails && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Fingerprint className="w-3.5 h-3.5 text-state-danger" />
                  <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase">
                    Adversary_Adaptability_Intelligence
                  </span>
                </div>

                <div className="p-3.5 bg-red-950/[0.03] border border-red-500/10 rounded text-[8px] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[6.5px] font-bold text-text-tertiary uppercase">Behavioral Adaption Risk Risk Index</span>
                    <span className={cn(
                      "text-[8px] px-2 py-0.5 rounded-sm border font-black uppercase font-mono text-center tracking-widest",
                      analysis.adaptiveThreatDetails.adaptabilityRisk === 'autonomous' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      analysis.adaptiveThreatDetails.adaptabilityRisk === 'high' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20"
                    )}>
                      {analysis.adaptiveThreatDetails.adaptabilityRisk}
                    </span>
                  </div>

                  {analysis.adaptiveThreatDetails.payloadMutationPattern && (
                    <div className="space-y-1">
                      <span className="text-[6px] text-text-tertiary uppercase">Payload DNA / Mutate Pattern</span>
                      <div className="p-2 bg-[#020408]/80 text-[7.5px] text-[#ef4444] rounded border border-red-500/10 font-mono">
                        {analysis.adaptiveThreatDetails.payloadMutationPattern}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 font-sans">
                    <span className="text-[6px] text-text-tertiary uppercase font-mono">Adaption Behavior Breakdown</span>
                    <p className="text-[8.5px] leading-relaxed text-text-secondary italic">
                      "{analysis.adaptiveThreatDetails.behaviouralAdaptation}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: AI-GUIDED TACTICAL DEFENSE PLANNER */}
            <div className="space-y-3 font-mono select-none">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-accent-cyan" />
                  <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase">
                    Autonomous_Mitigation_Recommendation_Pipeline
                  </span>
                </div>
              </div>

              {/* Side-by-side / Stacked Detailed Action Proposals */}
              <div className="space-y-3">
                {analysis.mitigations && analysis.mitigations.length > 0 ? (
                  analysis.mitigations.map((mit, idx) => (
                    <div key={idx} className="p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded space-y-14 hover:border-accent-cyan/20 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-[#f8fafc] font-black uppercase flex items-center gap-1.5 leading-none">
                          <span className="p-1 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-[7px] leading-none font-bold">
                            Plan_0{idx + 1}
                          </span>
                          {mit.action}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[6px] text-text-tertiary uppercase">SUCCESS_PROB:</span>
                          <span className={cn(
                            "text-[8.5px] font-black",
                            mit.successProbability > 75 ? "text-emerald-400" : "text-amber-400"
                          )}>
                            {mit.successProbability}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[7.5px] mt-2 leading-relaxed">
                        <div className="p-2 bg-[#020408]/60 rounded border border-white/5 space-y-1">
                          <span className="text-[5.5px] font-bold text-emerald-400 uppercase">MITIGATION RATIONALE</span>
                          <p className="text-[8px] text-text-secondary leading-normal select-text">
                            {mit.rationale}
                          </p>
                        </div>
                        
                        <div className="p-2 bg-[#020408]/60 rounded border border-white/5 space-y-1">
                          <span className="text-[5.5px] font-bold text-rose-400 uppercase">OPERATIONAL TIMELINE COST</span>
                          <p className="text-[8px] text-text-secondary leading-normal select-text">
                            {mit.sideEffects}
                          </p>
                        </div>
                      </div>

                      <div className="text-[7.5px] p-2 bg-[#030712]/80 border border-dashed border-white/5 rounded text-text-tertiary flex items-center justify-between gap-2">
                        <span>TOPOLOGICAL PATH OUTCOME:</span>
                        <span className="text-accent-cyan uppercase font-bold select-text text-right truncate max-w-[170px] ml-auto">
                          {mit.infrastructureImpact}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-white/[0.01] rounded border border-white/5 text-[8.5px]">
                      <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full mt-1 shrink-0" />
                      <span className="text-text-secondary italic">{rec}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COGNITIVE REASONING SUMMARY LOG CARD */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Terminal className="w-3.5 h-3.5 text-accent-cyan animate-pulse-precision" />
                <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase">
                  Tactical_Cognitive_Reasoning_Stream
                </span>
              </div>
              
              <div className="p-4 bg-void/85 border border-white/5 rounded max-h-[140px] overflow-y-auto custom-scrollbar text-[8.5px] leading-relaxed relative group">
                <div className="text-text-secondary whitespace-pre-wrap leading-relaxed select-text font-mono">
                  {streamedText}
                  {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-accent-cyan ml-1 animate-pulse shadow-[0_0_8px_#00f2ff]" />}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Terminal Grid Footer */}
      <div className="p-3 bg-[#030712]/90 border-t border-white/5 flex justify-between items-center relative z-10 font-mono text-[7px] text-text-tertiary select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="uppercase text-[6px]">Sync Index:</span>
            <span className="text-accent-cyan font-bold px-1 py-0.2 bg-accent-cyan/5 border border-accent-cyan/15 rounded-sm">
              Telemetry_OK
            </span>
          </div>
          <p className="opacity-50">STNL_RT.9.1.5</p>
        </div>
        <div className="flex items-center gap-2">
          <span>Active range coordinates stabilized</span>
          <Activity size={10} className="text-accent-cyan animate-pulse" />
        </div>
      </div>
    </div>
  );
}
