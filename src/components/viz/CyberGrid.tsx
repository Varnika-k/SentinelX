import React, { useMemo } from 'react';

interface CyberGridProps {
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  activeWorkspace?: string;
}

export function CyberGrid({ 
  threatLevel = 'low', 
  activeWorkspace = 'operations' 
}: CyberGridProps) {
  // Balanced tactical dot-matrix colors to represent active security profile
  const dotColor = useMemo(() => {
    if (threatLevel === 'critical') return 'rgba(239, 68, 68, 0.05)';
    if (threatLevel === 'high') return 'rgba(245, 158, 11, 0.04)';
    if (activeWorkspace === 'defense') return 'rgba(16, 185, 129, 0.04)';
    if (activeWorkspace === 'forensics') return 'rgba(217, 119, 6, 0.04)';
    return 'rgba(0, 242, 255, 0.035)'; // Crisp, premium, ultra-subtle locator markers
  }, [threatLevel, activeWorkspace]);

  const atmosphericGlow = useMemo(() => {
    if (threatLevel === 'critical') return 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.015) 0%, transparent 70%)';
    if (threatLevel === 'high') return 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.01) 0%, transparent 70%)';
    if (activeWorkspace === 'defense') return 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.012) 0%, transparent 70%)';
    if (activeWorkspace === 'forensics') return 'radial-gradient(circle at 50% 50%, rgba(217, 119, 6, 0.01) 0%, transparent 70%)';
    return 'radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.008) 0%, transparent 70%)';
  }, [threatLevel, activeWorkspace]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Matte Background Layer with Subtle Operational Gradient Depth */}
      <div className="absolute inset-0 bg-void" />
      <div className="absolute inset-0 bg-gradient-to-tr from-void via-[#060a12]/80 to-[#03060a]/90" />

      {/* Atmospheric Volumetric Tactical Fog - static, premium depth, zero animations / flickering */}
      <div 
        className="absolute inset-0 opacity-[0.22] transition-all duration-[1000ms]"
        style={{
          background: atmosphericGlow
        }}
      />

      {/* Premium Tactical Dot-Matrix - replacing visual linear grids to eliminate horizontal layout streaking */}
      <div 
        className="absolute inset-0 transition-all duration-[1000ms]"
        style={{
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 95%)'
        }}
      />

      {/* Atmospheric Vignette prioritizing graph contrast by framing the boundaries */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,_var(--color-void)_90%)] opacity-85" />
    </div>
  );
}
