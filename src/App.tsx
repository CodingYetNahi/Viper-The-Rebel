import React, { useEffect, useState } from 'react';
import { GameMode, GameSettings } from './types';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { AuthProvider } from './context/AuthContext.tsx';
import { migrateLocalData } from './lib/storage';
import { STORAGE_KEYS } from './lib/storage';
import { isControlScheme } from './game/controls';

const defaultSettings: GameSettings = {difficulty:'ROOKIE',masterVolume:.8,sfxVolume:.7,musicVolume:.4,screenShake:true,damageNumbers:true,bloomFX:true,autoAim:true,particleDensity:'HIGH',controlScheme:'JOYSTICK'};
function loadSettings(): GameSettings {
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) ?? '{}'); return {...defaultSettings,...saved,autoAim:true,controlScheme:isControlScheme(saved.controlScheme)?saved.controlScheme:'JOYSTICK'}; } catch { return defaultSettings; }
}

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [selectedShipId, setSelectedShipId] = useState<string>('VIPER');
  const [selectedMode, setSelectedMode] = useState<GameMode>('ENDLESS');

  useEffect(() => { migrateLocalData(); }, []);

  const [settings, setSettingsState] = useState<GameSettings>(loadSettings);
  const setSettings = (next: GameSettings) => { const safe={...next,autoAim:true}; setSettingsState(safe); localStorage.setItem(STORAGE_KEYS.settings,JSON.stringify(safe)); };

  const handleStartGame = (shipId: string, mode: GameMode) => {
    setSelectedShipId(shipId);
    setSelectedMode(mode);
    setGameState('PLAYING');
  };

  const handleExitToMenu = () => {
    setGameState('MENU');
  };

  return (
    <AuthProvider>
      <main
        className={`w-full ${
          gameState === 'MENU'
            ? 'min-h-screen overflow-x-hidden'
            : 'h-[100dvh] overflow-hidden'
        } bg-slate-950 text-slate-100 font-sans select-none`}
      >
        {gameState === 'MENU' ? (
          <MainMenu
            onStartGame={handleStartGame}
            settings={settings}
            onUpdateSettings={setSettings}
          />
        ) : (
          <GameCanvas
            shipId={selectedShipId}
            gameMode={selectedMode}
            settings={settings}
            onUpdateSettings={setSettings}
            onExitToMenu={handleExitToMenu}
          />
        )}
      </main>
    </AuthProvider>
  );
}
