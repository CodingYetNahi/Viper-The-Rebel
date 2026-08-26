import type { Difficulty, EnemyType, GameMode } from '../types';

type RegularEnemy = 'SWARMER'|'CHARGER'|'SHOOTER'|'HEAVY';
export interface DifficultyBalance {
  spawnInterval:number; minSpawnInterval:number; timeSpawnAcceleration:number; levelSpawnReduction:number;
  initialEnemyCap:number; timeCapGrowth:number; levelsPerCap:number; absoluteEnemyCap:number;
  timeHealthGrowth:number; levelHealthGrowth:number; levelDamageGrowth:number; maxDamageMultiplier:number;
  levelSpeedGrowth:number; maxSpeedMultiplier:number; advancedEnemyLevel:number; advancedEnemyDelay:number;
  bossTimes:readonly number[]; invulnerabilitySeconds:number; shieldRegenDelay:number;
  hullMultiplier:number; shieldMultiplier:number; magnetMultiplier:number; healDropChance:number;
  enemyDamage:Readonly<Record<RegularEnemy,number>>; enemySpeed:Readonly<Record<RegularEnemy,number>>;
  bossHealthMultiplier:number; bossDamageMultiplier:number; screenShakeMultiplier:number;
}

export const BALANCE: Readonly<Record<Difficulty,DifficultyBalance>> = {
  ROOKIE:{spawnInterval:1.3,minSpawnInterval:.42,timeSpawnAcceleration:.10,levelSpawnReduction:.011,initialEnemyCap:16,timeCapGrowth:8,levelsPerCap:3,absoluteEnemyCap:90,timeHealthGrowth:.22,levelHealthGrowth:.035,levelDamageGrowth:.018,maxDamageMultiplier:1.75,levelSpeedGrowth:.006,maxSpeedMultiplier:1.3,advancedEnemyLevel:4,advancedEnemyDelay:55,bossTimes:[150,330,540],invulnerabilitySeconds:.52,shieldRegenDelay:3.2,hullMultiplier:1.1,shieldMultiplier:1.05,magnetMultiplier:1.15,healDropChance:.055,enemyDamage:{SWARMER:8,CHARGER:16,SHOOTER:10,HEAVY:24},enemySpeed:{SWARMER:138,CHARGER:105,SHOOTER:80,HEAVY:58},bossHealthMultiplier:.75,bossDamageMultiplier:.72,screenShakeMultiplier:.5},
  REBEL:{spawnInterval:1.05,minSpawnInterval:.32,timeSpawnAcceleration:.115,levelSpawnReduction:.013,initialEnemyCap:21,timeCapGrowth:11,levelsPerCap:2,absoluteEnemyCap:125,timeHealthGrowth:.3,levelHealthGrowth:.04,levelDamageGrowth:.02,maxDamageMultiplier:1.9,levelSpeedGrowth:.0075,maxSpeedMultiplier:1.33,advancedEnemyLevel:3,advancedEnemyDelay:35,bossTimes:[135,285,450],invulnerabilitySeconds:.45,shieldRegenDelay:4,hullMultiplier:1.03,shieldMultiplier:1,magnetMultiplier:1.05,healDropChance:.04,enemyDamage:{SWARMER:10,CHARGER:20,SHOOTER:13,HEAVY:30},enemySpeed:{SWARMER:150,CHARGER:118,SHOOTER:88,HEAVY:64},bossHealthMultiplier:.9,bossDamageMultiplier:.88,screenShakeMultiplier:.75},
  ELITE:{spawnInterval:.92,minSpawnInterval:.24,timeSpawnAcceleration:.12,levelSpawnReduction:.015,initialEnemyCap:24,timeCapGrowth:13,levelsPerCap:2,absoluteEnemyCap:150,timeHealthGrowth:.38,levelHealthGrowth:.045,levelDamageGrowth:.023,maxDamageMultiplier:2.1,levelSpeedGrowth:.009,maxSpeedMultiplier:1.35,advancedEnemyLevel:2,advancedEnemyDelay:20,bossTimes:[120,240,360],invulnerabilitySeconds:.38,shieldRegenDelay:4.8,hullMultiplier:1,shieldMultiplier:1,magnetMultiplier:1,healDropChance:.03,enemyDamage:{SWARMER:12,CHARGER:24,SHOOTER:15,HEAVY:35},enemySpeed:{SWARMER:170,CHARGER:130,SHOOTER:95,HEAVY:70},bossHealthMultiplier:1,bossDamageMultiplier:1,screenShakeMultiplier:1},
};

const modePressure=(mode:GameMode)=>mode==='BOSS_RUSH'?1.12:mode==='BLITZ'?1.06:1;
const milestone=(level:number)=>1+Math.floor(Math.max(0,level-1)/5)*.08;
export const enemyHealthMultiplier=(d:Difficulty,seconds:number,level:number,mode:GameMode='ENDLESS') => (1+seconds/60*BALANCE[d].timeHealthGrowth)*(1+Math.max(0,level-1)*BALANCE[d].levelHealthGrowth)*milestone(level)*modePressure(mode);
export const enemyDamageMultiplier=(d:Difficulty,level:number,mode:GameMode='ENDLESS') => Math.min(BALANCE[d].maxDamageMultiplier,(1+Math.max(0,level-1)*BALANCE[d].levelDamageGrowth)*milestone(level)*modePressure(mode));
export const enemySpeedMultiplier=(d:Difficulty,level:number) => Math.min(BALANCE[d].maxSpeedMultiplier,1+Math.max(0,level-1)*BALANCE[d].levelSpeedGrowth);
export const enemyCapAt=(d:Difficulty,seconds:number,level=1,mode:GameMode='ENDLESS')=>{const b=BALANCE[d];return Math.min(b.absoluteEnemyCap,Math.floor((b.initialEnemyCap+seconds/60*b.timeCapGrowth+Math.floor((level-1)/b.levelsPerCap))*modePressure(mode)));};
export const spawnIntervalAt=(d:Difficulty,seconds:number,level=1,mode:GameMode='ENDLESS')=>{const b=BALANCE[d];return Math.max(b.minSpawnInterval,(b.spawnInterval-seconds/60*b.timeSpawnAcceleration)*Math.pow(1-b.levelSpawnReduction,Math.max(0,level-1))/modePressure(mode));};
export const canSpawnEnemy=(d:Difficulty,type:EnemyType,seconds:number,level=1)=>type==='SWARMER'||type.startsWith('BOSS_')||(seconds>=BALANCE[d].advancedEnemyDelay&&level>=BALANCE[d].advancedEnemyLevel+(type==='SHOOTER'?1:type==='HEAVY'?3:0));
export const bossStats=(d:Difficulty,baseHealth:number,baseDamage:number,level:number,mode:GameMode='ENDLESS')=>({health:Math.round(baseHealth*BALANCE[d].bossHealthMultiplier*enemyHealthMultiplier(d,0,level,mode)),damage:Math.round(baseDamage*BALANCE[d].bossDamageMultiplier*enemyDamageMultiplier(d,level,mode))});
export const capDefensiveStats=(shieldRegen:number,damageReduction:number)=>({shieldRegen:Math.min(14,shieldRegen),damageReduction:Math.min(.6,Math.max(0,damageReduction))});
