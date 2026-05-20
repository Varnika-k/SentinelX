import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ShieldAlert, Zap, Activity, Info, ChevronRight, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { aiEngine } from '../../lib/ai-engine';
import { GraphIntelligenceEngine } from '../../lib/graph-intelligence';
import { AIAnalysisResponse } from '../../types/ai';
import { NetworkNode, NetworkLink } from '../../types/network';
import { CyberKnowledgeBase } from '../../types/intelligence';
import { cn } from '../../lib/utils';

interface Props {
  selectedNode: NetworkNode | null;
  allNodes: NetworkNode[];
  allLinks: NetworkLink[];
  knowledgeBase: CyberKnowledgeBase;
  defenseRecommendations?: any[];
}

export function AIIntelligencePanel({ selectedNode, allNodes, allLinks, knowledgeBase, defenseRecommendations }: Props) {
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
          knowledgeBase, // Pass long-term intelligence
          defenseRecommendations: allNodes.length > 0 ? [] : [], 
          recentActivity: [] 
        }
      });
      setAnalysis(result);

      // Also start streaming the reasoning for "live" feel
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
      console.error(error);
    } finally {
      setIsAnalyzing(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-void font-sans shadow-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      {/* Header */}
      <div className="p-4 border-b border-border bg-void/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent-cyan/10 rounded border border-accent-cyan/20">
            <Brain className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">
              {selectedNode ? 'Cortex_Intelligence' : 'Network_Intelligence'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse-precision" />
              <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-widest">Cognitive_Engine_Active</span>
            </div>
          </div>
        </div>
        <div className="text-[8px] font-mono bg-state-danger/10 text-state-danger px-2.5 py-1 rounded-sm border border-state-danger/20 font-bold tracking-widest uppercase">
          {selectedNode ? 'Classified // Lvl_4' : 'Network // Lvl_2'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 relative z-10" ref={scrollRef}>
        {/* Risk Assessment */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2.5">
               <ShieldAlert className="w-3.5 h-3.5 text-state-warning" />
               <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Neural_Threat_Scan</span>
             </div>
             <AnimatePresence>
               {analysis && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={cn(
                     "text-[8px] font-mono font-bold px-2 py-0.5 rounded-sm border uppercase tracking-widest",
                     analysis.threatLevel === 'critical' ? "bg-state-danger/10 text-state-danger border-state-danger/20" :
                     analysis.threatLevel === 'high' ? "bg-state-warning/10 text-state-warning border-state-warning/20" :
                     "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20"
                   )}
                 >
                   {analysis.threatLevel}_System_State
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="precision-panel p-5 relative overflow-hidden group">
            {isAnalyzing && !analysis && (
              <div className="flex flex-col gap-4 py-6 text-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-accent-cyan opacity-40" />
                <span className="text-[10px] text-accent-cyan/60 animate-pulse font-mono tracking-widest lowercase italic">traversing.memory_lattice...</span>
              </div>
            )}
            
            {analysis && (
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute -left-5 top-0 bottom-0 w-[2px] bg-accent-cyan/30" />
                  <p className="text-[12px] leading-relaxed text-text-primary font-medium italic">
                    "{analysis.summary}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-panel/30 rounded-sm border border-border group-hover:border-accent-cyan/20 transition-colors">
                    <div className="flex items-center gap-1.5 mb-2 opacity-40">
                      <Zap size={10} className="text-accent-cyan" />
                      <span className="text-[8px] uppercase font-bold tracking-widest">Conf_Rating</span>
                    </div>
                    <div className="text-lg font-mono text-accent-cyan font-bold tracking-tighter">
                      {(analysis.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-panel/30 rounded-sm border border-border group-hover:border-accent-cyan/20 transition-colors">
                    <div className="flex items-center gap-1.5 mb-2 opacity-40">
                      <Activity size={10} className="text-accent-cyan" />
                      <span className="text-[8px] uppercase font-bold tracking-widest">Latency</span>
                    </div>
                    <div className="text-lg font-mono text-accent-cyan font-bold tracking-tighter">
                      84ms_RT
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Operational Reasoning (Streaming) */}
        <section className="space-y-4">
           <div className="flex items-center gap-2.5">
             <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
             <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Reasoning_Lattice</span>
           </div>

           <div className="p-5 bg-panel/30 border border-border rounded-sm min-h-[160px] font-mono text-[10px] leading-relaxed relative group hover:border-accent-cyan/20 transition-colors shadow-inner">
              {!streamedText && isStreaming && (
                <div className="flex flex-col gap-3 py-2">
                   <div className="w-full h-1.5 bg-accent-cyan/5 animate-pulse rounded-full" />
                   <div className="w-3/4 h-1.5 bg-accent-cyan/5 animate-pulse rounded-full" />
                   <div className="w-1/2 h-1.5 bg-accent-cyan/5 animate-pulse rounded-full" />
                </div>
              )}
              <div className="text-text-secondary group-hover:text-text-primary transition-colors whitespace-pre-wrap">
                {streamedText}
                {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-accent-cyan ml-1 animate-pulse shadow-[0_0_8px_#00f2ff]" />}
              </div>
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-40 transition-opacity">
                <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse delay-75" />
                <div className="w-1 h-1 bg-accent-cyan rounded-full animate-pulse delay-150" />
              </div>
           </div>
        </section>

        {/* Recommendations */}
        <AnimatePresence>
          {analysis && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pb-2"
            >
               <div className="flex items-center gap-2.5">
                 <AlertTriangle className="w-3.5 h-3.5 text-state-danger" />
                 <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">Strategic_Remediation</span>
               </div>
               <div className="grid grid-cols-1 gap-2">
                 {analysis.recommendations.map((rec, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     key={i} 
                     className="flex items-start gap-4 p-4 bg-void/50 hover:bg-white/[0.03] transition-all rounded-sm border border-border group cursor-default"
                   >
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0 transition-all group-hover:scale-150 group-hover:shadow-[0_0_10px_#00f2ff]" />
                      <span className="text-[11px] text-text-secondary font-medium leading-relaxed group-hover:text-text-primary transition-colors">{rec}</span>
                   </motion.div>
                 ))}
               </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-void border-t border-border flex justify-between items-center relative z-10">
        <div className="flex items-center gap-5">
           <div className="flex items-center gap-1.5">
             <span className="text-[7px] uppercase font-bold text-text-tertiary tracking-widest">Model_State:</span>
             <span className="text-[8px] font-mono text-accent-cyan font-bold px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-sm">Sync_Active</span>
           </div>
           <div className="flex items-center gap-1.5 opacity-40">
             <span className="text-[7px] uppercase font-bold text-text-tertiary tracking-widest">Core_OS:</span>
             <span className="text-[8px] font-mono text-text-tertiary">Sentinel_v.8.2.1-f</span>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1 bg-void rounded-full overflow-hidden border border-white/5">
             <motion.div 
               animate={{ x: ['-100%', '100%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="w-1/2 h-full bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent"
             />
          </div>
          <Info className="w-3.5 h-3.5 text-text-tertiary transition-colors hover:text-white cursor-help" />
        </div>
      </div>
    </div>
  );
}
