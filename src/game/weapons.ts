import { WeaponItem, WeaponType } from '../types';

export const BASE_WEAPONS: Record<WeaponType, Omit<WeaponItem, 'level' | 'isEvolved' | 'lastFired'>> = {
  PULSE_BLASTER: {
    id: 'PULSE_BLASTER',
    name: 'Pulse Blaster',
    evolvedName: 'Hyper Gatling',
    maxLevel: 5,
    evolutionRequirement: 'ATTACK_SPEED',
    description: 'Rapid-fire energetic plasma lasers directed towards target or nearest foe.',
    evolvedDescription: 'Double twin-barrel continuous laser stream with massive pierce and fire rate.',
    color: '#38bdf8', // Light blue
    icon: 'Crosshair',
    cooldown: 0.38,
    damage: 22,
    projectileCount: 1,
    pierce: 1,
    speed: 680,
    range: 650,
    area: 1,
  },
  PLASMA_ORBITER: {
    id: 'PLASMA_ORBITER',
    name: 'Plasma Orbiters',
    evolvedName: 'Singularity Ring',
    maxLevel: 5,
    evolutionRequirement: 'MAGNET_RADIUS',
    description: 'Glowing energy satellites revolving around your ship, disintegrating close threats.',
    evolvedDescription: 'Pulsing gravitational singularity ring that vaporizes anything entering your orbit.',
    color: '#fbbf24', // Amber
    icon: 'Orbit',
    cooldown: 0.1,
    damage: 18,
    projectileCount: 2,
    pierce: 999,
    speed: 2.2, // Angular speed
    range: 95, // Orbit radius
    area: 1,
  },
  CHAIN_ARC: {
    id: 'CHAIN_ARC',
    name: 'Chain Arc',
    evolvedName: 'Tesla Tempest',
    maxLevel: 5,
    evolutionRequirement: 'DAMAGE',
    description: 'High voltage electrical branch that jumps between multiple clustered hostiles.',
    evolvedDescription: 'Continuous apocalyptic lightning storm that chains to up to 10 targets with shock stun.',
    color: '#c084fc', // Purple
    icon: 'Zap',
    cooldown: 0.85,
    damage: 32,
    projectileCount: 1,
    pierce: 3, // Chain targets
    speed: 800,
    range: 420,
    area: 1,
  },
  QUANTUM_TORPEDO: {
    id: 'QUANTUM_TORPEDO',
    name: 'Quantum Torpedo',
    evolvedName: 'Nova Barrage',
    maxLevel: 5,
    evolutionRequirement: 'CRIT_RATE',
    description: 'Autonomous guided micro-missiles that track the most dangerous enemy on field.',
    evolvedDescription: 'Fires continuous swarms of cluster warheads causing devastating area-of-effect explosions.',
    color: '#f43f5e', // Rose
    icon: 'Flame',
    cooldown: 1.1,
    damage: 55,
    projectileCount: 1,
    pierce: 1,
    speed: 460,
    range: 800,
    area: 60, // Explosion radius
  },
  CRYO_NOVA: {
    id: 'CRYO_NOVA',
    name: 'Cryo Nova',
    evolvedName: 'Absolute Zero',
    maxLevel: 5,
    evolutionRequirement: 'MAX_HEALTH',
    description: 'Releases periodic freezing shockwaves that damage and drastically slow enemies.',
    evolvedDescription: 'Sub-zero shockwaves shatter frozen enemies, dealing extra burst damage and freezing bosses.',
    color: '#22d3ee', // Cyan
    icon: 'Snowflake',
    cooldown: 2.4,
    damage: 28,
    projectileCount: 1,
    pierce: 999,
    speed: 0,
    range: 220, // Radius
    area: 220,
  },
  VOID_BLADE: {
    id: 'VOID_BLADE',
    name: 'Void Blades',
    evolvedName: 'Dimensional Rift',
    maxLevel: 5,
    evolutionRequirement: 'MOVE_SPEED',
    description: 'Slices huge crescent energy waves through enemy swarms in direction of aim/flight.',
    evolvedDescription: 'Tears open spatial rifts that linger and shred everything trapped within.',
    color: '#10b981', // Emerald
    icon: 'Sword',
    cooldown: 0.95,
    damage: 42,
    projectileCount: 1,
    pierce: 6,
    speed: 520,
    range: 380,
    area: 1,
  }
};

