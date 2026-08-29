export const MAX_FRAME_DELTA_SECONDS = 0.05;

export function frameDeltaSeconds(timestamp: number, previousTimestamp: number): number {
  if (!Number.isFinite(timestamp) || !Number.isFinite(previousTimestamp) || timestamp <= previousTimestamp) return 0;
  return Math.min(MAX_FRAME_DELTA_SECONDS, (timestamp - previousTimestamp) / 1000);
}
