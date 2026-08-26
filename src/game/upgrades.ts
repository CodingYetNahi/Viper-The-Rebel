import type { PassiveItem, UpgradeOption, UpgradeRarity, WeaponItem, WeaponType, PassiveType } from '../types.ts';
import { BASE_WEAPONS, getWeaponUpgradeStats } from './weapons.ts';
import { BASE_PASSIVES } from './passives.ts';

const ALL_WEAPON_TYPES: WeaponType[] = [
  'PULSE_BLASTER',
  'PLASMA_ORBITER',
  'CHAIN_ARC',
  'QUANTUM_TORPEDO',
  'CRYO_NOVA',
  'VOID_BLADE',
];

const ALL_PASSIVE_TYPES: PassiveType[] = [
  'MAX_HEALTH',
  'SHIELD_REGEN',
  'MOVE_SPEED',
  'ATTACK_SPEED',
  'DAMAGE',
  'MAGNET_RADIUS',
  'CRIT_RATE',
  'DASH_COOLDOWN',
];

export function generateUpgradeOptions(
  activeWeapons: WeaponItem[],
  activePassives: PassiveItem[],
  maxSlots: number = 4
): UpgradeOption[] {
  const options: UpgradeOption[] = [];

  // 1. Check for Weapon Evolutions (Level 5 weapon + corresponding passive owned)
  for (const weapon of activeWeapons) {
    if (weapon.level >= weapon.maxLevel && !weapon.isEvolved) {
      const hasReqPassive = activePassives.some(p => p.id === weapon.evolutionRequirement);
      if (hasReqPassive) {
        options.push({
          id: `EVOLVE_${weapon.id}`,
          title: `EVOLVE: ${weapon.evolvedName}`,
          description: weapon.evolvedDescription,
          type: 'EVOLVE_WEAPON',
          targetId: weapon.id,
          rarity: 'EVOLUTION',
          icon: weapon.icon,
          color: '#eab308', // Gold
          statChange: 'LEGENDARY POWER AWAKENING',
        });
      }
    }
  }

  // 2. Weapon Upgrades (for weapons not at max level)
  for (const weapon of activeWeapons) {
    if (weapon.level < weapon.maxLevel) {
      const { text } = getWeaponUpgradeStats(weapon);
      const rarity: UpgradeRarity = weapon.level >= 3 ? 'EPIC' : 'RARE';
      options.push({
        id: `UPGRADE_WEAPON_${weapon.id}`,
        title: `${weapon.name} Lv.${weapon.level + 1}`,
        description: weapon.description,
        type: 'UPGRADE_WEAPON',
        targetId: weapon.id,
        rarity,
        icon: weapon.icon,
        color: weapon.color,
        statChange: text,
      });
    }
  }

  // 3. New Weapons (if player has open weapon slots < maxSlots)
  if (activeWeapons.length < maxSlots) {
    const ownedTypes = new Set(activeWeapons.map(w => w.id));
    for (const wType of ALL_WEAPON_TYPES) {
      if (!ownedTypes.has(wType)) {
        const base = BASE_WEAPONS[wType];
        options.push({
          id: `NEW_WEAPON_${wType}`,
          title: `NEW: ${base.name}`,
          description: base.description,
          type: 'NEW_WEAPON',
          targetId: wType,
          rarity: 'RARE',
          icon: base.icon,
          color: base.color,
          statChange: `Unlocks weapon (Req. for Evo: ${BASE_PASSIVES[base.evolutionRequirement as PassiveType]?.name || ''})`,
        });
      }
    }
  }

  // 4. Passive Upgrades
  for (const passive of activePassives) {
    if (passive.level < passive.maxLevel) {
      const rarity: UpgradeRarity = passive.level >= 3 ? 'RARE' : 'COMMON';
      options.push({
        id: `UPGRADE_PASSIVE_${passive.id}`,
        title: `${passive.name} Lv.${passive.level + 1}`,
        description: passive.description,
        type: 'UPGRADE_PASSIVE',
        targetId: passive.id,
        rarity,
        icon: passive.icon,
        color: passive.color,
        statChange: `+${Math.round(passive.statBonusPerLevel * 100)}% Bonus`,
      });
    }
  }

  // 5. New Passives (if open passive slots < maxSlots)
  if (activePassives.length < maxSlots) {
    const ownedPassives = new Set(activePassives.map(p => p.id));
    for (const pType of ALL_PASSIVE_TYPES) {
      if (!ownedPassives.has(pType)) {
        const base = BASE_PASSIVES[pType];
        options.push({
          id: `NEW_PASSIVE_${pType}`,
          title: `NEW: ${base.name}`,
          description: base.description,
          type: 'NEW_PASSIVE',
          targetId: pType,
          rarity: 'COMMON',
          icon: base.icon,
          color: base.color,
          statChange: `+${Math.round(base.statBonusPerLevel * 100)}% Initial Stat Boost`,
        });
      }
    }
  }

  // Fallback options if pool is small
  if (options.length < 3) {
    options.push({
      id: 'HEAL_FULL',
      title: 'Nanite Emergency Repair',
      description: 'Fully restores Ship Shield and repairs 65% Hull Integrity.',
      type: 'HEAL_FULL',
      targetId: 'HEAL',
      rarity: 'COMMON',
      icon: 'ShieldPlus',
      color: '#10b981',
      statChange: '+65% HP / Full Shield',
    });
    options.push({
      id: 'OVERCHARGE',
      title: 'Capacitor Overcharge',
      description: 'Awards +1,500 Score and permanently grants +25 Max Shield.',
      type: 'OVERCHARGE',
      targetId: 'OVERCHARGE',
      rarity: 'RARE',
      icon: 'Sparkles',
      color: '#06b6d4',
      statChange: '+25 Max Shield / +1,500 Score',
    });
  }

  return options;
}

