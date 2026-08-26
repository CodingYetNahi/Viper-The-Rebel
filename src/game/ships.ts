import { ShipDefinition } from '../types';

export const SHIPS: Record<string, ShipDefinition> = {
  VIPER: {
    id: 'VIPER',
    name: 'Viper Mk-IV',
    codename: 'Interceptor',
    tagline: 'Hyper-Agile Hit & Run Skirmisher',
    description: 'Lightweight aerodynamic chassis with hyper-charged thrusters. Excels at kiting swarms with extreme speed and rapid dashes.',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.6)',
    baseHealth: 90,
    baseShield: 50,
    shieldRegen: 4,
    speed: 320,
    dashCooldown: 1.8,
    critChance: 0.12,
    critMultiplier: 1.8,
    startingWeaponId: 'PULSE_BLASTER',
    passiveDescription: '+25% Movement Speed and 40% faster Dash Cooldown.',
    perk: {
      type: 'SPEED',
      value: 1.25,
    }
  },
  TESLA: {
    id: 'TESLA',
    name: 'Tesla Vanguard',
    codename: 'Storm Archon',
    tagline: 'High-Voltage Area Denial',
    description: 'Experimental capacitor hull that conduits high-voltage electromagnetic surges into surrounding mechanical swarms.',
    color: '#a855f7', // Purple/Violet
    glowColor: 'rgba(168, 85, 247, 0.6)',
    baseHealth: 110,
    baseShield: 90,
    shieldRegen: 8,
    speed: 260,
    dashCooldown: 2.8,
    critChance: 0.15,
    critMultiplier: 2.0,
    startingWeaponId: 'CHAIN_ARC',
    passiveDescription: '+80% Faster Shield Regeneration & shockwave discharge on hit.',
    perk: {
      type: 'SHIELD',
      value: 1.8,
    }
  },
  COLOSSUS: {
    id: 'COLOSSUS',
    name: 'Colossus Titan',
    codename: 'Dreadnought',
    tagline: 'Heavy Armored Siege Fortress',
    description: 'Reinforced durasteel fortress hull built to withstand direct impacts and blast enemies back with kinetic shockwaves.',
    color: '#f59e0b', // Amber/Gold
    glowColor: 'rgba(245, 158, 11, 0.6)',
    baseHealth: 200,
    baseShield: 120,
    shieldRegen: 5,
    speed: 220,
    dashCooldown: 3.2,
    critChance: 0.08,
    critMultiplier: 1.6,
    startingWeaponId: 'PLASMA_ORBITER',
    passiveDescription: '+100% Max Hull HP & emits destructive kinetic shockwaves during Dashing.',
    perk: {
      type: 'SHOCKWAVE',
      value: 2.0,
    }
  },
  SPECTER: {
    id: 'SPECTER',
    name: 'Specter Phantom',
    codename: 'Ghost Sniper',
    tagline: 'Precision Quantum Assassin',
    description: 'Cloaked stealth craft fitted with quantum targeting matrices. Eliminates high-threat targets with devastating critical torpedoes.',
    color: '#ec4899', // Pink / Magenta
    glowColor: 'rgba(236, 72, 153, 0.6)',
    baseHealth: 80,
    baseShield: 40,
    shieldRegen: 3,
    speed: 280,
    dashCooldown: 2.2,
    critChance: 0.35,
    critMultiplier: 3.0,
    startingWeaponId: 'QUANTUM_TORPEDO',
    passiveDescription: '+35% Base Critical Chance and massive 300% Critical Damage output.',
    perk: {
      type: 'CRIT',
      value: 3.0,
    }
  }
};
