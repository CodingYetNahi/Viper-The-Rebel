import type { ControlScheme } from '../types.ts';

export const CONTROL_DEAD_ZONE = 0.12;
export type MovementVector = { x: number; y: number };

export function movementFromDrag(dx: number, dy: number, radius = 50): MovementVector {
  const distance = Math.hypot(dx, dy);
  if (distance < radius * CONTROL_DEAD_ZONE) return { x: 0, y: 0 };
  const strength = Math.min(1, (distance / radius - CONTROL_DEAD_ZONE) / (1 - CONTROL_DEAD_ZONE));
  return { x: dx / distance * strength, y: dy / distance * strength };
}

export const releasedMovement = (): MovementVector => ({ x: 0, y: 0 });
export const isControlScheme = (value: unknown): value is ControlScheme => value === 'JOYSTICK' || value === 'TOUCH';
