import React, { useEffect } from 'react';
import { UpgradeOption } from '../types';
import { Sparkles, Zap, Shield, Flame, Activity, ArrowUpCircle } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface LevelUpModalProps {
  level: number;
  options: UpgradeOption[];
  onSelectOption: (option: UpgradeOption) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, options, onSelectOption }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && options[0]) onSelectOption(options[0]);
      if (e.key === '2' && options[1]) onSelectOption(options[1]);
      if (e.key === '3' && options[2]) onSelectOption(options[2]);
      if (e.key === '4' && options[3]) onSelectOption(options[3]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, onSelectOption]);

  const getRarityBadge = (rarity: UpgradeOption['rarity']) => {
    switch (rarity) {
      case 'EVOLUTION':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/60 animate-pulse">★ EVOLUTION</span>;
      case 'EPIC':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/50">EPIC</span>;
      case 'RARE':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50">RARE</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-300 font-medium border border-slate-600/40">COMMON</span>;
    }
  };

  const getBorderColor = (rarity: UpgradeOption['rarity']) => {
    switch (rarity) {
      case 'EVOLUTION':
        return 'border-amber-500/80 hover:border-amber-400 hover:shadow-amber-500/30';
      case 'EPIC':
        return 'border-purple-500/60 hover:border-purple-400 hover:shadow-purple-500/20';
      case 'RARE':
        return 'border-cyan-500/60 hover:border-cyan-400 hover:shadow-cyan-500/20';
      default:
        return 'border-slate-700/60 hover:border-slate-500 hover:shadow-cyan-500/10';
    }
  };

  return (
    <div id="level-up-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/50 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> SYSTEM UPGRADE AVAILABLE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            LEVEL <span className="text-cyan-400 font-mono">{level}</span> REACHED
          </h2>
          <p className="text-xs text-slate-400">Select an augment or weapon subsystem to integrate (Keys 1-3)</p>
        </div>

        {/* Options list */}
        <div className="grid grid-cols-1 gap-3.5">
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              id={`upgrade-option-${opt.id}`}
              onClick={() => onSelectOption(opt)}
              className={`group relative w-full text-left p-4 rounded-xl bg-slate-900/80 border ${getBorderColor(
                opt.rarity
              )} hover:bg-slate-850 hover:shadow-lg transition-all duration-150 cursor-pointer flex items-start gap-4`}
            >
              {/* Shortcut Key Badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400 transition-colors">
                {idx + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                    {opt.title}
                  </span>
                  {getRarityBadge(opt.rarity)}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{opt.description}</p>
              </div>

              {/* Right Arrow */}
              <div className="flex-shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors self-center">
                <ArrowUpCircle className="w-5 h-5 rotate-90" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