export function createWeapon(type: WeaponType): WeaponItem {
  const base = BASE_WEAPONS[type];
  return {
    ...base,
    level: 1,
    isEvolved: false,
    lastFired: 0,
  };
}

export function getWeaponUpgradeStats(weapon: WeaponItem): { text: string; newWeapon: WeaponItem } {
  const next = { ...weapon };
  next.level += 1;

  let text = '';
  switch (weapon.id) {
    case 'PULSE_BLASTER':
      if (next.level === 2) { next.damage += 8; text = '+8 Damage'; }
      else if (next.level === 3) { next.projectileCount += 1; text = '+1 Projectile'; }
      else if (next.level === 4) { next.cooldown *= 0.8; text = '+25% Fire Rate'; }
      else if (next.level === 5) { next.pierce += 1; next.damage += 10; text = '+1 Pierce, +10 Damage'; }
      break;

    case 'PLASMA_ORBITER':
      if (next.level === 2) { next.projectileCount += 1; text = '+1 Orbiting Orb'; }
      else if (next.level === 3) { next.damage += 10; text = '+10 Damage'; }
      else if (next.level === 4) { next.speed += 0.8; text = '+35% Orbit Speed'; }
      else if (next.level === 5) { next.projectileCount += 1; next.range += 25; text = '+1 Orb, +25% Orbit Radius'; }
      break;

    case 'CHAIN_ARC':
      if (next.level === 2) { next.pierce += 2; text = '+2 Chain Targets'; }
      else if (next.level === 3) { next.damage += 15; text = '+15 Damage'; }
      else if (next.level === 4) { next.projectileCount += 1; text = '+1 Extra Lightning Bolt'; }
      else if (next.level === 5) { next.cooldown *= 0.75; next.pierce += 2; text = '-25% Cooldown, +2 Chain Targets'; }
      break;

    case 'QUANTUM_TORPEDO':
      if (next.level === 2) { next.damage += 20; text = '+20 Damage'; }
      else if (next.level === 3) { next.projectileCount += 1; text = '+1 Missile per Salvo'; }
      else if (next.level === 4) { next.area += 25; text = '+40% Explosion Radius'; }
      else if (next.level === 5) { next.projectileCount += 1; next.damage += 25; text = '+1 Missile, +25 Damage'; }
      break;

    case 'CRYO_NOVA':
      if (next.level === 2) { next.range += 40; text = '+20% Blast Radius'; }
      else if (next.level === 3) { next.damage += 14; text = '+14 Damage'; }
      else if (next.level === 4) { next.cooldown *= 0.8; text = '+25% Pulse Frequency'; }
      else if (next.level === 5) { next.range += 50; next.damage += 20; text = '+25% Radius, +20 Damage'; }
      break;

    case 'VOID_BLADE':
      if (next.level === 2) { next.damage += 16; text = '+16 Damage'; }
      else if (next.level === 3) { next.projectileCount += 1; text = '+1 Blade Arc'; }
      else if (next.level === 4) { next.cooldown *= 0.8; text = '+25% Swing Speed'; }
      else if (next.level === 5) { next.pierce += 4; next.damage += 20; text = '+4 Pierce, +20 Damage'; }
      break;
  }

  return { text, newWeapon: next };
}

export function evolveWeapon(weapon: WeaponItem): WeaponItem {
  const evolved = { ...weapon, isEvolved: true };
  switch (weapon.id) {
    case 'PULSE_BLASTER':
      evolved.damage *= 1.8;
      evolved.projectileCount += 2;
      evolved.cooldown *= 0.6;
      evolved.pierce += 2;
      break;
    case 'PLASMA_ORBITER':
      evolved.damage *= 2.0;
      evolved.projectileCount += 2;
      evolved.speed *= 1.4;
      evolved.range += 30;
      break;
    case 'CHAIN_ARC':
      evolved.damage *= 2.2;
      evolved.pierce += 4;
      evolved.projectileCount += 1;
      evolved.cooldown *= 0.7;
      break;
    case 'QUANTUM_TORPEDO':
      evolved.damage *= 2.2;
      evolved.projectileCount += 2;
      evolved.area += 40;
      evolved.cooldown *= 0.7;
      break;
    case 'CRYO_NOVA':
      evolved.damage *= 2.4;
      evolved.range += 70;
      evolved.cooldown *= 0.7;
      break;
    case 'VOID_BLADE':
      evolved.damage *= 2.5;
      evolved.projectileCount += 2;
      evolved.pierce += 8;
      break;
  }
  return evolved;
}
