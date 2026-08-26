import { 
  DropItem, 
  Enemy, 
  EnemyType, 
  GameMode, 
  Difficulty, 
  GameSettings, 
  PassiveItem, 
  PlayerStats, 
  Projectile, 
  ShipDefinition, 
  WeaponItem, 
  WeaponType, UpgradeOption
} from '../types';
import { BALANCE, canSpawnEnemy, enemyCapAt, spawnIntervalAt } from './balance';
import { SHIPS } from './ships';
import { createWeapon, evolveWeapon } from './weapons';
import { createPassive } from './passives';
import { ParticleSystem } from './particles';
import { sound } from '../audio/soundEngine';
import { selectAutomaticUpgrade } from './upgrades';
import { predictiveIntercept, turnVelocityToward, validTarget } from './targeting';

export interface GameEngineCallbacks {
  onLevelUp: (level: number, upgrade: UpgradeOption) => void;
  onGameOver: (stats: PlayerStats, won: boolean) => void;
  onBossSpawn: (bossName: string) => void;
  onStatsUpdate: (stats: PlayerStats) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public callbacks: GameEngineCallbacks;

  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public gameTime: number = 0; // seconds
  public gameMode: GameMode = 'ENDLESS';
  public difficulty: Difficulty = 'ROOKIE';
  private balance = BALANCE.ROOKIE;
  public targetDuration: number = 300; // 5 mins for Blitz

  // Game entities
  public player: PlayerStats;
  public currentShip: ShipDefinition;
  public weapons: WeaponItem[] = [];
  public passives: PassiveItem[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public dropItems: DropItem[] = [];
  public particles: ParticleSystem;

  public settings: GameSettings = {
    difficulty: 'ROOKIE',
    masterVolume: 0.8,
    sfxVolume: 0.7,
    musicVolume: 0.4,
    screenShake: true,
    damageNumbers: true,
    bloomFX: true,
    autoAim: true,
    particleDensity: 'HIGH',
  };

  // Inputs
  public keys: Record<string, boolean> = {};
  public mousePos: { x: number; y: number } = { x: 0, y: 0 };
  public isMouseDown: boolean = false;
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  // Arena & camera
  public arenaWidth: number = 2400;
  public arenaHeight: number = 2400;
  public camera: { x: number; y: number } = { x: 0, y: 0 };

  // Spawning & Difficulty
  private enemyIdCounter = 1;
  private projectileIdCounter = 1;
  private dropIdCounter = 1;
  private spawnTimer: number = 0;
  private bossSpawnedFlags = { aegis: false, leviathan: false, archon: false };
  private screenShakeTimer: number = 0;
  private screenShakeIntensity: number = 0;

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private upgradeHistory: string[] = [];
  private lockedTargetId: number | null = null;
  private targetLockUntil = 0;

  private boundKeyDown: (e: KeyboardEvent) => void = () => {};
  private boundKeyUp: (e: KeyboardEvent) => void = () => {};
  private boundMouseMove: (e: MouseEvent) => void = () => {};
  private boundMouseDown: () => void = () => {};
  private boundMouseUp: () => void = () => {};

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.callbacks = callbacks;
    this.particles = new ParticleSystem();

    this.currentShip = SHIPS.VIPER;
    this.player = this.createInitialPlayer(this.currentShip);
    this.player.health *= this.balance.hullMultiplier; this.player.maxHealth = this.player.health;
    this.player.shield *= this.balance.shieldMultiplier; this.player.maxShield = this.player.shield;
    this.player.magnetRadius *= this.balance.magnetMultiplier;

    this.bindEvents();
  }

  private createInitialPlayer(ship: ShipDefinition): PlayerStats {
    return {
      x: this.arenaWidth / 2,
      y: this.arenaHeight / 2,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      health: ship.baseHealth,
      maxHealth: ship.baseHealth,
      shield: ship.baseShield,
      maxShield: ship.baseShield,
      shieldRegenRate: ship.shieldRegen,
      lastShieldHitTime: 0,
      speed: ship.speed * (ship.perk.type === 'SPEED' ? ship.perk.value : 1),
      dashCooldown: ship.dashCooldown,
      dashDuration: 0.22,
      isDashing: false,
      dashTimer: 0,
      lastDashTime: -10,
      invulnerableTimer: 0,
      magnetRadius: 130,
      critChance: ship.critChance,
      critMultiplier: ship.critMultiplier,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      xp: 0,
      level: 1,
      nextLevelXp: 15,
      score: 0,
      kills: 0,
      combo: 0,
      comboTimer: 0,
      maxCombo: 0,
      totalDamageDealt: 0,
    };
  }

