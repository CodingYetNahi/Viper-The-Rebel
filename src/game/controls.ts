import type { ControlScheme } from '../types.ts';

export const CONTROL_DEAD_ZONE = 0.12;
export type MovementVector = { x: number; y: number };
export type ControlIntent = { moveX: number; moveY: number; pause: boolean };

export function movementFromDrag(dx: number, dy: number, radius = 50): MovementVector {
  const distance = Math.hypot(dx, dy);
  if (distance < radius * CONTROL_DEAD_ZONE) return { x: 0, y: 0 };
  const strength = Math.min(1, (distance / radius - CONTROL_DEAD_ZONE) / (1 - CONTROL_DEAD_ZONE));
  return { x: dx / distance * strength, y: dy / distance * strength };
}

export const releasedMovement = (): MovementVector => ({ x: 0, y: 0 });
export const isControlScheme = (value: unknown): value is ControlScheme => value === 'JOYSTICK' || value === 'TOUCH';

export function normalizeMovement(x: number, y: number): MovementVector {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return releasedMovement();
  const length = Math.hypot(x, y);
  if (length <= CONTROL_DEAD_ZONE) return releasedMovement();
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

export function controlIntent(keys: Readonly<Record<string, boolean>>, pointer: MovementVector): ControlIntent {
  let moveX = Number(Boolean(keys.KeyD || keys.ArrowRight)) - Number(Boolean(keys.KeyA || keys.ArrowLeft));
  let moveY = Number(Boolean(keys.KeyS || keys.ArrowDown)) - Number(Boolean(keys.KeyW || keys.ArrowUp));
  if (Math.hypot(pointer.x, pointer.y) > CONTROL_DEAD_ZONE) {
    moveX = pointer.x;
    moveY = pointer.y;
  }
  const movement = normalizeMovement(moveX, moveY);
  return { moveX: movement.x, moveY: movement.y, pause: Boolean(keys.Escape || keys.KeyP) };
}
