import { FloatingText, Particle } from '../types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  private textIdCounter = 1;

  public addSparks(x: number, y: number, color: string, count: number = 8, speed: number = 180) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 2.5 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 1.5 + 1.5,
        shape: 'SPARK',
      });
    }
  }

  public addExplosion(x: number, y: number, color: string, sizeMultiplier: number = 1) {
    const count = Math.floor(24 * sizeMultiplier);
    // 1. Shockwave Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15 * sizeMultiplier,
      color,
      alpha: 0.9,
      decay: 2.2 / sizeMultiplier,
      shape: 'RING',
      vRot: 140 * sizeMultiplier, // Expanding rate
    });

    // 2. Fiery / Energetic Embers
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 220 + 80) * sizeMultiplier;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: (Math.random() * 4 + 2) * sizeMultiplier,
        color: Math.random() > 0.4 ? color : '#ffffff',
        alpha: 1,
        decay: Math.random() * 1.2 + 0.8,
        shape: 'CIRCLE',
      });
    }
  }

  public addShockwave(x: number, y: number, color: string, radius: number = 120) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 10,
      color,
      alpha: 1,
      decay: 2.5,
      shape: 'RING',
      vRot: radius * 3.5, // Ring expansion
    });
  }

  public addThrusterFlame(x: number, y: number, angle: number, color: string, intensity: number = 1) {
    const spread = 0.4;
    const flameAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
    const spd = Math.random() * 120 + 80 * intensity;
    this.particles.push({
      x,
      y,
      vx: Math.cos(flameAngle) * spd,
      vy: Math.sin(flameAngle) * spd,
      size: Math.random() * 3 + 2,
      color: Math.random() > 0.3 ? color : '#ffffff',
      alpha: 0.8,
      decay: 3.5,
      shape: 'CIRCLE',
    });
  }

  public addFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: this.textIdCounter++,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text,
      color,
      alpha: 1,
      scale: isCrit ? 1.4 : 1.0,
      vy: isCrit ? -70 : -45,
      lifetime: isCrit ? 0.9 : 0.65,
    });
  }

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.92, dt * 60);
      p.vy *= Math.pow(0.92, dt * 60);

      if (p.shape === 'RING' && p.vRot) {
        p.size += p.vRot * dt;
      }

      p.alpha -= p.decay * dt;

      if (p.alpha <= 0 || p.size <= 0.1) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.lifetime -= dt;
      t.alpha = Math.max(0, t.lifetime / 0.7);

      if (t.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Cap maximum particles for performance
    if (this.particles.length > 400) {
      this.particles.splice(0, this.particles.length - 400);
    }
  }

  public render(ctx: CanvasRenderingContext2D, showDamageNumbers: boolean = true) {
    // Render particles
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'RING') {
        ctx.lineWidth = Math.max(1, 3 * p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'SPARK') {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Render floating texts
    if (showDamageNumbers && this.floatingTexts.length > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const t of this.floatingTexts) {
        ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));
        ctx.font = `bold ${Math.round(14 * t.scale)}px "JetBrains Mono", monospace`;
        
        // Dark outline for supreme legibility
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y);

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