  public initGame(shipId: string = 'VIPER', mode: GameMode = 'ENDLESS', difficulty: Difficulty = this.settings.difficulty) {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.currentShip = SHIPS[shipId] || SHIPS.VIPER;
    this.difficulty = difficulty;
    this.balance = BALANCE[difficulty];
    this.gameMode = mode;
    this.gameTime = 0;
    this.bossSpawnedFlags = { aegis: false, leviathan: false, archon: false };

    this.player = this.createInitialPlayer(this.currentShip);
    this.player.health *= this.balance.hullMultiplier; this.player.maxHealth = this.player.health;
    this.player.shield *= this.balance.shieldMultiplier; this.player.maxShield = this.player.shield;
    this.player.magnetRadius *= this.balance.magnetMultiplier;
    if (difficulty === 'ROOKIE') this.player.nextLevelXp = 11;
    this.weapons = [createWeapon(this.currentShip.startingWeaponId as WeaponType)];
    this.passives = [];
    this.enemies = [];
    this.projectiles = [];
    this.dropItems = [];
    this.upgradeHistory = [];
    this.lockedTargetId = null;
    this.particles.clear();

    if (mode === 'BLITZ') {
      this.targetDuration = 300; // 5 minutes
    } else if (mode === 'BOSS_RUSH') {
      this.targetDuration = 600;
      this.player.level = 5;
      this.player.nextLevelXp = 80;
    }

    this.recalculatePlayerStats();
    this.isRunning = true;
    this.isPaused = false;
    this.settings.autoAim = true;
    this.lastTimestamp = performance.now();

    sound.setVolumes(this.settings.masterVolume, this.settings.sfxVolume, this.settings.musicVolume);
    sound.startMusic();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public recalculatePlayerStats() {
    let speedBonus = 1;
    let maxHealthBonus = 1;
    let shieldRegenBonus = 1;
    let damageBonus = 1;
    let attackSpeedBonus = 1;
    let magnetBonus = 1;
    let critChanceBonus = 0;
    let dashCooldownReduction = 1;

    for (const p of this.passives) {
      const multiplier = p.level * p.statBonusPerLevel;
      if (p.id === 'MAX_HEALTH') maxHealthBonus += multiplier;
      if (p.id === 'SHIELD_REGEN') shieldRegenBonus += multiplier;
      if (p.id === 'MOVE_SPEED') speedBonus += multiplier;
      if (p.id === 'DAMAGE') damageBonus += multiplier;
      if (p.id === 'ATTACK_SPEED') attackSpeedBonus += multiplier;
      if (p.id === 'MAGNET_RADIUS') magnetBonus += multiplier;
      if (p.id === 'CRIT_RATE') {
        critChanceBonus += multiplier;
      }
      if (p.id === 'DASH_COOLDOWN') dashCooldownReduction *= Math.max(0.4, 1 - multiplier);
    }

    // Apply ship perks
    if (this.currentShip.perk.type === 'SPEED') speedBonus *= this.currentShip.perk.value;
    if (this.currentShip.perk.type === 'SHIELD') shieldRegenBonus *= this.currentShip.perk.value;

    const prevMaxHealth = this.player.maxHealth;
    this.player.maxHealth = Math.round(this.currentShip.baseHealth * maxHealthBonus);
    if (this.player.maxHealth > prevMaxHealth) {
      this.player.health += this.player.maxHealth - prevMaxHealth;
    }

    this.player.speed = this.currentShip.speed * speedBonus;
    this.player.shieldRegenRate = this.currentShip.shieldRegen * shieldRegenBonus;
    this.player.damageMultiplier = damageBonus;
    this.player.fireRateMultiplier = attackSpeedBonus;
    this.player.magnetRadius = 130 * magnetBonus;
    this.player.critChance = Math.min(0.95, this.currentShip.critChance + critChanceBonus);
    this.player.dashCooldown = this.currentShip.dashCooldown * dashCooldownReduction;
  }

  public applyUpgrade(optionId: string, targetId: string) {
    if (optionId.startsWith('NEW_WEAPON_')) {
      this.weapons.push(createWeapon(targetId as WeaponType));
    } else if (optionId.startsWith('UPGRADE_WEAPON_')) {
      const weapon = this.weapons.find(w => w.id === targetId);
      if (weapon && weapon.level < weapon.maxLevel) {
        weapon.level += 1;
      }
    } else if (optionId.startsWith('EVOLVE_')) {
      const idx = this.weapons.findIndex(w => w.id === targetId);
      if (idx !== -1) {
        this.weapons[idx] = evolveWeapon(this.weapons[idx]);
        this.particles.addShockwave(this.player.x, this.player.y, '#eab308', 250);
        sound.playPowerup();
      }
    } else if (optionId.startsWith('NEW_PASSIVE_')) {
      this.passives.push(createPassive(targetId as any));
    } else if (optionId.startsWith('UPGRADE_PASSIVE_')) {
      const passive = this.passives.find(p => p.id === targetId);
      if (passive && passive.level < passive.maxLevel) {
        passive.level += 1;
      }
    } else if (optionId === 'HEAL_FULL') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * 0.65);
      this.player.shield = this.player.maxShield;
      this.particles.addShockwave(this.player.x, this.player.y, '#10b981', 160);
      sound.playPowerup();
    } else if (optionId === 'OVERCHARGE') {
      this.player.maxShield += 25;
      this.player.shield = this.player.maxShield;
      this.player.score += 1500;
      this.particles.addShockwave(this.player.x, this.player.y, '#06b6d4', 160);
      sound.playPowerup();
    }

