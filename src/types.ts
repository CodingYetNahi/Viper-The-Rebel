export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'LEVEL_UP' | 'GAME_OVER' | 'VICTORY';
export type GameMode = 'ENDLESS' | 'BLITZ' | 'BOSS_RUSH';
export type Difficulty = 'ROOKIE' | 'REBEL' | 'ELITE';
export type ControlScheme = 'JOYSTICK' | 'TOUCH';

export interface ShipDefinition {
  id: string;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  color: string;
  glowColor: string;
  baseHealth: number;
  baseShield: number;
  shieldRegen: number;
  speed: number;
  critChance: number;
  critMultiplier: number;
  startingWeaponId: string;
  passiveDescription: string;
  perk: {
    type: 'SPEED' | 'SHIELD' | 'CRIT' | 'DEFENSIVE_SHOCKWAVE';
    value: number;
  };
}

export type WeaponType = 
  | 'PULSE_BLASTER'
  | 'PLASMA_ORBITER'
  | 'CHAIN_ARC'
  | 'QUANTUM_TORPEDO'
  | 'CRYO_NOVA'
  | 'VOID_BLADE';

export interface WeaponItem {
  id: WeaponType;
  name: string;
  evolvedName: string;
  level: number;
  maxLevel: number;
  isEvolved: boolean;
  evolutionRequirement: string;
  description: string;
  evolvedDescription: string;
  color: string;
  icon: string;
  cooldown: number;
  lastFired: number;
  damage: number;
  projectileCount: number;
  pierce: number;
  speed: number;
  range: number;
  area: number;
}

export type PassiveType =
  | 'MAX_HEALTH'
  | 'SHIELD_REGEN'
  | 'MOVE_SPEED'
  | 'ATTACK_SPEED'
  | 'DAMAGE'
  | 'MAGNET_RADIUS'
  | 'CRIT_RATE';

export interface PassiveItem {
  id: PassiveType;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  icon: string;
  color: string;
  statBonusPerLevel: number;
}

export type UpgradeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'EVOLUTION';

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  type: 'NEW_WEAPON' | 'UPGRADE_WEAPON' | 'EVOLVE_WEAPON' | 'NEW_PASSIVE' | 'UPGRADE_PASSIVE' | 'HEAL_FULL' | 'OVERCHARGE';
  targetId: string;
  rarity: UpgradeRarity;
  icon: string;
  color: string;
  statChange?: string;
}

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenRate: number;
  lastShieldHitTime: number;
  speed: number;
  invulnerableTimer: number;
  damageReduction: number;
  magnetRadius: number;
  critChance: number;
  critMultiplier: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  xp: number;
  level: number;
  nextLevelXp: number;
  score: number;
  kills: number;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  totalDamageDealt: number;
}

export type EnemyType = 
  | 'SWARMER' 
  | 'CHARGER' 
  | 'SHOOTER' 
  | 'HEAVY' 
  | 'BOSS_AEGIS' 
  | 'BOSS_LEVIATHAN' 
  | 'BOSS_ARCHON';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  color: string;
  scoreValue: number;
  xpValue: number;
  isBoss: boolean;
  shootCooldown?: number;
  lastShotTime?: number;
  chargeCooldown?: number;
  isCharging?: boolean;
  chargeTarget?: { x: number; y: number };
  bossPhase?: number;
  specialTimer?: number;
  rotation?: number;
  hitFlashTimer?: number;
  frozenTimer?: number;
  spawnProtectionUntil?: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  color: string;
  source: 'PLAYER' | 'ENEMY';
  weaponType?: WeaponType;
  pierce: number;
  lifetime: number;
  maxLifetime: number;
  homingTargetId?: number;
  isExplosive?: boolean;
  explosionRadius?: number;
  freezeDuration?: number;
  chainCount?: number;
  hitEnemyIds?: Set<number>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'CIRCLE' | 'SQUARE' | 'RING' | 'SPARK' | 'LINE';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  lifetime: number;
}

export type DropItemType = 'XP_GEM' | 'HEALTH_ORB' | 'NUKE' | 'MAGNET' | 'FREEZE';

export interface DropItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: DropItemType;
  value: number;
  color: string;
  pulseTimer: number;
  isAttracted?: boolean;
}

export interface GameSettings {
  difficulty: Difficulty;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  screenShake: boolean;
  damageNumbers: boolean;
  bloomFX: boolean;
  autoAim: boolean;
  particleDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  controlScheme: ControlScheme;
}

export interface HighScoreEntry {
  date: string;
  score: number;
  survivalTime: number;
  kills: number;
  level: number;
  shipId: string;
  mode: GameMode;
}
