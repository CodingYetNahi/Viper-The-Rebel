import React from 'react';
import { PassiveItem, WeaponItem } from '../types';
import { Zap, Shield, Flame, Activity, Crosshair, Sparkles } from 'lucide-react';

interface WeaponHUDProps {
  weapons: WeaponItem[];
  passives: PassiveItem[];
}

export const WeaponHUD: React.FC<WeaponHUDProps> = ({ weapons, passives }) => {
  return (
    <div id="weapon-hud-panel" className="flex flex-col gap-2 pointer-events-none">
      {/* Weapons inventory row */}
      <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1.5 rounded-lg border border-slate-800/80 shadow-md">
        <span className="text-[10px] font-bold text-cyan-400 px-1 uppercase tracking-wider">WEAPONS</span>
        <div className="flex gap-1.5">
          {weapons.map((w) => (
            <div
              key={w.id}
              id={`hud-weapon-${w.id}`}
              className="relative w-9 h-9 rounded-md bg-slate-900/90 border flex items-center justify-center text-xs font-bold shadow-inner"
              style={{
                borderColor: w.isEvolved ? '#f59e0b' : w.color,
                boxShadow: w.isEvolved ? '0 0 10px rgba(245, 158, 11, 0.4)' : undefined,
              }}
              title={`${w.name} (Lvl ${w.level}) - ${w.description}`}
            >
              <span className="text-white text-xs font-mono">{w.name.slice(0, 2).toUpperCase()}</span>
              <span
                className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full border border-slate-900"
                style={{ backgroundColor: w.isEvolved ? '#f59e0b' : w.color, color: '#000' }}
              >
                {w.isEvolved ? '★' : w.level}
              </span>
            </div>
          ))}
          {/* Empty slots placeholders */}
          {Array.from({ length: Math.max(0, 4 - weapons.length) }).map((_, i) => (
            <div
              key={`empty-w-${i}`}
              className="w-9 h-9 rounded-md bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center text-slate-700 text-xs"
            >
              +
            </div>
          ))}
        </div>
      </div>

      {/* Passives inventory row */}
      {passives.length > 0 && (
        <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1.5 rounded-lg border border-slate-800/80 shadow-md">
          <span className="text-[10px] font-bold text-emerald-400 px-1 uppercase tracking-wider">MODULES</span>
          <div className="flex gap-1.5">
            {passives.map((p) => (
              <div
                key={p.id}
                id={`hud-passive-${p.id}`}
                className="relative w-8 h-8 rounded-md bg-slate-900/90 border border-emerald-500/50 flex items-center justify-center text-xs font-bold"
                title={`${p.name} (Lvl ${p.level}) - ${p.description}`}
              >
                <span className="text-emerald-300 text-[10px] font-mono">{p.name.slice(0, 2).toUpperCase()}</span>
                <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-emerald-500 text-black px-1 rounded-full border border-slate-900">
                  {p.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
