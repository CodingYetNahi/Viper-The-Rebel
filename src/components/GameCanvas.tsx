import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameMode, GameSettings, PlayerStats, UpgradeOption } from '../types';
import { generateUpgradeOptions } from '../game/upgrades';
import { WeaponHUD } from './WeaponHUD';
import { LevelUpModal } from './LevelUpModal';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { SoundSettings } from './SoundSettings';
import { Pause, Play, Heart, Shield, Zap, Skull, Trophy, Clock, Target, AlertTriangle } from 'lucide-react';

interface GameCanvasProps {
  shipId: string;
  gameMode: GameMode;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onExitToMenu: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  shipId,
  gameMode,
  settings,
  onUpdateSettings,
  onExitToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [gameTime, setGameTime] = useState<number>(0);
  const [levelUpOptions, setLevelUpOptions] = useState<UpgradeOption[] | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOverData, setGameOverData] = useState<{ won: boolean; finalStats: PlayerStats } | null>(null);
  const [bossWarning, setBossWarning] = useState<string | null>(null);

  // Virtual Joystick State for touch/mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Set canvas dimensions to parent container
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    canvas.width = width;
    canvas.height = height;

    const engine = new GameEngine(canvas, {
      onLevelUp: (level) => {
        if (!engineRef.current) return;
        const options = generateUpgradeOptions(
          engineRef.current.weapons,
          engineRef.current.passives,
          3
        );
        setLevelUpOptions(options);
      },
      onGameOver: (finalStats, won) => {
        setGameOverData({ won, finalStats });
      },
      onBossSpawn: (bossName) => {
        setBossWarning(bossName);
        setTimeout(() => setBossWarning(null), 4000);
      },
      onStatsUpdate: (updatedStats) => {
        setStats({ ...updatedStats });
        if (engineRef.current) {
          setGameTime(engineRef.current.gameTime);
        }
      },
    });

    engine.settings = { ...settings };
    engineRef.current = engine;
    engine.initGame(shipId, gameMode);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || container.clientWidth || window.innerWidth;
        const h = entry.contentRect.height || container.clientHeight || window.innerHeight;
        if (w > 0 && h > 0 && canvasRef.current) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    });
    resizeObserver.observe(container);

    // Global Key Listener for Pause
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (engineRef.current && !levelUpOptions && !gameOverData) {
          if (engineRef.current.isPaused) {
            engineRef.current.resume();
            setIsPaused(false);
          } else {
            engineRef.current.pause();
            setIsPaused(true);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resizeObserver.disconnect();
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [shipId, gameMode]);

  // Sync settings updates to active engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.settings = { ...settings };
    }
  }, [settings]);

  const handleSelectUpgrade = (option: UpgradeOption) => {
    if (!engineRef.current) return;
    engineRef.current.applyUpgrade(option.id, option.targetId);
    setLevelUpOptions(null);
  };

  const handlePauseResume = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setIsPaused(false);
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    setIsPaused(false);
    setLevelUpOptions(null);
    setGameOverData(null);
    engineRef.current.initGame(shipId, gameMode);
  };

  // Touch Joystick Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !engineRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const maxRadius = 50;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const nx = (clampedDist / maxRadius) * Math.cos(angle);
    const ny = (clampedDist / maxRadius) * Math.sin(angle);

    engineRef.current.joystickVector = { x: nx, y: ny };
    setTouchPos({
      x: touchStartRef.current.x + Math.cos(angle) * clampedDist,
      y: touchStartRef.current.y + Math.sin(angle) * clampedDist,
    });
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTouchPos(null);
    if (engineRef.current) {
      engineRef.current.joystickVector = { x: 0, y: 0 };
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="relative w-full h-screen overflow-hidden bg-slate-950 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Primary HTML5 Canvas */}
      <canvas ref={canvasRef} id="main-combat-canvas" className="w-full h-full block cursor-crosshair" />

      {/* Top Combat HUD Overlay */}
      {stats && (
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 pointer-events-none flex flex-col gap-2 z-20">
          <div className="flex items-start justify-between gap-4">
            {/* Health & Shield bars */}
            <div className="flex flex-col gap-1.5 w-48 sm:w-64 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-lg">
              {/* Shield Bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-cyan-300">
                  <span className="flex items-center gap-1 font-bold"><Shield className="w-3 h-3" /> SHIELD</span>
                  <span>{Math.round(stats.shield)} / {stats.maxShield}</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, (stats.shield / stats.maxShield) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Hull Health Bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-red-400">
                  <span className="flex items-center gap-1 font-bold"><Heart className="w-3 h-3" /> HULL</span>
                  <span>{Math.round(stats.health)} / {stats.maxHealth}</span>
                </div>
                <div className="w-full h-2.5 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timer, Score & Kills Center Cluster */}
            <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono shadow-lg">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">{formatTime(gameTime)}</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <Skull className="w-4 h-4 text-red-400" />
                <span className="font-bold text-sm text-white">{stats.kills}</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="font-bold text-sm">{stats.score.toLocaleString()}</span>
              </div>
            </div>

            {/* Top Right Controls & Sound */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <SoundSettings settings={settings} onUpdateSettings={onUpdateSettings} compact />
              <button
                id="btn-hud-pause"
                onClick={() => {
                  if (engineRef.current) {
                    engineRef.current.pause();
                    setIsPaused(true);
                  }
                }}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors shadow-sm cursor-pointer"
                title="Pause Game (Esc)"
              >
                <Pause className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Level Progress Bar (Full Width Top) */}
          <div className="space-y-0.5 bg-slate-950/80 backdrop-blur-md p-1.5 px-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span className="font-bold text-cyan-400">LEVEL {stats.level}</span>
              <span>XP: {stats.xp} / {stats.nextLevelXp}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-400 transition-all duration-100"
                style={{ width: `${Math.max(0, Math.min(100, (stats.xp / stats.nextLevelXp) * 100))}%` }}
              />
            </div>
          </div>

          {/* Combo Multiplier indicator */}
          {stats.combo > 1 && (
            <div className="self-center inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-xs font-black font-mono animate-pulse shadow-md">
              <Zap className="w-3.5 h-3.5 fill-amber-400" /> COMBO x{stats.combo}
            </div>
          )}
        </div>
      )}

      {/* Active Weapon Inventory HUD (Bottom Left) */}
      {engineRef.current && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:block">
          <WeaponHUD
            weapons={engineRef.current.weapons}
            passives={engineRef.current.passives}
          />
        </div>
      )}

      {/* Boss Incoming Warning Banner */}
      {bossWarning && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="px-6 py-2 rounded-xl bg-red-600/90 border-2 border-red-400 text-white font-black font-mono tracking-widest text-sm sm:text-base flex items-center gap-2 shadow-2xl shadow-red-900/80">
            <AlertTriangle className="w-5 h-5 animate-pulse" /> WARNING: {bossWarning} DETECTED
          </div>
        </div>
      )}

      {/* Mobile Touch Controls & Dash Button (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-20 flex gap-3 pointer-events-auto sm:hidden">
        <button
          id="btn-mobile-dash"
          onClick={() => engineRef.current?.triggerDash()}
          className="w-16 h-16 rounded-full bg-cyan-500/80 border-2 border-cyan-300 text-black font-black text-xs flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Zap className="w-5 h-5 fill-black" />
          <span>DASH</span>
        </button>
      </div>

      {/* Modal Dialogs */}
      {levelUpOptions && (
        <LevelUpModal
          level={stats?.level || 2}
          options={levelUpOptions}
          onSelectOption={handleSelectUpgrade}
        />
      )}

      {isPaused && stats && (
        <PauseModal
          stats={stats}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onResume={handlePauseResume}
          onRestart={handleRestart}
          onExit={onExitToMenu}
        />
      )}

      {gameOverData && (
        <GameOverModal
          stats={gameOverData.finalStats}
          won={gameOverData.won}
          gameTime={gameTime}
          shipId={shipId}
          gameMode={gameMode}
          onRestart={handleRestart}
          onExit={onExitToMenu}
        />
      )}
    </div>
  );
};
