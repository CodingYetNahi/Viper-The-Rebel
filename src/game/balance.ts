import type { Difficulty, EnemyType } from '../types';

export interface DifficultyBalance {
  spawnInterval: number; minSpawnInterval: number; spawnAccelerationPerMinute: number;
  initialEnemyCap: number; enemyCapGrowthPerMinute: number; absoluteEnemyCap: number;
  healthGrowthPerMinute: number; advancedEnemyDelay: number; bossTimes: readonly number[];
  invulnerabilitySeconds: number; shieldRegenDelay: number; hullMultiplier: number;
  shieldMultiplier: number; magnetMultiplier: number; healDropChance: number;
  enemyDamage: Readonly<Record<'SWARMER'|'CHARGER'|'SHOOTER'|'HEAVY', number>>;
  enemySpeed: Readonly<Record<'SWARMER'|'CHARGER'|'SHOOTER'|'HEAVY', number>>;
  bossHealthMultiplier: number; bossDamageMultiplier: number; screenShakeMultiplier: number;
}

export const BALANCE: Readonly<Record<Difficulty, DifficultyBalance>> = {
  ROOKIE: { spawnInterval:1.25,minSpawnInterval:.38,spawnAccelerationPerMinute:.11,initialEnemyCap:18,enemyCapGrowthPerMinute:15,absoluteEnemyCap:100,healthGrowthPerMinute:.25,advancedEnemyDelay:45,bossTimes:[150,330,540],invulnerabilitySeconds:.7,shieldRegenDelay:2.5,hullMultiplier:1.2,shieldMultiplier:1.2,magnetMultiplier:1.2,healDropChance:.09,enemyDamage:{SWARMER:8,CHARGER:16,SHOOTER:10,HEAVY:24},enemySpeed:{SWARMER:138,CHARGER:105,SHOOTER:80,HEAVY:58},bossHealthMultiplier:.7,bossDamageMultiplier:.65,screenShakeMultiplier:.5 },
  REBEL: { spawnInterval:1,minSpawnInterval:.28,spawnAccelerationPerMinute:.12,initialEnemyCap:23,enemyCapGrowthPerMinute:20,absoluteEnemyCap:140,healthGrowthPerMinute:.35,advancedEnemyDelay:30,bossTimes:[135,285,450],invulnerabilitySeconds:.5,shieldRegenDelay:2.8,hullMultiplier:1.08,shieldMultiplier:1.08,magnetMultiplier:1.08,healDropChance:.065,enemyDamage:{SWARMER:10,CHARGER:20,SHOOTER:13,HEAVY:30},enemySpeed:{SWARMER:150,CHARGER:118,SHOOTER:88,HEAVY:64},bossHealthMultiplier:.88,bossDamageMultiplier:.82,screenShakeMultiplier:.75 },
  ELITE: { spawnInterval:.9,minSpawnInterval:.18,spawnAccelerationPerMinute:.12,initialEnemyCap:25,enemyCapGrowthPerMinute:25,absoluteEnemyCap:180,healthGrowthPerMinute:.45,advancedEnemyDelay:18,bossTimes:[120,240,360],invulnerabilitySeconds:.35,shieldRegenDelay:3,hullMultiplier:1,shieldMultiplier:1,magnetMultiplier:1,healDropChance:.05,enemyDamage:{SWARMER:12,CHARGER:24,SHOOTER:15,HEAVY:35},enemySpeed:{SWARMER:170,CHARGER:130,SHOOTER:95,HEAVY:70},bossHealthMultiplier:1,bossDamageMultiplier:1,screenShakeMultiplier:1 },
};

export const enemyCapAt = (difficulty: Difficulty, seconds: number) => {
  const b=BALANCE[difficulty]; return Math.min(b.absoluteEnemyCap, b.initialEnemyCap+Math.floor(seconds/60*b.enemyCapGrowthPerMinute));
};
export const spawnIntervalAt = (difficulty: Difficulty, seconds: number) => {
  const b=BALANCE[difficulty]; return Math.max(b.minSpawnInterval,b.spawnInterval-seconds/60*b.spawnAccelerationPerMinute);
};
export const canSpawnEnemy = (difficulty: Difficulty, type: EnemyType, seconds: number) => type==='SWARMER'||type.startsWith('BOSS_')||seconds>=BALANCE[difficulty].advancedEnemyDelay;
