import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, Network, Zap, ChevronRight, UserCheck, Database, KeyRound, Lock, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoginTerminal({ onComplete }: { onComplete: (role: string, tenant: string) => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [logsFinished, setLogsFinished] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Security Analyst' | 'Incident Commander' | 'Forensic Investigator'>('Administrator');
  const [selectedTenant, setSelectedTenant] = useState<'CORE_INTEL_US_EAST' | 'ALPHA_PARTNERS_GLOBAL' | 'DEMO_SANDBOX_LAB'>('CORE_INTEL_US_EAST');
  const [authStatus, setAuthStatus] = useState<'idle' | 'authorizing' | 'completed'>('idle');
  const [authProgress, setAuthProgress] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const initialSequence = [
    "INITIALIZING SENTINEL_OS_v4.4.2...",
    "LOADING KERNEL MODULES... OK",
    "ESTABLISHING SECURE TUNNEL... [WSS://SENTINEL.CORE]",
    "BYPASSING PERIMETER FIREWALL... SUCCESS",
    "MOUNTING NEURAL STORAGE... [EXT4_FS]",
    "DECRYPTING THREAT_DATABASE... 100%",
    "SYNCHRONIZING GLOBAL AGENTS... [24/24]",
    "READY FOR COMMAND INPUT."
  ];

  const rolesList = [
    { id: 'Administrator', label: 'Administrator', desc: 'Direct topological interaction & direct physical payload triggers', icon: Shield },
    { id: 'Security Analyst', label: 'Security Analyst', desc: 'Read-only telemetry audits, cognitive analysis, threat investigation', icon: UserCheck },
    { id: 'Incident Commander', label: 'Incident Commander', desc: 'Execute domain-wide automated mitigations & override active blocks', icon: KeyRound },
    { id: 'Forensic Investigator', label: 'Forensic Investigator', desc: 'Temporal deterministic replay playback, forensic report outputs', icon: Eye }
  ];

  const tenantsList = [
    { id: 'CORE_INTEL_US_EAST', label: 'CORE INTEL (US-EAST)', subnet: '10.24.100.0/22', tenantId: 'TNT-704-CORE' },
    { id: 'ALPHA_PARTNERS_GLOBAL', label: 'ALPHA PARTNERS (FED)', subnet: '172.16.8.0/24', tenantId: 'TNT-902-FED' },
    { id: 'DEMO_SANDBOX_LAB', label: 'DEMO SANDBOX (ISOLATED)', subnet: '192.168.42.0/24', tenantId: 'TNT-001-DEV' }
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < initialSequence.length) {
        setLogs(prev => [...prev, initialSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setLogsFinished(true);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleAuthorize = async () => {
    setAuthStatus('authorizing');
    const steps = [
      "VALIDATING CREDENTIAL SIGNATURE...",
      "VERIFYING MULTI-FACTOR TOKEN [SMS_MFA: APPROVED]...",
      `CONFIGURING COGNITIVE SECURE BOUNDARIES FOR TENANT [${selectedTenant}]...`,
      `PROVISIONING ROLE ROLE [${selectedRole.toUpperCase()}]...`,
      "ESTABLISHING CRYPTOGRAPHIC SECURE TUNNELS... SUCCESS",
      "ACCESS PERMITTED. BOOTING COMMAND GRID CONTROLLER..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setAuthProgress(steps[i]);
      await new Promise(r => setTimeout(r, 400));
    }

    setAuthStatus('completed');
    // Allow animation to render fully
    setTimeout(() => {
      onComplete(selectedRole, selectedTenant);
    }, 400);
  };

  if (authStatus === 'completed') {
    return (
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 bg-void z-[5000] flex items-center justify-center pointer-events-none"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-void z-[5000] flex items-center justify-center p-6 font-mono selection:bg-neon-cyan/30 overflow-y-auto">
      <div className="w-full max-w-3xl bg-void border border-neon-cyan/20 p-8 shadow-[0_0_50px_rgba(0,255,209,0.12)] relative overflow-hidden my-auto rounded-sm backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-neon-cyan/30 animate-pulse" />
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neon-cyan/10 flex items-center justify-center text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,255,209,0.2)]">
              <Shield size={24} className="animate-pulse" />
            </div>
            <div>
               <h1 className="text-[17px] font-head font-black text-white tracking-[0.4em] mb-0.5">SENTINEL X</h1>
               <p className="text-[8px] text-[#5A7FA8] tracking-[0.4em] font-black uppercase opacity-60">TACTICAL DISPATCH CONTROLLER v4</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[8px] bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan px-2.5 py-1 rounded font-bold">
              SECURITY_CLEARANCE_REQUIRED
            </span>
          </div>
        </div>

        {authStatus === 'authorizing' ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-6">
            <div className="w-12 h-12 rounded-full border-2 border-t-neon-cyan border-neon-cyan/10 animate-spin" />
            <div className="space-y-2 text-center max-w-lg">
              <p className="text-neon-cyan text-xs font-bold tracking-wider animate-pulse uppercase">
                {authProgress}
              </p>
              <p className="text-[8.5px] text-[#5A7FA8] uppercase tracking-widest opacity-60">
                Authorizing operator identities with distributed Multi-Authority cryptokeys.
              </p>
            </div>
          </div>
        ) : !logsFinished ? (
          <div className="py-6">
            <div 
              ref={containerRef}
              className="h-64 overflow-y-auto space-y-2 custom-scrollbar pr-4 text-[11px]"
            >
              {logs.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex gap-4"
                >
                  <span className="text-[#5A7FA8] opacity-40">[{i.toString().padStart(2, '0')}]</span>
                  <span className={cn(
                    "font-bold",
                    log?.includes('SUCCESS') || log?.includes('OK') ? 'text-neon-green' : 
                    log?.includes('INITIALIZING') ? 'text-neon-cyan' : 'text-white'
                  )}>
                    {log}
                  </span>
                </motion.div>
              ))}
              <div className="flex gap-4">
                 <span className="text-[#5A7FA8] opacity-40">[{logs.length.toString().padStart(2, '0')}]</span>
                 <div className="w-2 h-4 bg-neon-cyan animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Identity Role Mapping */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database size={12} className="text-neon-cyan" />
                <span className="text-[10px] text-white font-bold tracking-widest uppercase">
                  Step 1: SELECT TACTICAL OPERATOR ROLE (RBAC POLICIES)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rolesList.map((role) => {
                  const IconComp = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id as any)}
                      className={cn(
                        "p-3 rounded text-left border flex gap-3 transition-all relative block w-full",
                        isSelected 
                          ? "bg-neon-cyan/5 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,255,209,0.08)]" 
                          : "bg-void border-border/20 text-text-secondary hover:border-border/50 hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded flex items-center justify-center border shrink-0",
                        isSelected ? "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan" : "bg-white/5 border-white/10 text-text-secondary"
                      )}>
                        <IconComp size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10.5px] font-bold block uppercase tracking-tight">{role.label}</span>
                        <span className="text-[8px] text-[rgba(255,255,255,0.45)] uppercase block mt-0.5 leading-tight">{role.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tenant Boundary Isolation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network size={12} className="text-neon-cyan" />
                <span className="text-[10px] text-white font-bold tracking-widest uppercase">
                  Step 2: INITIALIZE ENTERPRISE CLIENT WORKSPACE (MULTI-TENANCY)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {tenantsList.map((tenant) => {
                  const isSelected = selectedTenant === tenant.id;
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => setSelectedTenant(tenant.id as any)}
                      className={cn(
                        "p-3 rounded text-left border flex flex-col transition-all relative block w-full",
                        isSelected 
                          ? "bg-neon-cyan/5 border-neon-cyan text-white shadow-[0_0_12px_rgba(0,255,209,0.06)]" 
                          : "bg-void border-border/20 text-text-secondary hover:border-border/40 hover:bg-white/5"
                      )}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-tight">{tenant.label}</span>
                      </div>
                      <span className="text-[8px] text-[#5A7FA8] font-mono block">ID: {tenant.tenantId}</span>
                      <span className="text-[8px] text-[#5A7FA8] font-mono block mt-0.5">SUBNET: {tenant.subnet}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dispatch Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAuthorize}
                className="w-full py-3.5 bg-neon-cyan text-void font-bold text-[11px] tracking-[0.25em] font-head uppercase hover:bg-white hover:text-void transition-all duration-300 shadow-[0_0_20px_rgba(0,255,209,0.35)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] block cursor-pointer text-center relative overflow-hidden border border-neon-cyan"
              >
                AUTHORIZE SECURE GRID DEPLOYMENT
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex justify-between items-end mt-10 pt-4 border-t border-border/10">
           <div className="space-y-1">
             <div className="flex gap-2">
                <div className="w-1 h-1 bg-neon-cyan/20" />
                <div className="w-1 h-1 bg-neon-cyan/40" />
                <div className="w-1 h-1 bg-neon-cyan/60" />
             </div>
             <p className="text-[7.5px] text-[#5A7FA8] font-black uppercase tracking-widest opacity-40">
               AUTHORIZED PERSONNEL ONLY // ZERO-TRUST STRICT ENFORCEMENT
             </p>
           </div>
           
           <div className="grid grid-cols-3 gap-8 text-[8px] text-[#5A7FA8] font-bold">
              {[
                { icon: Cpu, label: 'CORE' },
                { icon: Network, label: 'MESH' },
                { icon: Zap, label: 'LINK' }
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1 opacity-25">
                  <item.icon size={11} className="text-neon-cyan" />
                  <span className="text-[7.5px] font-black text-white">{item.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
