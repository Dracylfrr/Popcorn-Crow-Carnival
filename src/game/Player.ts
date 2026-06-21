import { TUNING, WORLD, type Bounds } from './types';

export class Player {
  x = WORLD.width / 2; readonly y = WORLD.groundY - 72; readonly width = 72; readonly height = 72;
  lives = 3; invulnerableFor = 0; multiplierFor = 0; hiddenFor = 0;
  reset(): void { this.x = WORLD.width / 2; this.lives = 3; this.invulnerableFor = this.multiplierFor = this.hiddenFor = 0; }
  update(dt: number, axis: number): void {
    this.x = Math.max(24, Math.min(WORLD.width - this.width - 24, this.x + axis * TUNING.playerSpeed * dt));
    this.invulnerableFor = Math.max(0, this.invulnerableFor - dt);
    this.multiplierFor = Math.max(0, this.multiplierFor - dt);
    this.hiddenFor = Math.max(0, this.hiddenFor - dt);
  }
  hit(): boolean {
    if (this.invulnerableFor > 0) return false;
    this.lives--; this.invulnerableFor = TUNING.hitInvulnerability; return true;
  }
  get bounds(): Bounds { return { x: this.x + 12, y: this.y + 9, width: this.width - 24, height: this.height - 12 }; }
  get centerX(): number { return this.x + this.width / 2; }
}
