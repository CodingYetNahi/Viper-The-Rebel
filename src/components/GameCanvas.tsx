import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameMode, GameSettings, PlayerStats, UpgradeOption } from '../types';
import { WeaponHUD } from './WeaponHUD';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { SoundSettings } from './SoundSettings';
import { STORAGE_KEYS } from '../lib/storage';
import { Pause, Play, Heart, Shield, Zap, Skull, Trophy, Clock, Target, AlertTriangle } from 'lucide-react';
import { movementFromDrag, releasedMovement } from '../game/controls';

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
  const [upgradeQueue, setUpgradeQueue] = useState<UpgradeOption[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOverData, setGameOverData] = useState<{ won: boolean; finalStats: PlayerStats } | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(() => localStorage.getItem(STORAGE_KEYS.tutorial)==='1' ? null : 0);
  const [bossWarning, setBossWarning] = useState<string | null>(null);

  // Virtual Joystick State for touch/mobile
  const touchStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
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
      onLevelUp: (_level, upgrade) => {
        setUpgradeQueue(queue => [...queue, upgrade]);
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

    engine.settings = { ...settings, autoAim: true };
    engineRef.current = engine;
    engine.initGame(shipId, gameMode, settings.difficulty);
    if (tutorialStep !== null) engine.pause();

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
        if (engineRef.current && !gameOverData) {
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
      engineRef.current.settings = { ...settings, autoAim: true };
    }
  }, [settings]);

  useEffect(() => { engineRef.current?.clearMovementInput(); touchStartRef.current=null; setTouchPos(null); }, [settings.controlScheme]);

  useEffect(() => {
    if (!upgradeQueue.length) return;
    const timer = window.setTimeout(() => setUpgradeQueue(queue => queue.slice(1)), 2500);
    return () => window.clearTimeout(timer);
  }, [upgradeQueue]);

  const handlePauseResume = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setIsPaused(false);
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    setIsPaused(false);
    setUpgradeQueue([]);
    setGameOverData(null);
    engineRef.current.initGame(shipId, gameMode, settings.difficulty);
  };

  useEffect(() => {
    const hidden = () => { if (document.hidden && engineRef.current?.isRunning) { engineRef.current.pause(); setIsPaused(true); } };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, []);

  const finishTutorial = () => { localStorage.setItem(STORAGE_KEYS.tutorial,'1'); setTutorialStep(null); engineRef.current?.resume(); };
  const tutorial = [
    `Movement practice: use ${settings.controlScheme === 'JOYSTICK' ? 'the fixed lower-left joystick' : 'Touch Steering by dragging on the play area'}; desktop pilots use WASD or arrow keys.`,
    'Targeting demonstration: weapons aim and fire automatically when a safe target is in range.',
    'Collect the glowing energy drop to build XP.',
    'Boosters are awarded automatically and appear as a queued notification.',
    'Difficulty rises with time and level. Pause whenever needed; keep moving, rebuild shields, and survive!',
  ];

  // Touch Joystick Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    const touch = e.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
    setTouchPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !engineRef.current) return;
    e.preventDefault(); e.stopPropagation();
    let touch: React.Touch | null = null;
    for (let i=0;i<e.touches.length;i++) if (e.touches[i].identifier===touchStartRef.current?.id) touch=e.touches[i];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const vector = movementFromDrag(dx,dy);
    const clampedDist = Math.min(Math.hypot(dx,dy),50); const angle=Math.atan2(dy,dx);
    engineRef.current.joystickVector = vector;
    setTouchPos({
      x: touchStartRef.current.x + Math.cos(angle) * clampedDist,
      y: touchStartRef.current.y + Math.sin(angle) * clampedDist,
    });
  };

  const handleTouchEnd = (e?: React.TouchEvent) => {
    if (e && touchStartRef.current) { let ended=false; for(let i=0;i<e.changedTouches.length;i++) ended ||= e.changedTouches[i].identifier===touchStartRef.current.id; if(!ended)return; }
    touchStartRef.current = null;
    setTouchPos(null);
    if (engineRef.current) {
      engineRef.current.joystickVector = releasedMovement();
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
      className="gameplay-surface relative w-full h-[100dvh] overflow-hidden bg-slate-950 select-none touch-none"
    >
      {/* Primary HTML5 Canvas */}
      <canvas ref={canvasRef} id="main-combat-canvas" className="w-full h-full block" onTouchStart={settings.controlScheme==='TOUCH'?handleTouchStart:undefined} onTouchMove={settings.controlScheme==='TOUCH'?handleTouchMove:undefined} onTouchEnd={settings.controlScheme==='TOUCH'?handleTouchEnd:undefined} onTouchCancel={settings.controlScheme==='TOUCH'?handleTouchEnd:undefined} />

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

      {settings.controlScheme==='JOYSTICK' && <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] z-20 sm:hidden touch-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd} aria-label="Movement joystick">
        <div className="relative w-28 h-28 rounded-full border-2 border-emerald-300/70 bg-graphite-950/70 bg-slate-900/70 shadow-[0_0_24px_rgba(34,197,94,.22)]"><div className="absolute w-12 h-12 rounded-full bg-emerald-400 border-2 border-emerald-100" style={{left:`${32+(engineRef.current?.joystickVector.x||0)*32}px`,top:`${32+(engineRef.current?.joystickVector.y||0)*32}px`}} /></div>
      </div>}

      {upgradeQueue[0] && tutorialStep === null && <div className="absolute top-32 right-3 z-30 max-w-[18rem] pointer-events-none rounded-xl border border-emerald-400/70 bg-slate-950/95 px-4 py-3 shadow-xl" role="status" aria-live="polite"><div className="text-[10px] font-black tracking-widest text-emerald-300">UPGRADE ACQUIRED</div><div className="mt-1 flex gap-3"><span className="text-xs font-bold text-emerald-200" aria-label={`${upgradeQueue[0].icon} icon`}>{upgradeQueue[0].icon}</span><div><div className="font-bold text-white">{upgradeQueue[0].title}</div><div className="text-xs text-cyan-200">{upgradeQueue[0].statChange || upgradeQueue[0].description}</div></div></div></div>}

      {tutorialStep !== null && <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/80 p-6" role="dialog" aria-modal="true" aria-label="First play guided practice"><div className="max-w-sm rounded-2xl border border-emerald-400 bg-slate-900 p-6 text-center shadow-2xl"><div className="text-xs font-mono text-emerald-300">GUIDED PRACTICE {tutorialStep+1} / {tutorial.length}</div><p className="my-5 text-xl font-bold">{tutorial[tutorialStep]}</p><p className="mb-4 text-xs text-slate-400">Combat and the normal spawn schedule stay paused while you learn.</p><div className="flex gap-3"><button className="min-h-11 flex-1 rounded-lg border border-slate-600" onClick={finishTutorial}>Skip</button><button className="min-h-11 flex-1 rounded-lg bg-emerald-400 font-black text-slate-950" onClick={() => tutorialStep===tutorial.length-1?finishTutorial():setTutorialStep(step => (step ?? 0)+1)}>{tutorialStep===tutorial.length-1?'Start mission':'Next'}</button></div></div></div>}

      {/* Modal Dialogs */}
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
