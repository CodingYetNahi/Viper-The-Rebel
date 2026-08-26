import React from 'react';
import { Play, RotateCcw, Home, Volume2, Shield } from 'lucide-react';
import { GameSettings, PlayerStats } from '../types';
import { SoundSettings } from './SoundSettings';

interface PauseModalProps {
  stats: PlayerStats;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  settings,
  onUpdateSettings,
  onResume,
  onRestart,
  onExit,
}) => {
  return (
    <div id="pause-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-950/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-200">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-wider text-cyan-400">TACTICAL PAUSE</h2>
          <p className="text-xs text-slate-400">Combat paused. Review operational status or adjust audio.</p>
        </div>

        {/* Current status stats grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center text-xs">
          <div>
            <span className="block text-slate-400 text-[10px]">CURRENT LEVEL</span>
            <span className="text-base font-bold text-cyan-300 font-mono">{stats.level}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">TOTAL KILLS</span>
            <span className="text-base font-bold text-emerald-300 font-mono">{stats.kills}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">SCORE</span>
            <span className="text-base font-bold text-amber-300 font-mono">{stats.score.toLocaleString()}</span>
          </div>
        </div>

        {/* Audio controls */}
        <SoundSettings settings={settings} onUpdateSettings={onUpdateSettings} />

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            id="btn-pause-resume"
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-black" /> RESUME MISSION (ESC)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-pause-restart"
              onClick={onRestart}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESTART RUN
            </button>
            <button
              id="btn-pause-exit"
              onClick={onExit}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