    this.recalculatePlayerStats();
    this.isPaused = false;
  }

  // --- INPUT HANDLING ---
  private bindEvents() {
    this.boundKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerDash();
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    this.boundMouseMove = () => {};

    this.boundMouseDown = () => {
      this.isMouseDown = true;
    };

    this.boundMouseUp = () => {
      this.isMouseDown = false;
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public triggerDash() {
    if (!this.isRunning || this.isPaused) return;
    const now = this.gameTime;
    if (now - this.player.lastDashTime >= this.player.dashCooldown && !this.player.isDashing) {
      this.player.isDashing = true;
      this.player.dashTimer = this.player.dashDuration;
      this.player.lastDashTime = now;
      this.player.invulnerableTimer = this.player.dashDuration + 0.08;

      sound.playDash();
      this.triggerScreenShake(4, 0.15);

      // Dash Shockwave for Colossus or heavy perk
      if (this.currentShip.perk.type === 'SHOCKWAVE') {
        this.particles.addShockwave(this.player.x, this.player.y, this.currentShip.color, 140);
        // Damage nearby enemies during dash shockwave
        for (const enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
          if (dist < 140) {
            this.damageEnemy(enemy, 60, true);
          }
        }
      }
    }
  }

  public triggerScreenShake(intensity: number, duration: number) {
    if (!this.settings.screenShake) return;
    this.screenShakeIntensity = intensity;
    this.screenShakeTimer = duration;
  }

  // --- GAME LOOP ---
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTimestamp = performance.now();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    sound.stopMusic();
  }

  // --- UPDATE LOGIC ---
  private update(dt: number) {
    this.gameTime += dt;

    // Check Victory conditions
    if (this.gameMode === 'BLITZ' && this.gameTime >= this.targetDuration) {
      this.winGame();
      return;
    }

    // Update screen shake
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
    }

    // 1. Update Player
    this.updatePlayer(dt);

    // 2. Update Weapons & Projectiles
    this.updateWeapons(dt);
    this.updateProjectiles(dt);

    // 3. Update Enemies & Spawns
    this.updateEnemySpawns(dt);
    this.updateEnemies(dt);

    // 4. Update Drop items & Magnet
    this.updateDropItems(dt);

    // 5. Update Particles
    this.particles.update(dt);

    // 6. Update Camera
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
    this.camera.x = Math.max(0, Math.min(this.arenaWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.arenaHeight - this.canvas.height, this.camera.y));

    // 7. Update Combo
    if (this.player.combo > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.combo = 0;
      }
    }

    // Callback UI
    this.callbacks.onStatsUpdate(this.player);
  }

  private updatePlayer(dt: number) {
    // Movement Vector
    let mx = 0;
    let my = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

    // Mobile Joystick
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      mx = this.joystickVector.x;
      my = this.joystickVector.y;
    }

    const len = Math.hypot(mx, my);
    if (len > 0.01) {
      mx /= len;
      my /= len;
    }

    // Dash speed multiplier
    let currentSpeed = this.player.speed;
    if (this.player.isDashing) {
      currentSpeed *= 3.2;
      this.player.dashTimer -= dt;
      this.particles.addThrusterFlame(this.player.x, this.player.y, this.player.angle, this.currentShip.color, 2);

      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    }

    // Apply movement with acceleration/friction
    this.player.vx = mx * currentSpeed;
    this.player.vy = my * currentSpeed;

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Arena boundary clamp
    this.player.x = Math.max(this.player.radius + 10, Math.min(this.arenaWidth - this.player.radius - 10, this.player.x));
    this.player.y = Math.max(this.player.radius + 10, Math.min(this.arenaHeight - this.player.radius - 10, this.player.y));

    // Player aim angle
    {
      let targetEnemy = this.getCombatTarget(550);
      if (targetEnemy) {
        this.player.angle = Math.atan2(targetEnemy.y - this.player.y, targetEnemy.x - this.player.x);
      } else if (len > 0.1) {
        this.player.angle = Math.atan2(my, mx);
      }
    }

    // Invulnerability timer
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    // Shield Regeneration (after 3 seconds without taking damage)
    if (this.gameTime - this.player.lastShieldHitTime > this.balance.shieldRegenDelay && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + this.player.shieldRegenRate * dt);
    }

    // Thruster exhaust particles when moving
    if (len > 0.1) {
      this.particles.addThrusterFlame(this.player.x, this.player.y, this.player.angle, this.currentShip.color, 0.8);
    }
  }

  private updateWeapons(dt: number) {
    for (const weapon of this.weapons) {
      const effectiveCooldown = (weapon.cooldown / this.player.fireRateMultiplier);
      if (this.gameTime - weapon.lastFired >= effectiveCooldown) {
        this.fireWeapon(weapon);
        weapon.lastFired = this.gameTime;
      }
    }
  }

  private fireWeapon(weapon: WeaponItem) {
    const target = this.getCombatTarget(weapon.range);
    const permitsNoTarget = weapon.id === 'CRYO_NOVA' || weapon.id === 'PLASMA_ORBITER';
    if (!target && !permitsNoTarget) return;
    const damage = Math.round(weapon.damage * this.player.damageMultiplier);
    const isCrit = Math.random() < this.player.critChance;
    const finalDamage = isCrit ? Math.round(damage * this.player.critMultiplier) : damage;

    switch (weapon.id) {
      case 'PULSE_BLASTER': {
        const aim = predictiveIntercept(this.player, target!, target!, weapon.speed);
        const baseAngle = Math.atan2(aim.y - this.player.y, aim.x - this.player.x);
        const count = weapon.projectileCount;
        const spread = count > 1 ? 0.18 : 0;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spread;
          const a = baseAngle + offset;
          this.projectiles.push({
            id: this.projectileIdCounter++,
            x: this.player.x + Math.cos(a) * 20,
            y: this.player.y + Math.sin(a) * 20,
            vx: Math.cos(a) * weapon.speed,
            vy: Math.sin(a) * weapon.speed,
            radius: weapon.isEvolved ? 6 : 4,
            damage: finalDamage,
            isCrit,
            color: weapon.color,
            source: 'PLAYER',
            weaponType: weapon.id,
            pierce: weapon.pierce,
            lifetime: 0,
            maxLifetime: weapon.range / weapon.speed,
          });
        }
        sound.playLaser('PULSE');
        break;
      }

      case 'CHAIN_ARC': {
        // Find closest enemy to shock
        let target = this.getClosestEnemy(this.player.x, this.player.y, weapon.range);
        if (target) {
          this.triggerChainLightning(this.player.x, this.player.y, target, weapon.pierce, finalDamage, isCrit);
          sound.playLaser('CHAIN');
        }
        break;
      }

      case 'QUANTUM_TORPEDO': {
        // Target strongest or furthest enemy
        for (let i = 0; i < weapon.projectileCount; i++) {
          const a = this.player.angle + (Math.random() - 0.5) * 0.8;
          this.projectiles.push({
            id: this.projectileIdCounter++,
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(a) * weapon.speed,
            vy: Math.sin(a) * weapon.speed,
            radius: 7,
            damage: finalDamage,
            isCrit,
            color: weapon.color,
            source: 'PLAYER',
            weaponType: weapon.id,
            pierce: 1,
            lifetime: 0,
            maxLifetime: 3.5,
            homingTargetId: target!.id,
            isExplosive: true,
            explosionRadius: weapon.area,
          });
        }
        sound.playLaser('TORPEDO');
        break;
      }

      case 'CRYO_NOVA': {
        // Pulse freezing shockwave around player
        this.particles.addShockwave(this.player.x, this.player.y, weapon.color, weapon.range);
        sound.playLaser('CRYO');

        for (const enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
          if (dist <= weapon.range + enemy.radius) {
            enemy.frozenTimer = weapon.isEvolved ? 3.0 : 1.8;
            this.damageEnemy(enemy, finalDamage, isCrit);
          }
        }
        break;
      }

      case 'VOID_BLADE': {
        for (let i = 0; i < weapon.projectileCount; i++) {
          const angleOffset = (i - (weapon.projectileCount - 1) / 2) * 0.35;
          const a = this.player.angle + angleOffset;
          this.projectiles.push({
            id: this.projectileIdCounter++,
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(a) * weapon.speed,
            vy: Math.sin(a) * weapon.speed,
            radius: weapon.isEvolved ? 22 : 14,
            damage: finalDamage,
            isCrit,
            color: weapon.color,
            source: 'PLAYER',
            weaponType: weapon.id,
            pierce: weapon.pierce,
            lifetime: 0,
            maxLifetime: weapon.range / weapon.speed,
            hitEnemyIds: new Set(),
          });
        }
        sound.playLaser('BLADE');
        break;
      }
    }
  }

  private triggerChainLightning(
    startX: number, 
    startY: number, 
    firstTarget: Enemy, 
    maxChains: number, 
    damage: number, 
    isCrit: boolean
  ) {
    let currentX = startX;
    let currentY = startY;
    let currentTarget: Enemy | null = firstTarget;
    const hitIds = new Set<number>();

    for (let i = 0; i < maxChains && currentTarget; i++) {
      hitIds.add(currentTarget.id);
      this.damageEnemy(currentTarget, damage, isCrit);

      // Render lightning spark particles
      this.particles.addSparks(currentTarget.x, currentTarget.y, '#c084fc', 8, 220);

      // Find next closest unhit enemy
      currentX = currentTarget.x;
      currentY = currentTarget.y;
      currentTarget = this.getClosestEnemy(currentX, currentY, 260, hitIds);
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime += dt;

      // Homing missile logic
      if (p.homingTargetId && p.lifetime < 3.25) {
        let target = this.enemies.find(e => e.id === p.homingTargetId && validTarget(e, this.gameTime));
        if (!target) {
          target = this.getClosestEnemy(p.x, p.y, 450) || undefined;
          p.homingTargetId = target?.id;
        }
        if (target) {
          const velocity = turnVelocityToward(p, p, target, 3.2 * dt);
          p.vx = velocity.x; p.vy = velocity.y;

          // Smoke trail
          this.particles.addSparks(p.x, p.y, p.color, 1, 40);
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check boundary or lifetime expiration
      if (
        p.lifetime >= p.maxLifetime ||
        p.x < 0 || p.x > this.arenaWidth ||
        p.y < 0 || p.y > this.arenaHeight
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies (if player projectile)
      if (p.source === 'PLAYER') {
        let hit = false;
        for (const enemy of this.enemies) {
          if (p.hitEnemyIds && p.hitEnemyIds.has(enemy.id)) continue;

          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (dist < enemy.radius + p.radius) {
            hit = true;
            if (p.hitEnemyIds) p.hitEnemyIds.add(enemy.id);

            // Explosive area damage
            if (p.isExplosive && p.explosionRadius) {
              this.particles.addExplosion(p.x, p.y, p.color, 1.4);
              sound.playExplosion(false);
              for (const e of this.enemies) {
                const splashDist = Math.hypot(e.x - p.x, e.y - p.y);
                if (splashDist <= p.explosionRadius + e.radius) {
                  this.damageEnemy(e, p.damage, p.isCrit);
                }
              }
            } else {
              this.damageEnemy(enemy, p.damage, p.isCrit);
            }

            p.pierce -= 1;
            if (p.pierce <= 0) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else if (p.source === 'ENEMY') {
        // Enemy projectile hitting player
        const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (dist < this.player.radius + p.radius) {
          this.damagePlayer(p.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  // --- ENEMY SPAWNING & UPDATE ---
  private updateEnemySpawns(dt: number) {
    this.spawnTimer += dt;
    const timeMinutes = this.gameTime / 60;
    const bossTypes: EnemyType[] = ['BOSS_AEGIS','BOSS_LEVIATHAN','BOSS_ARCHON'];
    const flags = ['aegis','leviathan','archon'] as const;
    this.balance.bossTimes.forEach((time, index) => {
      if (this.gameTime >= time && !this.bossSpawnedFlags[flags[index]]) {
        this.bossSpawnedFlags[flags[index]] = true;
        this.spawnTimer = 0; // no simultaneous surge
        this.spawnBoss(bossTypes[index]);
      }
    });
    if (this.spawnTimer >= spawnIntervalAt(this.difficulty,this.gameTime) && this.enemies.length < enemyCapAt(this.difficulty,this.gameTime) && !this.enemies.some(e=>e.isBoss)) {
      this.spawnTimer = 0; this.spawnEnemyGroup(timeMinutes);
    }
  }

  private spawnEnemyGroup(timeMinutes: number) {
    const types: EnemyType[] = ['SWARMER'];
    if (canSpawnEnemy(this.difficulty,'CHARGER',this.gameTime)) types.push('CHARGER');
    if (canSpawnEnemy(this.difficulty,'SHOOTER',this.gameTime) && timeMinutes > 1.2) types.push('SHOOTER');
    if (canSpawnEnemy(this.difficulty,'HEAVY',this.gameTime) && timeMinutes > 2.0) types.push('HEAVY');

    const chosenType = types[Math.floor(Math.random() * types.length)];
    const count = chosenType === 'SWARMER' ? Math.min(6, 2 + Math.floor(timeMinutes)) : 1;

    for (let i = 0; i < count; i++) {
      this.spawnSingleEnemy(chosenType, timeMinutes);
    }
  }

  private spawnSingleEnemy(type: EnemyType, timeMinutes: number) {
    // Spawn in a ring outside camera viewport
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvas.width, this.canvas.height) * 0.65 + Math.random() * 150;
    const x = Math.max(40, Math.min(this.arenaWidth - 40, this.player.x + Math.cos(angle) * distance));
    const y = Math.max(40, Math.min(this.arenaHeight - 40, this.player.y + Math.sin(angle) * distance));

    const hpScale = 1 + timeMinutes * this.balance.healthGrowthPerMinute;
    let enemy: Enemy;

    switch (type) {
      case 'SWARMER':
        enemy = {
          id: this.enemyIdCounter++,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 12,
          type,
          health: Math.round(25 * hpScale),
          maxHealth: Math.round(25 * hpScale),
          damage: this.balance.enemyDamage.SWARMER,
          speed: this.balance.enemySpeed.SWARMER + Math.random() * 12,
          color: '#ef4444', // Red
          scoreValue: 50,
          xpValue: 4,
          isBoss: false,
          spawnProtectionUntil: this.gameTime + 0.7,
        };
        break;

      case 'CHARGER':
        enemy = {
          id: this.enemyIdCounter++,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 16,
          type,
          health: Math.round(65 * hpScale),
          maxHealth: Math.round(65 * hpScale),
          damage: this.balance.enemyDamage.CHARGER,
          speed: this.balance.enemySpeed.CHARGER,
          color: '#f97316', // Orange
          scoreValue: 120,
          xpValue: 8,
          isBoss: false,
          spawnProtectionUntil: this.gameTime + 0.7,
          chargeCooldown: 3.0,
          isCharging: false,
        };
        break;

      case 'SHOOTER':
        enemy = {
          id: this.enemyIdCounter++,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 15,
          type,
          health: Math.round(50 * hpScale),
          maxHealth: Math.round(50 * hpScale),
          damage: this.balance.enemyDamage.SHOOTER,
          speed: this.balance.enemySpeed.SHOOTER,
          color: '#a855f7', // Purple
          scoreValue: 150,
          xpValue: 10,
          isBoss: false,
          spawnProtectionUntil: this.gameTime + 0.7,
          shootCooldown: 2.2,
          lastShotTime: this.gameTime + Math.random(),
        };
        break;

      case 'HEAVY':
        enemy = {
          id: this.enemyIdCounter++,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 26,
          type,
          health: Math.round(220 * hpScale),
          maxHealth: Math.round(220 * hpScale),
          damage: this.balance.enemyDamage.HEAVY,
          speed: this.balance.enemySpeed.HEAVY,
          color: '#eab308', // Amber
          scoreValue: 300,
          xpValue: 25,
          isBoss: false,
          spawnProtectionUntil: this.gameTime + 0.7,
        };
        break;

      default:
        return;
    }

    this.enemies.push(enemy);
  }

  private spawnBoss(type: EnemyType) {
    const angle = Math.random() * Math.PI * 2;
    const x = this.player.x + Math.cos(angle) * 550;
    const y = this.player.y + Math.sin(angle) * 550;

    let bossName = 'FANG WARDEN';
    let boss: Enemy;

    if (type === 'BOSS_AEGIS') {
      bossName = 'FANG WARDEN';
      boss = {
        id: this.enemyIdCounter++,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 48,
        type,
        health: 2200,
        maxHealth: 2200,
        damage: 45,
        speed: 65,
        color: '#38bdf8',
        scoreValue: 5000,
        xpValue: 150,
        isBoss: true,
        bossPhase: 1,
        shootCooldown: 1.8,
        lastShotTime: this.gameTime,
      };
    } else if (type === 'BOSS_LEVIATHAN') {
      bossName = 'COILBREAKER';
      boss = {
        id: this.enemyIdCounter++,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 54,
        type,
        health: 4500,
        maxHealth: 4500,
        damage: 55,
        speed: 85,
        color: '#f43f5e',
        scoreValue: 10000,
        xpValue: 300,
        isBoss: true,
        bossPhase: 1,
        shootCooldown: 1.2,
        lastShotTime: this.gameTime,
      };
    } else {
      bossName = 'VENOM CROWN';
      boss = {
        id: this.enemyIdCounter++,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 60,
        type: 'BOSS_ARCHON',
        health: 8000,
        maxHealth: 8000,
        damage: 65,
        speed: 75,
        color: '#c084fc',
        scoreValue: 20000,
        xpValue: 500,
        isBoss: true,
        bossPhase: 1,
        shootCooldown: 0.9,
        lastShotTime: this.gameTime,
      };
    }

    boss.health *= this.balance.bossHealthMultiplier; boss.maxHealth = boss.health; boss.damage *= this.balance.bossDamageMultiplier;
    this.enemies.push(boss);
    this.triggerScreenShake(8, 0.4);
    sound.playBossAlarm();
    this.callbacks.onBossSpawn(bossName);
  }

  private updateEnemies(dt: number) {
    // Update Plasma Orbiters hit collision directly
    const orbiter = this.weapons.find(w => w.id === 'PLASMA_ORBITER');
    if (orbiter) {
      const orbiterCount = orbiter.projectileCount;
      const baseDamage = Math.round(orbiter.damage * this.player.damageMultiplier);
      const isCrit = Math.random() < this.player.critChance;
      const finalDmg = isCrit ? Math.round(baseDamage * this.player.critMultiplier) : baseDamage;

      for (let i = 0; i < orbiterCount; i++) {
        const orbAngle = this.gameTime * orbiter.speed + (i * Math.PI * 2) / orbiterCount;
        const orbX = this.player.x + Math.cos(orbAngle) * orbiter.range;
        const orbY = this.player.y + Math.sin(orbAngle) * orbiter.range;
        const orbRadius = orbiter.isEvolved ? 14 : 10;

        for (const enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - orbX, enemy.y - orbY);
          if (dist < enemy.radius + orbRadius) {
            this.damageEnemy(enemy, finalDmg * dt * 3.5, isCrit);
            this.particles.addSparks(orbX, orbY, orbiter.color, 1, 60);
          }
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Frozen timer
      if (e.frozenTimer && e.frozenTimer > 0) {
        e.frozenTimer -= dt;
      }
      const speedMult = e.frozenTimer && e.frozenTimer > 0 ? 0.35 : 1.0;

      // Hit flash timer
      if (e.hitFlashTimer && e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      // AI behaviors
      const angleToPlayer = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      const distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);

      if (e.type === 'CHARGER') {
        if (!e.isCharging) {
          e.vx = Math.cos(angleToPlayer) * e.speed * speedMult;
          e.vy = Math.sin(angleToPlayer) * e.speed * speedMult;
          if (distToPlayer < 240) {
            e.isCharging = true;
            e.chargeTarget = { x: this.player.x, y: this.player.y };
          }
        } else if (e.chargeTarget) {
          // Rush towards locked target point
          const cAngle = Math.atan2(e.chargeTarget.y - e.y, e.chargeTarget.x - e.x);
          e.vx = Math.cos(cAngle) * e.speed * 2.8 * speedMult;
          e.vy = Math.sin(cAngle) * e.speed * 2.8 * speedMult;
          this.particles.addThrusterFlame(e.x, e.y, cAngle, '#f97316', 0.5);

          const reachDist = Math.hypot(e.chargeTarget.x - e.x, e.chargeTarget.y - e.y);
          if (reachDist < 20) {
            e.isCharging = false;
          }
        }
      } else if (e.type === 'SHOOTER') {
        // Maintain standoff distance ~300px
        if (distToPlayer < 260) {
          e.vx = -Math.cos(angleToPlayer) * e.speed * speedMult;
          e.vy = -Math.sin(angleToPlayer) * e.speed * speedMult;
        } else if (distToPlayer > 360) {
          e.vx = Math.cos(angleToPlayer) * e.speed * speedMult;
          e.vy = Math.sin(angleToPlayer) * e.speed * speedMult;
        } else {
          // Strafe
          e.vx = Math.cos(angleToPlayer + Math.PI / 2) * e.speed * 0.7 * speedMult;
          e.vy = Math.sin(angleToPlayer + Math.PI / 2) * e.speed * 0.7 * speedMult;
        }

        // Shoot at player
        if (this.gameTime - (e.lastShotTime || 0) >= (e.shootCooldown || 2.2)) {
          e.lastShotTime = this.gameTime;
          this.projectiles.push({
            id: this.projectileIdCounter++,
            x: e.x,
            y: e.y,
            vx: Math.cos(angleToPlayer) * 240,
            vy: Math.sin(angleToPlayer) * 240,
            radius: 5,
            damage: e.damage,
            isCrit: false,
            color: '#c084fc',
            source: 'ENEMY',
            pierce: 1,
            lifetime: 0,
            maxLifetime: 4.0,
          });
        }
      } else if (e.isBoss) {
        // Boss specialized pattern
        e.vx = Math.cos(angleToPlayer) * e.speed * speedMult;
        e.vy = Math.sin(angleToPlayer) * e.speed * speedMult;

        // Spiral nova bullets
        if (this.gameTime - (e.lastShotTime || 0) >= (e.shootCooldown || 1.5)) {
          e.lastShotTime = this.gameTime;
          const bulletCount = e.type === 'BOSS_ARCHON' ? 12 : 8;
          for (let b = 0; b < bulletCount; b++) {
            const bAngle = (this.gameTime * 2.5) + (b * Math.PI * 2) / bulletCount;
            this.projectiles.push({
              id: this.projectileIdCounter++,
              x: e.x,
              y: e.y,
              vx: Math.cos(bAngle) * 220,
              vy: Math.sin(bAngle) * 220,
              radius: 6,
              damage: e.damage,
              isCrit: false,
              color: e.color,
              source: 'ENEMY',
              pierce: 1,
              lifetime: 0,
              maxLifetime: 4.5,
            });
          }
        }
      } else {
        // Default swarmer / heavy movement straight to player
        e.vx = Math.cos(angleToPlayer) * e.speed * speedMult;
        e.vy = Math.sin(angleToPlayer) * e.speed * speedMult;
      }

      // Separation from other enemies (avoid stacking)
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const other = this.enemies[j];
        const dx = e.x - other.x;
        const dy = e.y - other.y;
        const d = Math.hypot(dx, dy);
        const minDist = e.radius + other.radius;
        if (d < minDist && d > 0.01) {
          const push = (minDist - d) / 2;
          e.x += (dx / d) * push;
          e.y += (dy / d) * push;
          other.x -= (dx / d) * push;
          other.y -= (dy / d) * push;
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Check collision with player
      if (distToPlayer < this.player.radius + e.radius && this.gameTime >= (e.spawnProtectionUntil || 0)) {
        this.damagePlayer(e.damage);
      }
    }
  }

  // --- DAMAGE & REWARDS ---
  public damageEnemy(enemy: Enemy, rawDamage: number, isCrit: boolean = false) {
    const damage = Math.max(1, Math.round(rawDamage));
    enemy.health -= damage;
    enemy.hitFlashTimer = 0.1;
    this.player.totalDamageDealt += damage;

    // Visuals & Sound
    this.particles.addFloatingText(enemy.x, enemy.y, damage.toString(), isCrit ? '#fbbf24' : '#f87171', isCrit);
    this.particles.addSparks(enemy.x, enemy.y, enemy.color, isCrit ? 10 : 4, 160);

    if (isCrit) {
      sound.playCritHit();
    } else {
      sound.playHit();
    }

    // Enemy Death
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.player.kills += 1;
    this.player.score += enemy.scoreValue * (1 + this.player.combo * 0.1);

    // Combo system
    this.player.combo += 1;
    this.player.comboTimer = 2.5; // combo lasts 2.5s
    if (this.player.combo > this.player.maxCombo) {
      this.player.maxCombo = this.player.combo;
    }

    // Explosion & Sound
    this.particles.addExplosion(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 2.8 : 1.0);
    sound.playExplosion(enemy.isBoss);

    if (enemy.isBoss) {
      this.triggerScreenShake(12, 0.5);
    }

    // Drops
    this.spawnDrops(enemy);
  }

  private spawnDrops(enemy: Enemy) {
    // 1. XP Gem (Guaranteed)
    this.dropItems.push({
      id: this.dropIdCounter++,
      x: enemy.x,
      y: enemy.y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      radius: enemy.isBoss ? 12 : 7,
      type: 'XP_GEM',
      value: enemy.xpValue,
      color: enemy.isBoss ? '#f59e0b' : '#38bdf8',
      pulseTimer: Math.random() * Math.PI,
    });

    // 2. Chance for Special Tactical Drops
    const rand = Math.random();
    if (enemy.isBoss || rand < this.balance.healDropChance) {
      let type: DropItem['type'] = 'HEALTH_ORB';
      let color = '#10b981';
      let value = 35;

      if (rand < 0.015) {
        type = 'NUKE';
        color = '#ef4444';
      } else if (rand < 0.03) {
        type = 'MAGNET';
        color = '#a855f7';
      } else if (rand < 0.045) {
        type = 'FREEZE';
        color = '#06b6d4';
      }

      this.dropItems.push({
        id: this.dropIdCounter++,
        x: enemy.x + (Math.random() - 0.5) * 20,
        y: enemy.y + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: 11,
        type,
        value,
        color,
        pulseTimer: 0,
      });
    }
  }

  private updateDropItems(dt: number) {
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const item = this.dropItems[i];
      item.pulseTimer += dt * 3;

      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);

      // Magnet attraction
      if (dist < this.player.magnetRadius || item.isAttracted) {
        item.isAttracted = true;
        const angle = Math.atan2(this.player.y - item.y, this.player.x - item.x);
        const pullSpeed = Math.min(850, 420 + (1 - dist / this.player.magnetRadius) * 450);
        item.x += Math.cos(angle) * pullSpeed * dt;
        item.y += Math.sin(angle) * pullSpeed * dt;
      }

      // Collect item
      if (dist < this.player.radius + item.radius + 6) {
        this.collectDrop(item);
        this.dropItems.splice(i, 1);
      }
    }
  }

  private collectDrop(item: DropItem) {
    switch (item.type) {
      case 'XP_GEM':
        this.gainXp(item.value);
        sound.playGemCollect(Math.min(8, this.player.combo));
        break;

      case 'HEALTH_ORB':
        this.player.health = Math.min(this.player.maxHealth, this.player.health + item.value);
        this.particles.addFloatingText(this.player.x, this.player.y, `+${item.value} HP`, '#10b981');
        sound.playPowerup();
        break;

      case 'NUKE':
        this.triggerScreenShake(14, 0.6);
        this.particles.addShockwave(this.player.x, this.player.y, '#ef4444', 600);
        sound.playExplosion(true);
        // Wipe all regular enemies
        for (const e of [...this.enemies]) {
          this.damageEnemy(e, e.isBoss ? 600 : 9999, true);
        }
        break;

      case 'MAGNET':
        sound.playPowerup();
        this.particles.addShockwave(this.player.x, this.player.y, '#a855f7', 400);
        for (const d of this.dropItems) {
          d.isAttracted = true;
        }
        break;

      case 'FREEZE':
        sound.playLaser('CRYO');
        this.particles.addShockwave(this.player.x, this.player.y, '#06b6d4', 500);
        for (const e of this.enemies) {
          e.frozenTimer = 5.0;
        }
        break;
    }
  }

  public gainXp(amount: number) {
    this.player.xp += amount;
    while (this.player.xp >= this.player.nextLevelXp) {
      this.player.xp -= this.player.nextLevelXp;
      this.player.level += 1;
      this.player.nextLevelXp = Math.round(this.player.nextLevelXp * 1.35 + 10);

      sound.playLevelUp();
      this.particles.addShockwave(this.player.x, this.player.y, '#38bdf8', 180);
      const upgrade = selectAutomaticUpgrade({
        activeWeapons: this.weapons, activePassives: this.passives,
        health: this.player.health, maxHealth: this.player.maxHealth,
        level: this.player.level, history: this.upgradeHistory, maxSlots: 3,
      });
      if (upgrade) {
        this.applyUpgrade(upgrade.id, upgrade.targetId);
        this.upgradeHistory.push(upgrade.targetId);
        this.callbacks.onLevelUp(this.player.level, upgrade);
      }
    }
  }

  private getCombatTarget(range: number): Enemy | null {
    const locked = this.enemies.find(e => e.id === this.lockedTargetId && validTarget(e, this.gameTime));
    const lockedDistance = locked ? Math.hypot(locked.x - this.player.x, locked.y - this.player.y) : Infinity;
    const candidates = this.enemies.filter(e => validTarget(e, this.gameTime) && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= range);
    if (!candidates.length) { this.lockedTargetId = null; return null; }
    candidates.sort((a, b) => {
      const threat = (e: Enemy) => Math.hypot(e.x - this.player.x, e.y - this.player.y) - (e.isBoss ? 140 : 0) - e.damage * 2;
      return threat(a) - threat(b);
    });
    const best = candidates[0];
    if (locked && lockedDistance <= range && (this.gameTime < this.targetLockUntil || lockedDistance <= Math.hypot(best.x-this.player.x,best.y-this.player.y) * 1.35)) return locked;
    this.lockedTargetId = best.id; this.targetLockUntil = this.gameTime + 0.45;
    return best;
  }

  public damagePlayer(rawAmount: number) {
    if (this.player.invulnerableTimer > 0 || !this.isRunning || this.isPaused) return;

    this.player.lastShieldHitTime = this.gameTime;
    this.player.invulnerableTimer = this.balance.invulnerabilitySeconds;
    this.triggerScreenShake(6, 0.2);

    let remainingDamage = rawAmount;

    // Shield takes hit first
    if (this.player.shield > 0) {
      if (this.player.shield >= remainingDamage) {
        this.player.shield -= remainingDamage;
        remainingDamage = 0;
        this.particles.addSparks(this.player.x, this.player.y, '#06b6d4', 8, 150);
      } else {
        remainingDamage -= this.player.shield;
        this.player.shield = 0;
        this.particles.addShockwave(this.player.x, this.player.y, '#06b6d4', 80);
      }
    }

    if (remainingDamage > 0) {
      this.player.health -= remainingDamage;
      this.particles.addSparks(this.player.x, this.player.y, '#ef4444', 12, 180);
      sound.playHit();
    }

    if (this.player.health <= 0) {
      this.player.health = 0;
      this.gameOver();
    }
  }

  private gameOver() {
    this.isRunning = false;
    sound.stopMusic();
    sound.playGameOver();
    this.callbacks.onGameOver(this.player, false);
  }

  private winGame() {
    this.isRunning = false;
    sound.stopMusic();
    sound.playVictory();
    this.callbacks.onGameOver(this.player, true);
  }

  // --- HELPERS ---
  private getClosestEnemy(x: number, y: number, maxRange: number, excludeIds?: Set<number>): Enemy | null {
    let closest: Enemy | null = null;
    let minDist = maxRange;
    for (const e of this.enemies) {
      if (excludeIds && excludeIds.has(e.id)) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  private getStrongestEnemy(): Enemy | null {
    let strongest: Enemy | null = null;
    let maxHp = -1;
    for (const e of this.enemies) {
      if (e.health > maxHp) {
        maxHp = e.health;
        strongest = e;
      }
    }
    return strongest;
  }

  // --- RENDERING ---
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen Shake transform
    if (this.screenShakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Dark Void Space Backdrop
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Apply Camera translation
    ctx.translate(-this.camera.x, -this.camera.y);

    // 2. Cyber Cybernetic Grid Lines
    this.renderGrid(ctx);

    // 3. Render Arena Boundaries
    this.renderBoundary(ctx);

    // 4. Render Drop Items
    this.renderDropItems(ctx);

    // 5. Render Enemies
    this.renderEnemies(ctx);

    // 6. Render Player
    this.renderPlayer(ctx);

    // 7. Render Projectiles & Weapons
    this.renderProjectiles(ctx);

    // 8. Render Particles & Floating Damage Texts
    this.particles.render(ctx, this.settings.damageNumbers);

    ctx.restore();
  }

  private renderGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 80;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const endX = this.camera.x + this.canvas.width + gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endY = this.camera.y + this.canvas.height + gridSize;

    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  private renderBoundary(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, this.arenaWidth, this.arenaHeight);

    // Hazard corner markers
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 2;
    const pulse = (Math.sin(this.gameTime * 4) + 1) * 0.5;
    ctx.strokeRect(10, 10, this.arenaWidth - 20, this.arenaHeight - 20);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Shield Dome Aura
    if (p.shield > 0) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6 + Math.sin(this.gameTime * 6) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Invulnerability Flashing
    if (p.invulnerableTimer > 0 && Math.floor(this.gameTime * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Ship Body Triangle Craft
    ctx.fillStyle = this.currentShip.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(p.radius + 4, 0); // Nose tip
    ctx.lineTo(-p.radius, -p.radius * 0.85); // Left wing
    ctx.lineTo(-p.radius * 0.5, 0); // Engine indent
    ctx.lineTo(-p.radius, p.radius * 0.85); // Right wing
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.radius * 0.2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render Plasma Orbiters revolving around player
    const orbiter = this.weapons.find(w => w.id === 'PLASMA_ORBITER');
    if (orbiter) {
      const orbCount = orbiter.projectileCount;
      for (let i = 0; i < orbCount; i++) {
        const orbAngle = this.gameTime * orbiter.speed + (i * Math.PI * 2) / orbCount;
        const orbX = p.x + Math.cos(orbAngle) * orbiter.range;
        const orbY = p.y + Math.sin(orbAngle) * orbiter.range;
        const orbRadius = orbiter.isEvolved ? 11 : 7;

        ctx.fillStyle = orbiter.color;
        ctx.shadowColor = orbiter.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (this.gameTime < (e.spawnProtectionUntil || 0)) {
        ctx.globalAlpha = 0.38; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,e.radius+9,0,Math.PI*2); ctx.stroke();
      }

      // Hit Flash (White)
      if (e.hitFlashTimer && e.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
      } else if (e.frozenTimer && e.frozenTimer > 0) {
        ctx.fillStyle = '#38bdf8'; // Frozen Ice Blue
      } else {
        ctx.fillStyle = e.color;
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = e.isBoss ? 3 : 1.5;

      // Distinct enemy shapes
      if (e.type === 'SWARMER') {
        // Diamond / Tetrahedron
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(e.radius, 0);
        ctx.lineTo(0, e.radius);
        ctx.lineTo(-e.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'CHARGER') {
        // Pointy Triangle
        const angle = Math.atan2(e.vy, e.vx) || 0;
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius, -e.radius * 0.7);
        ctx.lineTo(-e.radius * 0.4, 0);
        ctx.lineTo(-e.radius, e.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'SHOOTER') {
        // Hexagon Turret
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * e.radius;
          const py = Math.sin(a) * e.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'HEAVY') {
        // Armored Octagon
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const px = Math.cos(a) * e.radius;
          const py = Math.sin(a) * e.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.isBoss) {
        // Massive Boss Core with rotating rings
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Rotating outer ring
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 12, this.gameTime * 2, this.gameTime * 2 + Math.PI * 1.5);
        ctx.stroke();
      }

      ctx.restore();

      // Enemy Health Bar (for tough enemies / bosses)
      if (e.health < e.maxHealth || e.isBoss) {
        const barWidth = e.radius * 2.2;
        const barHeight = e.isBoss ? 6 : 4;
        const barX = e.x - barWidth / 2;
        const barY = e.y - e.radius - (e.isBoss ? 16 : 9);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpRatio = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = e.isBoss ? '#f43f5e' : '#ef4444';
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
      }
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#ffffff';

      if (p.weaponType === 'VOID_BLADE') {
        // Crescent Blade Slice Arc
        const angle = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, -Math.PI / 2, Math.PI / 2);
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        // Glowing round / bullet projectile
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderDropItems(ctx: CanvasRenderingContext2D) {
    for (const item of this.dropItems) {
      ctx.save();
      ctx.translate(item.x, item.y);
      const pulseScale = 1 + Math.sin(item.pulseTimer) * 0.15;

      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;

      if (item.type === 'XP_GEM') {
        // Diamond Gem
        ctx.beginPath();
        ctx.moveTo(0, -item.radius * pulseScale);
        ctx.lineTo(item.radius * pulseScale, 0);
        ctx.lineTo(0, item.radius * pulseScale);
        ctx.lineTo(-item.radius * pulseScale, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Glowing Orb with Inner Icon / Ring
        ctx.beginPath();
        ctx.arc(0, 0, item.radius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