export type RandomSource = () => number;
export interface UpgradeSelectionContext {
  activeWeapons: WeaponItem[];
  activePassives: PassiveItem[];
  health: number;
  maxHealth: number;
  level: number;
  history: string[];
  maxSlots?: number;
}

/** Base weights are deliberately explicit so balance changes remain reviewable. */
export const UPGRADE_BASE_WEIGHTS: Record<UpgradeOption['type'], number> = {
  EVOLVE_WEAPON: 1000, NEW_WEAPON: 34, UPGRADE_WEAPON: 30,
  NEW_PASSIVE: 15, UPGRADE_PASSIVE: 17, HEAL_FULL: 12, OVERCHARGE: 10,
};

export function repetitionMultiplier(family: string, history: string[]): number {
  const distance = [...history].reverse().findIndex(id => id === family);
  return distance < 0 || distance > 2 ? 1 : [0.15, 0.40, 0.70][distance];
}

export function selectAutomaticUpgrade(context: UpgradeSelectionContext, random: RandomSource = Math.random): UpgradeOption | null {
  const options = generateUpgradeOptions(context.activeWeapons, context.activePassives, context.maxSlots ?? 4);
  if (!options.length) return null;
  const last = context.history.at(-1);
  const evolutions = options.filter(option => option.type === 'EVOLVE_WEAPON');
  const pool = evolutions.length ? evolutions : options;
  if (pool.length === 1) return pool[0];

  const lowHealth = context.maxHealth > 0 && context.health / context.maxHealth < 0.35;
  const hasOffence = context.activeWeapons.length > 0;
  const weighted = pool.map(option => {
    let weight = UPGRADE_BASE_WEIGHTS[option.type];
    if (lowHealth && (option.type === 'HEAL_FULL' || option.targetId === 'MAX_HEALTH' || option.targetId === 'SHIELD_REGEN' || option.id === 'OVERCHARGE')) weight *= 20;
    if (context.level <= 5 && (option.type === 'NEW_WEAPON' || option.type === 'UPGRADE_WEAPON')) weight *= 2.2;
    if (!hasOffence && !option.type.includes('WEAPON')) weight *= 0.05;
    weight *= repetitionMultiplier(option.targetId, context.history);
    // Consecutive exact-family awards are forbidden while another valid choice exists.
    if (option.targetId === last) weight = 0;
    return { option, weight };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return pool[0];
  let roll = Math.max(0, Math.min(0.999999999, random())) * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll < 0) return item.option;
  }
  return weighted.at(-1)!.option;
}

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
}
