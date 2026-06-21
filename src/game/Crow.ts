import { TUNING, WORLD, type Bounds } from './types';

export type CrowPhase = 'flying' | 'warning' | 'diving';
export class Crow {
  readonly width = 96; readonly height = 68; phase: CrowPhase = 'flying';
  x: number; y = 95 + Math.random() * 130; warningFor = 0; flapTime = Math.random() * Math.PI * 2; tilt = 0;
  private warningTargetX = 0;
  private diveTime = 0; private startX = 0; private startY = 0; private endX = 0; private endY = 0; private arcHeight = 0;
  constructor(readonly side: 'left' | 'right') {
    this.x = side === 'left' ? -this.width : WORLD.width;
  }
  private get direction(): number { return this.side === 'left' ? 1 : -1; }
  beginDive(targetX: number): void {
    this.phase = 'diving'; this.startX = this.x; this.startY = this.y;
    // A symmetric parabola reaches the locked player position halfway through the dive,
    // then rises back to the original flight height. Player position is never read again.
    this.endX = 2 * (targetX - this.width / 2) - this.startX; this.endY = this.startY;
    this.arcHeight = WORLD.groundY - this.height * 0.7 - this.startY;
  }
  update(dt: number, targetX: number, canTarget: boolean): void {
    this.flapTime += dt * (this.phase === 'diving' ? 13 : 9);
    if (this.phase === 'flying') {
      this.tilt = 0;
      this.x += this.direction * TUNING.crowFlightSpeed * dt;
      const fullyVisible = this.x >= 0 && this.x + this.width <= WORLD.width;
      const aheadDistance = (targetX - (this.x + this.width / 2)) * this.direction;
      if (canTarget && fullyVisible && aheadDistance >= 0 && aheadDistance <= TUNING.crowDetectionDistance) {
        this.phase = 'warning';
        this.warningTargetX = targetX;
        this.warningFor = TUNING.crowWarningMin + Math.random() * (TUNING.crowWarningMax - TUNING.crowWarningMin);
      }
      return;
    }
    if (this.phase === 'warning') {
      if (!canTarget) { this.phase = 'flying'; return; }
      const fullyVisible = this.x >= 0 && this.x + this.width <= WORLD.width;
      const aheadDistance = (targetX - (this.x + this.width / 2)) * this.direction;
      if (!fullyVisible || aheadDistance < 0 || aheadDistance > TUNING.crowDetectionDistance) { this.phase = 'flying'; return; }
      // The warning is the only steering window: while fully visible, the crow may update its intended intercept.
      this.warningTargetX = targetX;
      this.warningFor -= dt;
      if (this.warningFor <= 0) this.beginDive(this.warningTargetX);
      return;
    }
    this.diveTime += dt;
    const t = Math.min(1, this.diveTime / TUNING.crowDiveDuration);
    this.x = this.startX + (this.endX - this.startX) * t;
    this.y = this.startY + (this.endY - this.startY) * t + 4 * this.arcHeight * t * (1 - t);
    const verticalVelocity = 4 * this.arcHeight * (1 - 2 * t);
    this.tilt = this.direction * Math.atan2(verticalVelocity, Math.abs(this.endX - this.startX));
    if (t >= 1) { this.phase = 'flying'; this.tilt = 0; }
  }
  get expired(): boolean { return this.phase === 'flying' && (this.side === 'left' ? this.x > WORLD.width + this.width : this.x < -this.width * 2); }
  get canHit(): boolean { const progress = this.diveTime / TUNING.crowDiveDuration; return this.phase === 'diving' && progress >= 0.38 && progress <= 0.62; }
  get bounds(): Bounds { return { x: this.x + 14, y: this.y + 9, width: this.width - 28, height: this.height - 18 }; }
}
