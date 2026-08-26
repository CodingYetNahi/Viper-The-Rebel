import React, { useEffect, useState } from 'react';
import { PlayerStats, GameMode } from '../types';
import { Trophy, RotateCcw, Home, Skull, Award, Target, Zap, Clock, CloudCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { LeaderboardModal } from './LeaderboardModal.tsx';
import { STORAGE_KEYS } from '../lib/storage';

interface GameOverModalProps {
  stats: PlayerStats;
  won: boolean;
  gameTime: number;
  shipId?: string;
  gameMode?: GameMode;
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  won,
  gameTime,
  shipId = 'VIPER',
  gameMode = 'ENDLESS',
  onRestart,
  onExit,
}) => {
  const { user, authError, isSigningIn, recordRunStats, signInWithGoogle } = useAuth();
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Save High Score to localStorage and Firebase
  useEffect(() => {
    try {
      const storedBest = parseInt(localStorage.getItem(STORAGE_KEYS.bestScore) || '0', 10);
      if (stats.score > storedBest) {
        localStorage.setItem(STORAGE_KEYS.bestScore, stats.score.toString());
      }
    } catch {
      // ignore
    }

    if (user && !synced && !syncing) {
      setSyncing(true);
      recordRunStats({
        score: stats.score,
        wave: stats.wave || 1,
        kills: stats.kills,
        timeSurvived: gameTime,
        shipId,
        gameMode,
      })
        .then(() => {
          setSynced(true);
        })
        .catch((err) => {
          console.error('Failed to sync score to Firestore:', err);
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  }, [stats, gameTime, shipId, gameMode, user, synced, syncing, recordRunStats]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div id="game-over-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-lg bg-slate-950/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-200">
          {/* Banner */}
          <div className="text-center space-y-2">
            {won ? (
              <div className="inline-flex p-3 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 mb-1 animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>
            ) : (
              <div className="inline-flex p-3 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 mb-1">
                <Skull className="w-8 h-8" />
              </div>
            )}

            <h2 className={`text-3xl font-black tracking-wider ${won ? 'text-amber-400' : 'text-red-500'}`}>
              {won ? 'SECTOR CLEARED / VICTORY' : 'HULL BREACH / SIGNAL LOST'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {won ? 'Telemetry transmitted. Arena neutralized.' : 'All subsystems destroyed. Telemetry logged.'}
            </p>
          </div>

          {/* Combat Performance Summary */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-400" /> DEPLOYMENT STATISTICS
              </span>
              {user ? (
                synced ? (
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <CloudCheck className="w-3.5 h-3.5" /> RECORDS SYNCED
                  </span>
                ) : syncing ? (
                  <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> SYNCING...
                  </span>
                ) : null
              ) : (
                <button
                  onClick={signInWithGoogle}
                  disabled={isSigningIn}
                  aria-busy={isSigningIn}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed font-mono underline cursor-pointer"
                >
                  {isSigningIn ? 'Signing in...' : 'Sign in to save score'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <Clock className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">TIME SURVIVED</span>
                  <span className="font-mono font-bold text-white text-sm">{formatTime(gameTime)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <Target className="w-4 h-4 text-red-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL KILLS</span>
                  <span className="font-mono font-bold text-white text-sm">{stats.kills.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">MAX COMBO</span>
                  <span className="font-mono font-bold text-white text-sm">x{stats.maxCombo}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <Trophy className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">LEVEL REACHED</span>
                  <span className="font-mono font-bold text-white text-sm">Lvl {stats.level}</span>
                </div>
              </div>
            </div>

            {/* Final Score */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 px-1">
              <span className="text-slate-400 text-xs font-semibold">FINAL SCORE</span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">{stats.score.toLocaleString()}</span>
            </div>
          </div>

          {authError && <div role="alert" className="rounded-lg border border-red-500/50 bg-red-950/60 p-3 text-center text-sm text-red-100">{authError}</div>}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              id="btn-gameover-restart"
              onClick={onRestart}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN (SPACE)
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-view-leaderboard"
                onClick={() => setShowLeaderboard(true)}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" /> LEADERBOARD
              </button>
              <button
                id="btn-gameover-exit"
                onClick={onExit}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Home className="w-3.5 h-3.5" /> MAIN MENU
              </button>
            </div>
          </div>
        </div>
      </div>

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </>
  );
};
