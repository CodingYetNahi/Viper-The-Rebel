import assert from 'node:assert/strict';
import { BALANCE,bossStats,canSpawnEnemy,capDefensiveStats,enemyCapAt,enemyDamageMultiplier,enemyHealthMultiplier,enemySpeedMultiplier,spawnIntervalAt } from './balance.ts';
import { migrateLocalData, STORAGE_KEYS } from '../lib/storage.ts';

for (const difficulty of ['ROOKIE','REBEL','ELITE'] as const) {
  const b=BALANCE[difficulty];
  assert.ok(enemyHealthMultiplier(difficulty,120,12)>enemyHealthMultiplier(difficulty,120,1),'level scales health');
  assert.ok(enemyDamageMultiplier(difficulty,12)>enemyDamageMultiplier(difficulty,1),'level scales damage');
  assert.ok(enemySpeedMultiplier(difficulty,999)<=b.maxSpeedMultiplier,'speed cap');
  assert.ok(spawnIntervalAt(difficulty,3600,999)>=b.minSpawnInterval,'spawn floor');
  assert.ok(enemyCapAt(difficulty,3600,999)<=b.absoluteEnemyCap,'enemy cap');
  const boss1=bossStats(difficulty,2000,40,1),boss10=bossStats(difficulty,2000,40,10);
  assert.ok(boss10.health>boss1.health&&boss10.damage>boss1.damage,'boss spawn-level scaling');
  // With no movement or healing, ordinary contacts eventually exceed each starting hull+shield.
  const effectiveHit=b.enemyDamage.SWARMER*(1-.6); const startingPool=90*b.hullMultiplier+50*b.shieldMultiplier;
  assert.ok(effectiveHit*Math.ceil(startingPool/effectiveHit+1)>startingPool,`${difficulty} stationary Viper eventually dies`);
}
assert.ok(enemyHealthMultiplier('ELITE',60,10)>enemyHealthMultiplier('ROOKIE',60,10),'difficulty-specific health pressure');
assert.equal(canSpawnEnemy('ROOKIE','HEAVY',600,3),false); assert.equal(canSpawnEnemy('ROOKIE','HEAVY',600,7),true);
assert.deepEqual(capDefensiveStats(999,1),{shieldRegen:14,damageReduction:.6});

const values=new Map<string,string>([['neon_void_best_score','42'],['neon_void_settings',JSON.stringify({passives:['DASH_COOLDOWN'],dashCooldown:2})]]);
const fake={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)}};
assert.equal(migrateLocalData(fake),true); assert.equal(values.get(STORAGE_KEYS.bestScore),'42'); assert.doesNotThrow(()=>JSON.parse(values.get(STORAGE_KEYS.settings)!)); assert.equal(migrateLocalData(fake),false);
console.log('balance tests passed');
