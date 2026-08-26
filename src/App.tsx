import React, { useState } from 'react';
import { GameMode, GameSettings } from './types';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { AuthProvider } from './context/AuthContext.tsx';

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [selectedShipId, setSelectedShipId] = useState<string>('VIPER');
  const [selectedMode, setSelectedMode] = useState<GameMode>('ENDLESS');

  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.8,
    sfxVolume: 0.7,
    musicVolume: 0.4,
    screenShake: true,
    damageNumbers: true,
    bloomFX: true,
    autoAim: true,
    particleDensity: 'HIGH',
  });

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
      <main className={`w-full ${gameState === 'MENU' ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'} bg-slate-950 text-slate-100 font-sans select-none`}>
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
