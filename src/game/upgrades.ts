import { PassiveItem, UpgradeOption, UpgradeRarity, WeaponItem, WeaponType, PassiveType } from '../types';
import { BASE_WEAPONS, getWeaponUpgradeStats } from './weapons';
import { BASE_PASSIVES } from './passives';

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

  // Shuffle and pick 3-4 options prioritizing Evolutions
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  // Ensure evolutions appear if available
  const evolutions = shuffled.filter(o => o.rarity === 'EVOLUTION');
  const others = shuffled.filter(o => o.rarity !== 'EVOLUTION');

  const selected = [...evolutions, ...others].slice(0, 3);
  return selected;
}
