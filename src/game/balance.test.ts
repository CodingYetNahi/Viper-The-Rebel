import assert from 'node:assert/strict';
import { BALANCE, canSpawnEnemy, enemyCapAt, spawnIntervalAt } from './balance.ts';
import { migrateLocalData, STORAGE_KEYS } from '../lib/storage.ts';

for (const difficulty of ['ROOKIE','REBEL','ELITE'] as const) {
  const b=BALANCE[difficulty];
  const spawnSamples=Array.from({length:601},(_,s)=>spawnIntervalAt(difficulty,s));
  const estimatedGroups=spawnSamples.reduce((sum,n)=>sum+1/n,0);
  console.log(`${difficulty}: 10m estimated groups=${Math.round(estimatedGroups)}, cap=${enemyCapAt(difficulty,600)}, bosses=${b.bossTimes.join('/')}, survival assumption=${difficulty==='ROOKIE'?'5–8m with movement and upgrades':difficulty==='REBEL'?'3–6m':'2–4m'}`);
  assert.equal(enemyCapAt(difficulty,600),b.absoluteEnemyCap);
  assert.ok(Math.min(...spawnSamples)>=b.minSpawnInterval);
}
assert.equal(canSpawnEnemy('ROOKIE','CHARGER',44.9),false);
assert.deepEqual(BALANCE.ROOKIE.bossTimes,[150,330,540]);
const values=new Map<string,string>([['neon_void_best_score','42']]);
const fake={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)}};
assert.equal(migrateLocalData(fake),true); assert.equal(values.get(STORAGE_KEYS.bestScore),'42'); assert.equal(migrateLocalData(fake),false);
