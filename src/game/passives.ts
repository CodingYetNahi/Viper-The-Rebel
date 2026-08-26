import type { PassiveItem, PassiveType } from '../types.ts';

export const BASE_PASSIVES: Record<PassiveType, Omit<PassiveItem, 'level'>> = {
  MAX_HEALTH: {
    id: 'MAX_HEALTH',
    name: 'Titanium Plating',
    maxLevel: 5,
    description: 'Increases Maximum Hull Integrity by +20% and repairs 25 HP.',
    icon: 'Shield',
    color: '#10b981', // Emerald
    statBonusPerLevel: 0.20,
  },
  SHIELD_REGEN: {
    id: 'SHIELD_REGEN',
    name: 'Nanite Matrix',
    maxLevel: 5,
    description: 'Accelerates Energy Shield recharge rate by +30%.',
    icon: 'Activity',
    color: '#06b6d4', // Cyan
    statBonusPerLevel: 0.30,
  },
  MOVE_SPEED: {
    id: 'MOVE_SPEED',
    name: 'Thruster Overclock',
    maxLevel: 5,
    description: 'Increases Ship Maneuvering Speed by +15%.',
    icon: 'Wind',
    color: '#3b82f6', // Blue
    statBonusPerLevel: 0.15,
  },
  ATTACK_SPEED: {
    id: 'ATTACK_SPEED',
    name: 'Rapid Reloader',
    maxLevel: 5,
    description: 'Increases Fire Rate and Weapon cooldown recovery by +15%.',
    icon: 'Gauge',
    color: '#eab308', // Yellow
    statBonusPerLevel: 0.15,
  },
  DAMAGE: {
    id: 'DAMAGE',
    name: 'Plasma Amp',
    maxLevel: 5,
    description: 'Increases all Weapon Damage output by +18%.',
    icon: 'Zap',
    color: '#f97316', // Orange
    statBonusPerLevel: 0.18,
  },
  MAGNET_RADIUS: {
    id: 'MAGNET_RADIUS',
    name: 'Graviton Collector',
    maxLevel: 5,
    description: 'Expands Energy Crystal and pickup attraction radius by +40%.',
    icon: 'Compass',
    color: '#8b5cf6', // Violet
    statBonusPerLevel: 0.40,
  },
  CRIT_RATE: {
    id: 'CRIT_RATE',
    name: 'Targeting Core',
    maxLevel: 5,
    description: 'Increases Critical Hit Chance by +8% and Crit Damage by +30%.',
    icon: 'Target',
    color: '#ec4899', // Pink
    statBonusPerLevel: 0.08,
  },
  DASH_COOLDOWN: {
    id: 'DASH_COOLDOWN',
    name: 'Warp Capacitor',
    maxLevel: 5,
    description: 'Reduces Dash Cooldown by 20% and extends invulnerability.',
    icon: 'ZapFast',
    color: '#14b8a6', // Teal
    statBonusPerLevel: 0.20,
  }
};

export function createPassive(type: PassiveType): PassiveItem {
  return {
    ...BASE_PASSIVES[type],
    level: 1,
  };
}
