import React from 'react';
import { motion } from 'motion/react';
import { Sliders, Sun, Zap, Activity, Waves } from 'lucide-react';
import { VisualSettings } from '../viz/NetworkGraph';
import { cn } from '../../lib/utils';

interface Props {
  settings: VisualSettings;
  onChange: (settings: VisualSettings) => void;
}

export function VisualControlPanel({ settings, onChange }: Props) {
  const updateSetting = (key: keyof VisualSettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-background-dark/80 border border-border-primary rounded-lg p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4 border-b border-border-primary/30 pb-2">
        <Sliders className="w-3 h-3 text-accent-cyan" />
        <span className="text-[10px] font-heading font-black uppercase tracking-widest text-text-primary">Visual_Sync_Parameters</span>
      </div>

      <div className="space-y-4">
        <SettingSlider 
          label="Signal_Intensity" 
          icon={Zap} 
          value={settings.intensity} 
          min={0.5} 
          max={2} 
          step={0.1}
          onChange={(v) => updateSetting('intensity', v)} 
        />
        <SettingSlider 
          label="Temporal_Speed" 
          icon={Activity} 
          value={settings.speed} 
          min={0.2} 
          max={3} 
          step={0.1}
          onChange={(v) => updateSetting('speed', v)} 
        />
        <SettingSlider 
          label="Lumina_Glow" 
          icon={Sun} 
          value={settings.glow} 
          min={0} 
          max={2} 
          step={0.1}
          onChange={(v) => updateSetting('glow', v)} 
        />
        <SettingSlider 
          label="Heat_Opacity" 
          icon={Waves} 
          value={settings.heatmapOpacity} 
          min={0} 
          max={0.5} 
          step={0.01}
          onChange={(v) => updateSetting('heatmapOpacity', v)} 
        />
        <SettingSlider 
          label="Pulse_Frequency" 
          icon={Activity} 
          value={settings.pulseFrequency ?? 1} 
          min={0.1} 
          max={5} 
          step={0.1}
          onChange={(v) => updateSetting('pulseFrequency', v)} 
        />
        <SettingSlider 
          label="Collision_Radius" 
          icon={Sliders} 
          value={settings.collisionRadius ?? 25} 
          min={10} 
          max={100} 
          step={1}
          onChange={(v) => updateSetting('collisionRadius', v)} 
        />
        <SettingSlider 
          label="Graph_Force" 
          icon={Sliders} 
          value={settings.graphForce ?? -120} 
          min={-300} 
          max={-20} 
          step={5}
          onChange={(v) => updateSetting('graphForce', v)} 
        />
      </div>

      <div className="mt-4 pt-2 border-t border-border-primary/30">
        <div className="flex justify-between items-center opacity-40">
          <span className="text-[8px] uppercase tracking-tighter">Render_Engine</span>
          <span className="text-[8px] font-mono">D3_SVG_MOTION_V4</span>
        </div>
      </div>
    </div>
  );
}

function SettingSlider({ label, icon: Icon, value, min, max, step, onChange }: { label: string, icon: any, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 opacity-60">
          <Icon className="w-2.5 h-2.5" />
          <span className="text-[8px] uppercase font-bold tracking-widest leading-none">{label}</span>
        </div>
        <span className="text-[9px] font-mono text-accent-cyan">{value.toFixed(2)}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-background-light/20 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
      />
    </div>
  );
}
