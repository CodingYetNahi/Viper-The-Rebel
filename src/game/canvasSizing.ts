export const MAX_CANVAS_DPR = 2;

export interface CanvasSize {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  dpr: number;
}

export function calculateCanvasSize(width: number, height: number, devicePixelRatio = 1): CanvasSize {
  const cssWidth = Math.max(1, Math.round(width));
  const cssHeight = Math.max(1, Math.round(height));
  const dpr = Math.min(MAX_CANVAS_DPR, Math.max(1, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1));
  return { cssWidth, cssHeight, pixelWidth: Math.round(cssWidth * dpr), pixelHeight: Math.round(cssHeight * dpr), dpr };
}

export function applyCanvasSize(canvas: HTMLCanvasElement, size: CanvasSize): void {
  canvas.style.width = `${size.cssWidth}px`;
  canvas.style.height = `${size.cssHeight}px`;
  if (canvas.width !== size.pixelWidth) canvas.width = size.pixelWidth;
  if (canvas.height !== size.pixelHeight) canvas.height = size.pixelHeight;
}
