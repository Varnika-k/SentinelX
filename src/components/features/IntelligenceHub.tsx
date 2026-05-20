import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Target, 
  Fingerprint, 
  Share2, 
  History, 
  ShieldCheck, 
  AlertOctagon,
  Zap,
  Layers,
  ChevronRight,
  Clock,
  TrendingUp,
  Globe,
  Database,
  Search,
  Activity,
  Shield,
  Send
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';
import { AttackCampaign, MITREStage } from '../../types/intelligence';
import { cn } from '../../lib/utils';

interface IntelligenceHubProps {
  state: SimulationState;
}

export function IntelligenceHub({ state }: IntelligenceHubProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'actors' | 'baselines' | 'cloud_intel'>('campaigns');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Shodan & VT UI states
  const [shodanQueryIp, setShodanQueryIp] = useState('104.244.42.1');
  const [shodanResult, setShodanResult] = useState<any>(null);
  const [shodanLoading, setShodanLoading] = useState(false);

  const [vtQueryTarget, setVtQueryTarget] = useState('23.22.201.12');
  const [vtResult, setVtResult] = useState<any>(null);
  const [vtLoading, setVtLoading] = useState(false);

  const [cloudTrailLogs, setCloudTrailLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'cloud_intel' && cloudTrailLogs.length === 0) {
      loadAWSCloudTrail();
    }
  }, [activeTab]);

  const loadAWSCloudTrail = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/v1/cloud/aws');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCloudTrailLogs(data);
      }
    } catch (e) {
      console.error('Failed to load CloudTrail logs', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleQueryShodan = async () => {
    setShodanLoading(true);
    try {
      const res = await fetch(`/api/v1/cloud/shodan?ip=${shodanQueryIp}`);
      const data = await res.json();
      setShodanResult(data);
    } catch (e) {
      console.error(e);
      setShodanResult({ error: 'Query failed' });
    } finally {
      setShodanLoading(false);
    }
  };

  const handleQueryVT = async () => {
    setVtLoading(true);
    try {
      const res = await fetch(`/api/v1/cloud/virustotal?target=${vtQueryTarget}`);
      const data = await res.json();
      setVtResult(data);
    } catch (e) {
      console.error(e);
      setVtResult({ error: 'Query failed' });
    } finally {
      setVtLoading(false);
    }
  };

  const campaigns = state.knowledgeBase.campaigns;
  const selectedCampaign = useMemo(() => 
    campaigns.find(c => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId]
  );

  return (
    <div className="flex flex-col h-full bg-void/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
      {/* Engine Status Bar */}
      <div className="bg-void/80 px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-3 h-3 text-accent-cyan animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Knowledge_Engine_v4.2</span>
        </div>
        <div className="flex items-center gap-4">
          <StatMini label="CORRELATED" value={campaigns.length} color="text-accent-cyan" />
          <StatMini label="THREAT_VECTORS" value={state.knowledgeBase.actors.length} color="text-state-danger" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-white/5 bg-black/20">
        <TabButton active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} icon={Target} label="CAMPAIGNS" />
        <TabButton active={activeTab === 'actors'} onClick={() => setActiveTab('actors')} icon={Fingerprint} label="ACTORS" />
        <TabButton active={activeTab === 'baselines'} onClick={() => setActiveTab('baselines')} icon={Layers} label="BASELINES" />
        <TabButton active={activeTab === 'cloud_intel'} onClick={() => setActiveTab('cloud_intel')} icon={Globe} label="CLOUD" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'campaigns' && (
            <motion.div 
              key="campaigns"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                  <Share2 className="w-12 h-12 mb-4" />
                  <p className="text-xs uppercase font-bold tracking-widest">No Active Campaigns Detected</p>
                  <p className="text-[10px] mt-2">Correlation engine awaiting telemetry...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(campaign => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      selected={selectedCampaignId === campaign.id}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                    />
                  ))}
                </div>
              )}

              {selectedCampaign && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-black text-accent-cyan tracking-tighter uppercase italic">{selectedCampaign.title} Reconstruction</h3>
                    <div className="text-[10px] font-mono text-white/40">ID_{selectedCampaign.id.slice(0, 8)}</div>
                  </div>

                  {/* MITRE ATT&CK Stages */}
                  <div className="space-y-2">
                    <span className="text-[8px] text-text-secondary uppercase font-bold tracking-widest">Kill_Chain_Reconstruction</span>
                    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedCampaign.stages.map((stage, idx) => (
                        <div key={stage} className="flex items-center gap-1 shrink-0">
                          <div className="px-2 py-1 bg-void/60 border border-accent-cyan/30 rounded text-[9px] font-mono text-accent-cyan">
                            {stage.replace('-', ' ')}
                          </div>
                          {idx < selectedCampaign.stages.length - 1 && <ChevronRight size={10} className="text-white/20" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[8px] text-text-secondary uppercase">Associated_Incidents</span>
                      <div className="font-mono text-xs text-white/80">{selectedCampaign.incidents.length} events</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] text-text-secondary uppercase">Confidence_Rating</span>
                      <div className="font-mono text-xs text-state-safe">{(selectedCampaign.confidenceScore * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'actors' && (
             <motion.div 
              key="actors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {state.knowledgeBase.actors.map(actor => (
                <div key={actor.id} className="p-3 bg-void/60 border border-white/5 rounded-lg group hover:border-state-danger/30 transition-all cursor-crosshair">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-state-danger/10 border border-state-danger/30 rounded flex items-center justify-center text-state-danger">
                        <Fingerprint size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">{actor.name}</h4>
                        <span className="text-[8px] text-text-secondary uppercase font-mono">{actor.origin}</span>
                      </div>
                    </div>
                    <div className="px-1.5 py-0.5 bg-state-danger/20 rounded text-[9px] font-mono text-state-danger border border-state-danger/20 font-bold">
                      {actor.reputation}% THREAT
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {actor.associatedTechniques.map(t => (
                      <span key={t} className="text-[7px] font-mono px-1 py-0.5 bg-white/5 border border-white/10 rounded text-white/40">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'baselines' && (
             <motion.div 
              key="baselines"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                <InsightCard title="Recurring Paths" value="PC-1 -> SRV-1" icon={TrendingUp} />
                <InsightCard title="Target Concentration" value="DB-1 (High)" icon={Target} />
              </div>

              <div className="space-y-2 pt-4">
                <h4 className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Infrastructure drift alerts</h4>
                <DriftAlert node="srv-1" message="Unexpected egress to 0xA4F2 detected" severity="high" />
                <DriftAlert node="db-1" message="IAM pattern variance: Service Agent usage spike" severity="medium" />
              </div>
            </motion.div>
          )}

          {activeTab === 'cloud_intel' && (
            <motion.div 
              key="cloud_intel"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              {/* Managed Streaming Bus Stats */}
              <div className="p-3 bg-void/50 border border-white/5 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className="text-accent-cyan animate-pulse" />
                    <span className="text-[9px] font-bold tracking-widest text-white/80 uppercase">TACTICAL STREAM STATUS</span>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-state-safe">UPSTASH REDIS ACTIVE</span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <div className="p-1.5 bg-black/30 border border-white/5 rounded">
                    <span className="block text-[7px] text-white/40">CONN POOL</span>
                    <span className="text-[10px] font-mono text-white/90">NEON SQL</span>
                  </div>
                  <div className="p-1.5 bg-black/30 border border-white/5 rounded">
                    <span className="block text-[7px] text-white/40">THROTTLE</span>
                    <span className="text-[10px] font-mono text-white/90">0.05s TICK</span>
                  </div>
                  <div className="p-1.5 bg-black/30 border border-white/5 rounded">
                    <span className="block text-[7px] text-white/40">BATCH ENGINE</span>
                    <span className="text-[10px] font-mono text-accent-cyan">35 EV/FLUSH</span>
                  </div>
                </div>
              </div>

              {/* Shodan Scan Tool */}
              <div className="p-3 bg-void/30 border border-white/5 rounded-lg space-y-3">
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-accent-cyan" />
                  <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">SHODAN RECON TARGET</span>
                </div>
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    value={shodanQueryIp} 
                    onChange={(e) => setShodanQueryIp(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/90 outline-none focus:border-accent-cyan/50" 
                  />
                  <button 
                    onClick={handleQueryShodan}
                    disabled={shodanLoading}
                    className="px-3 py-1 bg-accent-cyan/10 border border-accent-cyan/30 rounded text-[10px] font-bold text-accent-cyan hover:bg-accent-cyan/20 transition-all disabled:opacity-45"
                  >
                    {shodanLoading ? 'SCANNING...' : 'SCAN'}
                  </button>
                </div>
                {shodanResult && (
                  <div className="p-2 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-white/70 space-y-1">
                    <div className="text-accent-cyan font-bold uppercase tracking-wider">{shodanResult.source || 'SHODAN RESULTS'}</div>
                    <p className="text-[10px] leading-relaxed text-white/95">{shodanResult.message}</p>
                    {shodanResult.payload && (
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/5 text-[8px] opacity-60">
                        <div>ISP: {shodanResult.payload.isp}</div>
                        <div>Target Ports: {shodanResult.payload.ports?.join(', ')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* VirusTotal Reputation Scanner */}
              <div className="p-3 bg-void/30 border border-white/5 rounded-lg space-y-3">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-state-warning" />
                  <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">VIRUSTOTAL ADVERSARY INTEL</span>
                </div>
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    value={vtQueryTarget} 
                    onChange={(e) => setVtQueryTarget(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/90 outline-none focus:border-state-warning/50" 
                  />
                  <button 
                    onClick={handleQueryVT}
                    disabled={vtLoading}
                    className="px-3 py-1 bg-state-warning/10 border border-state-warning/30 rounded text-[10px] font-bold text-state-warning hover:bg-state-warning/20 transition-all disabled:opacity-45"
                  >
                    {vtLoading ? 'SCANNING...' : 'SCAN'}
                  </button>
                </div>
                {vtResult && (
                  <div className="p-2 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-white/70 space-y-1">
                    <div className="text-state-warning font-bold uppercase tracking-wider">{vtResult.source || 'VIRUSTOTAL'}</div>
                    <p className="text-[10px] leading-relaxed text-white/95">{vtResult.message}</p>
                    {vtResult.payload && (
                      <div className="pt-1 border-t border-white/5 text-[8px] opacity-60 flex justify-between">
                        <span>DETECTIONS: {vtResult.payload.positives} / {vtResult.payload.total}</span>
                        <span className="italic">{vtResult.payload._integration}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AWS CloudTrail logs feed */}
              <div className="p-3 bg-void/30 border border-white/5 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Database size={12} className="text-white/50" />
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">AWS CLOUDTRAIL AUDIT SYNC</span>
                  </div>
                  <button 
                    onClick={loadAWSCloudTrail} 
                    className="text-[8px] text-accent-cyan hover:underline uppercase"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                  {logsLoading ? (
                    <div className="text-[9px] font-mono opacity-50 py-3 text-center">Syncing AWS events...</div>
                  ) : cloudTrailLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-1.5 bg-black/20 border-l border-white/10 rounded-r text-[9px] font-mono text-white/60">
                      <div className="flex justify-between font-bold text-[8px] text-white/80">
                        <span className="text-accent-cyan uppercase">{log.payload?.eventName || 'Audit Log'}</span>
                        <span>{log.payload?.awsRegion}</span>
                      </div>
                      <p className="text-[9px] text-white/50 leading-tight my-0.5">{log.message}</p>
                      <div className="text-[7px] text-white/30 truncate">Target ARN: {log.payload?.userIdentity?.arn || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center py-3 gap-1.5 transition-all relative overflow-hidden",
        active ? "text-accent-cyan" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      )}
    >
      <Icon size={14} />
      <span className="text-[8px] font-black tracking-[0.2em]">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-underline-intel"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan shadow-[0_0_10px_#00FFD1]" 
        />
      )}
    </button>
  );
}

function CampaignCard({ campaign, selected, onClick }: { campaign: AttackCampaign, selected: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-all relative overflow-hidden group",
        selected 
          ? "bg-accent-cyan/10 border-accent-cyan shadow-[0_0_20px_rgba(0,255,209,0.1)]" 
          : "bg-void/60 border-white/5 hover:border-white/20"
      )}
    >
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            campaign.status === 'active' ? "bg-state-danger animate-pulse" : "bg-text-secondary opacity-40"
          )} />
          <h4 className="text-xs font-black uppercase tracking-tight text-white/90">{campaign.title}</h4>
        </div>
        <span className="text-[9px] font-mono text-text-secondary italic">
          {new Date(campaign.lastActivity).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <div className="flex -space-x-1">
          {campaign.stages.slice(0, 3).map((s, i) => (
            <div key={s} className="w-4 h-4 rounded-full border border-void flex items-center justify-center bg-accent-cyan/20 text-accent-cyan" title={s}>
               <Zap className="w-2 h-2" />
            </div>
          ))}
          {campaign.stages.length > 3 && (
            <div className="w-4 h-4 rounded-full border border-void flex items-center justify-center bg-white/5 text-[7px] text-text-secondary">
              +{campaign.stages.length - 3}
            </div>
          )}
        </div>
        <span className="text-[9px] text-text-secondary font-mono tracking-tighter">
          Assets: {campaign.affectedAssets.length} &bull; Stage: {campaign.stages[campaign.stages.length - 1].replace('-', ' ')}
        </span>
      </div>

      {/* Visual background decor */}
      {selected && (
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-accent-cyan/10 to-transparent pointer-events-none" />
      )}
    </button>
  );
}

function InsightCard({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return (
    <div className="p-3 bg-void/60 border border-white/5 rounded-lg flex flex-col gap-2 shadow-inner">
      <div className="flex items-center gap-2">
        <Icon size={12} className="text-accent-cyan/60" />
        <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-[11px] font-mono text-white/90 truncate">{value}</div>
    </div>
  );
}

function DriftAlert({ node, message, severity }: { node: string, message: string, severity: 'high' | 'medium' | 'low' }) {
  return (
    <div className={cn(
      "p-2 bg-void/40 rounded border-l-2 flex items-start gap-2",
      severity === 'high' ? "border-state-danger bg-state-danger/5" : 
      severity === 'medium' ? "border-state-warning bg-state-warning/5" : "border-accent-blue bg-accent-blue/5"
    )}>
      <AlertOctagon size={12} className={cn(
        "mt-0.5 shrink-0",
        severity === 'high' ? "text-state-danger" : severity === 'medium' ? "text-state-warning" : "text-accent-blue"
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center text-[9px] mb-0.5">
          <span className="font-bold text-white/90 uppercase">{node} - Variance detected</span>
          <span className="opacity-40 italic">JUST NOW</span>
        </div>
        <p className="text-[10px] text-text-secondary leading-tight">{message}</p>
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string, value: number | string, color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[7px] text-text-secondary tracking-widest uppercase font-bold">{label}</span>
      <span className={cn("text-[10px] font-mono font-bold leading-none", color)}>{value}</span>
    </div>
  );
}
