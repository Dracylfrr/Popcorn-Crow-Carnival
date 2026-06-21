import { overlaps } from './Collision';
import { Crow } from './Crow';
import { DifficultyManager } from './DifficultyManager';
import { GameState } from './GameState';
import { InputManager } from './InputManager';
import { Player } from './Player';
import { Powerup, type PowerupType } from './Powerup';
import { Renderer } from './Renderer';
import { SaveManager } from './SaveManager';
import { TUNING, WORLD } from './types';

export class Game {
  private state = GameState.Start;
  private input = new InputManager();
  private player = new Player();
  private crows: Crow[] = [];
  private powerups: Powerup[] = [];
  private difficulty = new DifficultyManager();
  private saves = new SaveManager();
  private renderer: Renderer;
  private score = 0;
  private highScore = 0;
  private topScores: number[] = [];
  private showStartPowerups = false;
  private showStartScores = false;
  private powerupIn = 8;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) { this.renderer = new Renderer(canvas); }

  async start(): Promise<void> {
    const save = await this.saves.load();
    this.highScore = save.highScore;
    this.topScores = save.topScores.length ? save.topScores : save.highScore > 0 ? [save.highScore] : [];
    requestAnimationFrame(this.loop);
  }

  togglePause(): void {
    if (this.state === GameState.Playing || this.state === GameState.Paused) this.state = this.state === GameState.Playing ? GameState.Paused : GameState.Playing;
  }

  beginGame(): void { if (this.state === GameState.Start || this.state === GameState.GameOver) this.newGame(); }

  togglePowerupGuide(): void { if (this.state === GameState.Start) { this.showStartPowerups = !this.showStartPowerups; this.showStartScores = false; } }

  toggleScoreboard(): void { if (this.state === GameState.Start) { this.showStartScores = !this.showStartScores; this.showStartPowerups = false; } }

  exitToStart(): void { this.state = GameState.Start; this.crows = []; this.powerups = []; }

  private loop = (time: number): void => {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.handleStateInput();
    if (this.state === GameState.Playing) this.update(dt);
    document.documentElement.dataset.gameState = this.state;
    this.renderer.render({ state: this.state, player: this.player, crows: this.crows, powerups: this.powerups, score: this.score, highScore: this.highScore, topScores: this.topScores, showStartPowerups: this.showStartPowerups, showStartScores: this.showStartScores });
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  };

  private handleStateInput(): void {
    if (this.input.consume('Enter')) this.beginGame();
    if (this.input.consume('KeyP', 'Escape')) this.togglePause();
  }

  private newGame(): void {
    this.player.reset(); this.crows = []; this.powerups = []; this.score = 0;
    this.powerupIn = 7 + Math.random() * 4; this.difficulty.reset(); this.showStartPowerups = false; this.showStartScores = false; this.state = GameState.Playing;
  }

  private update(dt: number): void {
    this.player.update(dt, this.input.axis());
    this.score += dt * 10 * (this.player.multiplierFor > 0 ? TUNING.scoreMultiplier : 1);
    if (this.difficulty.update(dt) && this.crows.length < this.difficulty.activeCap) this.crows.push(new Crow(Math.random() < .5 ? 'left' : 'right'));
    this.crows.forEach((crow) => crow.update(dt, this.player.centerX, this.player.hiddenFor <= 0));
    for (const crow of this.crows) {
      if (crow.canHit && overlaps(crow.bounds, this.player.bounds) && this.player.hit() && this.player.lives <= 0) this.gameOver();
    }
    this.crows = this.crows.filter((crow) => !crow.expired);
    this.updatePowerups(dt);
  }

  private updatePowerups(dt: number): void {
    this.powerupIn -= dt;
    if (this.powerupIn <= 0 && this.powerups.length === 0) {
      const roll = Math.random();
      const type: PowerupType = this.player.lives < 3 && roll < 0.4 ? 'life' : roll < 0.7 ? 'multiplier' : 'hide';
      this.powerups.push(new Powerup(type, 100 + Math.random() * (WORLD.width - 280)));
      this.powerupIn = TUNING.powerupSpawnMin + Math.random() * (TUNING.powerupSpawnMax - TUNING.powerupSpawnMin);
    }
    this.powerups.forEach((powerup) => {
      powerup.update(dt);
      if (!overlaps(powerup.bounds, this.player.bounds)) return;
      if (powerup.type === 'multiplier') this.player.multiplierFor = TUNING.powerupDuration;
      else if (powerup.type === 'hide') this.player.hiddenFor = TUNING.powerupDuration;
      else this.player.lives = Math.min(3, this.player.lives + 1);
      powerup.age = 99;
    });
    this.powerups = this.powerups.filter((powerup) => !powerup.expired);
  }

  private gameOver(): void {
    if (this.state === GameState.GameOver) return;
    this.state = GameState.GameOver;
    const finalScore = Math.floor(this.score);
    this.highScore = Math.max(this.highScore, finalScore);
    this.topScores = [...this.topScores, finalScore].sort((a, b) => b - a).slice(0, 5);
    void this.saves.save({ highScore: this.highScore, topScores: this.topScores, settings: { muted: false } });
  }
}
