import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { GameSettings } from '../types';

interface SoundSettingsProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  compact?: boolean;
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ settings, onUpdateSettings, compact = false }) => {
  const toggleMute = () => {
    const newMaster = settings.masterVolume > 0 ? 0 : 0.8;
    const updated = { ...settings, masterVolume: newMaster };
    onUpdateSettings(updated);
    sound.setVolumes(updated.masterVolume, updated.sfxVolume, updated.musicVolume);
  };

  const handleVolumeChange = (key: keyof GameSettings, value: number) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    sound.setVolumes(updated.masterVolume, updated.sfxVolume, updated.musicVolume);
  };

  if (compact) {
    return (
      <button
        id="sound-toggle-compact"
        onClick={toggleMute}
        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors shadow-sm cursor-pointer"
        title={settings.masterVolume > 0 ? 'Mute Audio' : 'Unmute Audio'}
      >
        {settings.masterVolume > 0 ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
      </button>
    );
  }

  return (
    <div id="sound-settings-panel" className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-sm tracking-wide text-cyan-200">AUDIO CONTROLS</span>
        </div>
        <button
          id="sound-toggle-main"
          onClick={toggleMute}
          className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
        >
          {settings.masterVolume > 0 ? 'MUTE ALL' : 'UNMUTE ALL'}
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <div className="flex justify-between mb-1 text-slate-400 font-medium">
            <span>Master Volume</span>
            <span>{Math.round(settings.masterVolume * 100)}%</span>
          </div>
          <input
            id="slider-master-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.masterVolume}
            onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1 text-slate-400 font-medium">
            <span>SFX Volume</span>
            <span>{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
          <input
            id="slider-sfx-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.sfxVolume}
            onChange={(e) => handleVolumeChange('sfxVolume', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1 text-slate-400 font-medium">
            <span>Synth Music Volume</span>
            <span>{Math.round(settings.musicVolume * 100)}%</span>
          </div>
          <input
            id="slider-music-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={(e) => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};
