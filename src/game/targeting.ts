import type { Enemy } from '../types.ts';

export interface Vector { x: number; y: number }

export function predictiveIntercept(origin: Vector, target: Vector, velocity: Vector, projectileSpeed: number, maxTime = 2.5): Vector {
  const rx = target.x - origin.x, ry = target.y - origin.y;
  const a = velocity.x ** 2 + velocity.y ** 2 - projectileSpeed ** 2;
  const b = 2 * (rx * velocity.x + ry * velocity.y);
  const c = rx ** 2 + ry ** 2;
  let time = NaN;
  if (Math.abs(a) < 1e-8) time = b < 0 ? -c / b : NaN;
  else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const roots = [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)].filter(t => t > 0);
      time = Math.min(...roots);
    }
  }
  if (!Number.isFinite(time) || time <= 0 || time > maxTime) return { ...target };
  return { x: target.x + velocity.x * time, y: target.y + velocity.y * time };
}

export function turnVelocityToward(velocity: Vector, from: Vector, target: Vector, maxTurnRadians: number): Vector {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (!speed) return velocity;
  const current = Math.atan2(velocity.y, velocity.x);
  const desired = Math.atan2(target.y - from.y, target.x - from.x);
  const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
  const angle = current + Math.sign(delta) * Math.min(Math.abs(delta), Math.max(0, maxTurnRadians));
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

export function validTarget(enemy: Enemy, now: number): boolean {
  return enemy.health > 0 && (!enemy.spawnProtectionUntil || enemy.spawnProtectionUntil <= now);
}
