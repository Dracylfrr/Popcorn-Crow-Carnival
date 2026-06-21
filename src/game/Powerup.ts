import { WORLD, type Bounds } from './types';
export type PowerupType = 'multiplier' | 'hide' | 'life';
export class Powerup {
  readonly y = WORLD.groundY - 82; readonly width = 80; readonly height = 80; age = 0;
  constructor(readonly type: PowerupType, readonly x: number) {}
  update(dt: number): void { this.age += dt; }
  get expired(): boolean { return this.age > 9; }
  get bounds(): Bounds { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
}
