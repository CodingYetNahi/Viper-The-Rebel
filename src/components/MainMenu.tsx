import React, { useState } from 'react';
import { GameMode, GameSettings } from '../types';
import { SHIPS } from '../game/ships';
import { SoundSettings } from './SoundSettings';
import { LeaderboardModal } from './LeaderboardModal.tsx';
import { Play, Shield, Flame, Crosshair, Award, HelpCircle, Volume2, Sparkles, Trophy, LogIn, LogOut, User as UserIcon, Coins, Loader2 } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { useAuth } from '../context/AuthContext.tsx';

interface MainMenuProps {
  onStartGame: (shipId: string, mode: GameMode) => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, settings, onUpdateSettings }) => {
  const { user, pilotProfile, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [selectedShipId, setSelectedShipId] = useState<string>('VIPER');
  const [selectedMode, setSelectedMode] = useState<GameMode>('ENDLESS');
  const [activeTab, setActiveTab] = useState<'PLAY' | 'HOW_TO_PLAY' | 'AUDIO'>('PLAY');
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  const selectedShip = SHIPS[selectedShipId] || SHIPS.VIPER;

  // Retrieve Local or Cloud Best High Score
  const localBestScore = parseInt(localStorage.getItem('neon_void_best_score') || '0', 10);
  const displayBestScore = Math.max(localBestScore, pilotProfile?.highScore || 0);

  const handleLaunch = () => {
    sound.playPowerup();
    onStartGame(selectedShipId, selectedMode);
  };

  return (
    <div id="main-menu-container" className="relative min-h-screen w-full flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 py-8 sm:py-12 bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Background Cyber Grid effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
            linear-gradient(to right, #1e293b 1px, transparent 1px),
            linear-gradient(to bottom, #1e293b 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl space-y-6">
        {/* Top Pilot Bar with Firebase Auth & Leaderboard Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Pilot'}
                    className="w-9 h-9 rounded-xl border border-cyan-400/60 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white tracking-wide">
                      {pilotProfile?.displayName || user.displayName || 'Vanguard Pilot'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      CLOUD SYNCED
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Coins className="w-3 h-3" /> {pilotProfile?.credits || 0} Credits
                    </span>
                    <span>{pilotProfile?.totalKills || 0} Kills</span>
                    <span>Wave {pilotProfile?.highestWave || 0} Max</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-300">Guest Pilot</div>
                  <div className="text-[11px] text-slate-500">Sign in to save records to Firestore</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-leaderboard"
              onClick={() => setShowLeaderboard(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" /> RANKINGS
            </button>

            {authLoading ? (
              <div className="p-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : user ? (
              <button
                id="btn-auth-signout"
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-auth-signin"
                onClick={signInWithGoogle}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" /> GOOGLE SIGN IN
              </button>
            )}
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> ARCADE SURVIVOR ROGUELITE
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 drop-shadow-sm">
            NEON VOID
          </h1>
          <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
            Maneuver through robotic swarms, level up adaptive energy weapons, trigger powerful evolutions, and survive the arena.
          </p>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center justify-center gap-2 border-b border-slate-800 pb-3">
          <button
            id="tab-play"
            onClick={() => setActiveTab('PLAY')}
            className={`px-5 py-2 rounded-lg font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'PLAY'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> MISSION LAUNCH
          </button>
          <button
            id="tab-how-to-play"
            onClick={() => setActiveTab('HOW_TO_PLAY')}
            className={`px-5 py-2 rounded-lg font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'HOW_TO_PLAY'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> PROTOCOLS & CONTROLS
          </button>
          <button
            id="tab-audio"
            onClick={() => setActiveTab('AUDIO')}
            className={`px-5 py-2 rounded-lg font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'AUDIO'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" /> AUDIO & SETTINGS
          </button>
        </div>

        {/* Tab 1: PLAY / SHIP SELECTION */}
        {activeTab === 'PLAY' && (
          <div className="space-y-6">
            {/* Ship Selection Cards */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-400 tracking-wider">SELECT COMBAT CHASSIS</span>
                {displayBestScore > 0 && (
                  <span className="text-xs text-amber-400 font-mono flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> RECORD: {displayBestScore.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.values(SHIPS).map((ship) => {
                  const isSelected = ship.id === selectedShipId;
                  return (
                    <button
                      key={ship.id}
                      id={`ship-card-${ship.id}`}
                      onClick={() => setSelectedShipId(ship.id)}
                      className={`p-4 rounded-xl text-left border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white" style={{ color: isSelected ? ship.color : undefined }}>
                            {ship.name}
                          </span>
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ship.color }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 leading-snug">{ship.description}</p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>HULL / SHIELD</span>
                          <span className="text-slate-200">{ship.baseHealth} / {ship.baseShield}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>SPEED</span>
                          <span className="text-slate-200">{ship.speed}</span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-sans mt-1">
                          ★ {ship.passiveDescription}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider block mb-2 px-1">SELECT MISSION PROTOCOL</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  id="mode-endless"
                  onClick={() => setSelectedMode('ENDLESS')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedMode === 'ENDLESS'
                      ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-500/30 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-cyan-300 mb-1">ENDLESS SURVIVAL</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Continuous scaling enemy onslaught. Maximize high score.</p>
                </button>

                <button
                  id="mode-blitz"
                  onClick={() => setSelectedMode('BLITZ')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedMode === 'BLITZ'
                      ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-500/30 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-300 mb-1">5-MINUTE BLITZ</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">High-density spawn rate. Survive 300 seconds for tactical victory.</p>
                </button>

                <button
                  id="mode-boss-rush"
                  onClick={() => setSelectedMode('BOSS_RUSH')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedMode === 'BOSS_RUSH'
                      ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-500/30 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-purple-300 mb-1">BOSS RUSH</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Start at Level 5 with heavy dreadnoughts and leviathan titans.</p>
                </button>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                id="btn-launch-mission"
                onClick={handleLaunch}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-base tracking-wider uppercase flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-cyan-500/25 transition-all transform active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-slate-950" /> ENGAGE ARENA ({selectedShip.name})
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: HOW TO PLAY */}
        {activeTab === 'HOW_TO_PLAY' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6 text-sm text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Crosshair className="w-4 h-4" /> PILOT FLIGHT CONTROLS
                </h3>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-200 font-mono">WASD / Arrow Keys</span>
                    <span>Directional Thrusters</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-200 font-mono">Space / Shift</span>
                    <span>Tactical Dash (Invulnerability)</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-200 font-mono">Mouse / Auto-Aim</span>
                    <span>Targeting System</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-200 font-mono">Esc / P</span>
                    <span>Tactical Pause & Audio</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> WEAPON EVOLUTIONS
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upgrade weapons to Max Level (Lvl 5) to unlock glowing <span className="text-amber-300 font-bold">EVOLUTIONS</span> with overwhelming firepower:
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div>• <strong className="text-cyan-300">Hyper Blaster</strong>: Quad gatling stream with extreme velocity</div>
                  <div>• <strong className="text-emerald-300">Singularity Orbiters</strong>: Expanding gravitational shield</div>
                  <div>• <strong className="text-purple-300">Tesla Tempest</strong>: Chain lightning shocks up to 8 targets</div>
                  <div>• <strong className="text-red-300">Antimatter Missiles</strong>: Massive cluster splash explosions</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={() => setActiveTab('PLAY')}
                className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer transition-colors"
              >
                RETURN TO LAUNCH BAY
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: AUDIO & SETTINGS */}
        {activeTab === 'AUDIO' && (
          <div className="max-w-xl mx-auto space-y-4">
            <SoundSettings settings={settings} onUpdateSettings={onUpdateSettings} />
            <div className="text-center pt-2">
              <button
                onClick={() => setActiveTab('PLAY')}
                className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer transition-colors"
              >
                CONFIRM & RETURN
              </button>
            </div>
          </div>
        )}
      </div>

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
};
