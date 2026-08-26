import assert from 'node:assert/strict';
import { createSeededRandom, repetitionMultiplier, selectAutomaticUpgrade } from './upgrades.ts';
import { predictiveIntercept, turnVelocityToward } from './targeting.ts';
import { createWeapon } from './weapons.ts';
import { createPassive } from './passives.ts';
import { movementFromDrag, releasedMovement } from './controls.ts';
import { readFileSync } from 'node:fs';

assert.equal(repetitionMultiplier('DAMAGE', ['DAMAGE']), 0.15);
assert.equal(repetitionMultiplier('DAMAGE', ['DAMAGE', 'MOVE_SPEED']), 0.40);
assert.equal(repetitionMultiplier('DAMAGE', ['DAMAGE', 'MOVE_SPEED', 'MAX_HEALTH']), 0.70);
assert.equal(repetitionMultiplier('DAMAGE', ['DAMAGE', 'A', 'B', 'C']), 1);

const base = { activeWeapons: [createWeapon('PULSE_BLASTER')], activePassives: [], health: 100, maxHealth: 100, level: 2, history: [] as string[], maxSlots: 1 };
const first = selectAutomaticUpgrade(base, createSeededRandom(42));
const repeat = selectAutomaticUpgrade({ ...base, history: [first!.targetId] }, () => 0);
assert.notEqual(repeat!.targetId, first!.targetId, 'exact consecutive family is excluded');

const maxed = createWeapon('PULSE_BLASTER'); maxed.level = maxed.maxLevel;
const required = createPassive(maxed.evolutionRequirement as Parameters<typeof createPassive>[0]);
const evolution = selectAutomaticUpgrade({ ...base, activeWeapons: [maxed], activePassives: [required], maxSlots: 1 }, () => 0.99);
assert.equal(evolution?.type, 'EVOLVE_WEAPON', 'eligible evolution takes priority');
maxed.isEvolved = true;
assert.notEqual(selectAutomaticUpgrade({ ...base, activeWeapons: [maxed], activePassives: [required], maxSlots: 1 }, () => 0)?.type, 'UPGRADE_WEAPON', 'maxed weapon excluded');

let survival = 0;
const healthRandom = createSeededRandom(918273);
for (let seed = 0; seed < 200; seed++) {
  const choice = selectAutomaticUpgrade({ ...base, health: 10, activePassives: [], maxSlots: 4 }, healthRandom);
  if (choice?.targetId === 'MAX_HEALTH' || choice?.targetId === 'SHIELD_REGEN' || choice?.type === 'HEAL_FULL' || choice?.id === 'OVERCHARGE') survival++;
}
assert.ok(survival > 35, `low health should favour survival, got ${survival}/200`);
assert.ok(survival < 190, `survival weighting must not dominate every award, got ${survival}/200`);

maxed.isEvolved = false;
const single = selectAutomaticUpgrade({ ...base, activeWeapons: [maxed], activePassives: [required], maxSlots: 1, history: [maxed.id] }, () => 0.5);
assert.equal(single?.type, 'EVOLVE_WEAPON', 'the sole priority-valid evolution is selected despite history');
assert.deepEqual(
  Array.from({ length: 8 }, () => selectAutomaticUpgrade(base, createSeededRandom(7))?.id),
  Array.from({ length: 8 }, () => selectAutomaticUpgrade(base, createSeededRandom(7))?.id),
);

assert.deepEqual(predictiveIntercept({x:0,y:0},{x:100,y:0},{x:0,y:0},50), {x:100,y:0});
const lateral = predictiveIntercept({x:0,y:0},{x:100,y:0},{x:0,y:10},50);
assert.ok(lateral.y > 0, 'ballistic aim leads lateral motion');
assert.deepEqual(predictiveIntercept({x:0,y:0},{x:100,y:0},{x:100,y:0},50), {x:100,y:0}, 'impossible intercept falls back');
const turned = turnVelocityToward({x:100,y:0},{x:0,y:0},{x:0,y:100},0.1);
assert.ok(Math.abs(Math.atan2(turned.y, turned.x) - 0.1) < 1e-9, 'homing turn is rate limited');
assert.ok(Math.abs(Math.hypot(turned.x, turned.y) - 100) < 1e-9, 'homing preserves speed');

assert.deepEqual(releasedMovement(),{x:0,y:0},'joystick/touch release resets movement');
assert.deepEqual(movementFromDrag(2,2),{x:0,y:0},'touch steering dead zone');
assert.ok(movementFromDrag(50,0).x>.9,'drag direction steers rather than teleports');
assert.equal(createPassive('DASH_COOLDOWN').id,'MOVE_SPEED','legacy dash passive migrates safely');
const canvasSource=readFileSync(new URL('../components/GameCanvas.tsx',import.meta.url),'utf8');
assert.ok(!canvasSource.includes('LevelUp'+'Modal'),'no blocking level-up component references');
assert.ok(!canvasSource.includes('triggerDash'),'dash control removed');
assert.ok(canvasSource.includes("settings.controlScheme==='TOUCH'"),'touch steering is isolated to gameplay canvas so HUD touches do not steer');
const engineSource=readFileSync(new URL('./GameEngine.ts',import.meta.url),'utf8');
assert.ok(!engineSource.includes('this.isPaused = true') || !engineSource.match(/gainXp[\s\S]*?this\.isPaused = true/),'level-up does not pause');
assert.ok(engineSource.includes('if (!this.isPaused) {\n      this.update(dt);'),'pause stops gameplay updates');

console.log('gameplay tests passed');
