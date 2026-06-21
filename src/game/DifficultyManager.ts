import { TUNING } from './types';
export class DifficultyManager {
  elapsed = 0; spawnIn = 1.5;
  reset(): void { this.elapsed = 0; this.spawnIn = 1.5; }
  update(dt: number): boolean {
    this.elapsed += dt; this.spawnIn -= dt;
    if (this.spawnIn > 0) return false;
    const interval = Math.max(TUNING.spawnIntervalMin, TUNING.spawnIntervalStart - this.elapsed / 35);
    this.spawnIn = interval * (0.82 + Math.random() * 0.36); return true;
  }
  get activeCap(): number { return Math.min(TUNING.maxActiveCrows, 2 + Math.floor(this.elapsed / 24)); }
}
