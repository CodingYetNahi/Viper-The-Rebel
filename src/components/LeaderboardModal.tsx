import React, { useEffect, useState } from 'react';
import { Trophy, X, Loader2, Zap, Shield, Flame } from 'lucide-react';
import { useAuth, LeaderboardEntry } from '../context/AuthContext.tsx';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { getTopLeaderboard } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTopLeaderboard()
        .then((data) => {
          setEntries(data || []);
        })
        .catch((err) => {
          console.error('Failed to load leaderboard:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, getTopLeaderboard]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl p-6 overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2">
                Rebel Rankings
              </h2>
              <p className="text-xs text-slate-400 font-mono">Live telemetry from Firestore</p>
            </div>
          </div>
          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-cyan-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs tracking-widest uppercase font-mono">Querying Sector Telemetry...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono">
              <p className="text-sm">No mission records submitted yet.</p>
              <p className="text-xs text-slate-500 mt-1">Engage a mission and be the first to claim the top rank!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const isTop3 = idx < 3;
                const rankColor = idx === 0 
                  ? 'text-amber-400 border-amber-500/40 bg-amber-500/5' 
                  : idx === 1 
                  ? 'text-slate-300 border-slate-400/40 bg-slate-400/5' 
                  : idx === 2 
                  ? 'text-amber-600 border-amber-700/40 bg-amber-700/5' 
                  : 'text-slate-400 border-slate-800 bg-slate-950/60';

                return (
                  <div
                    key={entry.id || idx}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${rankColor}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 flex items-center justify-center rounded font-bold font-mono text-sm ${isTop3 ? 'bg-white/10' : 'bg-slate-800'}`}>
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate text-sm flex items-center gap-2">
                          <span>{entry.pilotName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                            {entry.shipId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-bold text-emerald-300">
                            {entry.difficulty || 'LEGACY'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-cyan-400" /> Wave {entry.wave}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-400" /> {entry.kills} Kills
                          </span>
                          <span>{Math.floor(entry.timeSurvived)}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-3">
                      <div className="text-base font-bold text-cyan-300 font-mono tracking-wide">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase text-slate-500 font-mono">{entry.gameMode}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1 text-cyan-400/80">
            <Zap className="w-3.5 h-3.5" /> Synchronized with Firebase Firestore
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
