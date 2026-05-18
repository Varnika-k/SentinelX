import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, Zap, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { aiEngine } from '../../lib/ai-engine';
import { TelemetryEvent } from '../../types/telemetry';

export function IncidentReport({ 
  events, 
  isOpen, 
  onClose 
}: { 
  events: TelemetryEvent[], 
  isOpen: boolean, 
  onClose: () => void 
}) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && events.length > 0) {
      setLoading(true);
      aiEngine.analyze({
        type: 'incident',
        context: {
          events: events.slice(0, 20)
        }
      }).then(res => {
        setReport(res.summary);
        setLoading(false);
      }).catch(() => {
        setReport("Incident synthesis failure.");
        setLoading(false);
      });
    }
  }, [isOpen, events]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-void/80 backdrop-blur-md z-[60] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl bg-void border border-[#1A3050] rounded-sm overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-cyan/10 rounded-sm flex items-center justify-center text-accent-cyan">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-white font-heading font-black uppercase text-sm tracking-widest">Intelligence Report</h2>
                <span className="text-[9px] font-body text-text-secondary uppercase tracking-widest mt-1 block">Sentinel Intelligence Unit</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 font-ai text-[11px] leading-relaxed custom-scrollbar text-text-primary">
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent-cyan/60">
                  <Zap size={14} className="animate-pulse" />
                  <span className="font-bold tracking-widest">DECRYPTING LOGS & GENERATING SUMMARY...</span>
                </div>
                <div className="h-4 w-full bg-white/5 animate-pulse rounded-sm" />
                <div className="h-4 w-5/6 bg-white/5 animate-pulse rounded-sm" />
                <div className="h-4 w-4/6 bg-white/5 animate-pulse rounded-sm" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-accent-cyan mb-4">
                  <Terminal size={14} />
                  <span className="uppercase font-bold tracking-tighter">Executive Intelligence Summary</span>
                </div>
                <div className="text-white/80 whitespace-pre-wrap border-l-2 border-accent-cyan/30 pl-6 py-1 font-ai">
                  {report}
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h4 className="text-text-secondary uppercase text-[9px] mb-4 tracking-[0.3em] font-black">Metadata Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {['BREACH', 'ISOLATION', 'MITIGATED', 'AI-ANALYSIS'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-white/5 rounded-sm border border-white/5 text-[8px] text-white/40 font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/10 bg-surface flex justify-end gap-3">
             <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-white/60 hover:bg-white/10 transition-all text-xs font-body font-bold"
            >
              <Download size={14} />
              EXPORT PDF
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-accent-cyan hover:bg-accent-cyan/80 text-void rounded-sm transition-all text-[10px] font-ui font-black tracking-widest"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
