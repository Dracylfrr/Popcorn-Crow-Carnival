import { GameState } from './GameState';
import type { Crow } from './Crow';
import type { Player } from './Player';
import type { Powerup } from './Powerup';
import { TUNING, WORLD } from './types';

const assetNames = ['popcorn_idle','popcorn_hit','crow_fly','crow_dive','warning_exclamation','score_multiplier_powerup','hide_powerup','heart_life','ground_platform'] as const;
type AssetName = typeof assetNames[number];
const spriteUrls = import.meta.glob('../assets/sprites/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
import carnivalBackgroundUrl from '../assets/sprites/carnival_background_v2.png';
import crowSpriteSheetUrl from '../assets/sprites/crow_sprite_sheet_ai.png';
import powerupSpriteSheetUrl from '../assets/sprites/powerup_sprite_sheet_ai.png';
export interface FrameView { state: GameState; player: Player; crows: Crow[]; powerups: Powerup[]; score: number; highScore: number; topScores: number[]; showStartPowerups: boolean; showStartScores: boolean }
export class Renderer {
  private ctx: CanvasRenderingContext2D; private assets = new Map<AssetName, HTMLImageElement>();
  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable'); this.ctx = ctx;
    assetNames.forEach((name) => { const image = new Image(); image.src = spriteUrls[`../assets/sprites/${name}.svg`]; this.assets.set(name, image); });
    const background = new Image(); background.src = carnivalBackgroundUrl; this.background = background;
    const crowSheet = new Image(); crowSheet.src = crowSpriteSheetUrl; this.crowSheet = crowSheet;
    const powerupSheet = new Image(); powerupSheet.src = powerupSpriteSheetUrl; this.powerupSheet = powerupSheet;
  }
  private background: HTMLImageElement;
  private crowSheet: HTMLImageElement;
  private powerupSheet: HTMLImageElement;
  render(view: FrameView): void {
    const { ctx } = this; ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    if (this.background.complete) ctx.drawImage(this.background, 0, 0, WORLD.width, WORLD.height);
    for (const powerup of view.powerups) this.powerupImage(powerup);
    for (const crow of view.crows) {
      this.crowImage(crow);
      if (crow.phase === 'warning') this.image('warning_exclamation', crow.x + 34, crow.y + 68, 28, 48);
    }
    if (view.state !== GameState.Start && !(view.player.invulnerableFor > 0 && Math.floor(view.player.invulnerableFor * 10) % 2 === 0)) this.image(view.player.invulnerableFor > 0 ? 'popcorn_hit' : 'popcorn_idle', view.player.x, view.player.y, view.player.width, view.player.height);
    this.hud(view);
    if (view.state !== GameState.Playing) this.overlay(view);
  }
  private hud(v: FrameView): void {
    const { ctx } = this; ctx.save(); ctx.fillStyle = '#fff5c2'; ctx.strokeStyle = '#2b142b'; ctx.lineWidth = 7; ctx.font = 'bold 31px Georgia';
    if (v.state === GameState.GameOver) { ctx.restore(); return; }
    if (v.state !== GameState.Start) { ctx.strokeText(`SCORE  ${Math.floor(v.score)}`, 34, 49); ctx.fillText(`SCORE  ${Math.floor(v.score)}`, 34, 49); }
    if (v.state !== GameState.Start) { ctx.textAlign = 'right'; ctx.strokeText(`BEST  ${Math.floor(v.highScore)}`, 1245, 49); ctx.fillText(`BEST  ${Math.floor(v.highScore)}`, 1245, 49); ctx.textAlign = 'left'; }
    if (v.state !== GameState.Start) for (let i = 0; i < v.player.lives; i++) this.image('heart_life', 36 + i * 50, 67, 42, 42);
    ctx.font = 'bold 24px Georgia'; let y = 108;
    if (v.player.multiplierFor > 0) { ctx.fillStyle = '#ffd43b'; ctx.fillText(`×${TUNING.scoreMultiplier} SCORE  ${v.player.multiplierFor.toFixed(1)}s`, 1050, y); y += 31; }
    if (v.player.hiddenFor > 0) { ctx.fillStyle = '#9aefcb'; ctx.fillText(`DISGUISED  ${v.player.hiddenFor.toFixed(1)}s`, 1050, y); }
    ctx.restore();
  }
  private overlay(v: FrameView): void {
    const { ctx } = this; ctx.save();
    if (v.state === GameState.GameOver) { this.gameOverOverlay(v); ctx.restore(); return; }
    ctx.fillStyle = '#1d1024cc'; ctx.fillRect(255, 105, 770, 510); ctx.strokeStyle = '#f6c84b'; ctx.lineWidth = 8; ctx.strokeRect(255, 105, 770, 510);
    if (v.state === GameState.Paused || v.showStartPowerups) this.powerupGuide(v.state === GameState.Paused ? 'INTERMISSION — POWERUPS' : 'POWERUPS');
    else if (v.showStartScores) this.startScoreboard(v.topScores);
    else {
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff4c8'; ctx.font = 'bold 48px Georgia'; ctx.fillText('POPCORN CROW CARNIVAL', 640, 210);
      ctx.font = 'bold 28px Georgia'; ctx.fillStyle = '#f4cf58';
      ctx.fillText('Survive the swoops. Steal the spotlight.', 640, 285);
      ctx.fillText('← → or A D to move', 640, 345);
      ctx.fillText('Choose Play or explore the carnival extras', 640, 390);
    }
    ctx.restore();
  }
  private powerupGuide(title: string): void {
    const { ctx } = this;
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff4c8'; ctx.font = 'bold 35px Georgia'; ctx.fillText(title, 640, 205);
    const columns = [405, 640, 875];
    for (let frame = 0; frame < 3; frame++) this.powerupFrame(frame, columns[frame] - 50, 230, 100);
    const names = ['2× SCORE', 'DISGUISE', 'EXTRA LIFE'];
    const lines = [['Doubles points', 'for 7 seconds'], ['Stops new crow', 'target locks'], ['Restores one', 'lost heart']];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#ffd95e'; ctx.font = 'bold 22px Georgia'; ctx.fillText(names[i], columns[i], 360);
      ctx.fillStyle = '#fff4c8'; ctx.font = '18px Georgia'; ctx.fillText(lines[i][0], columns[i], 397); ctx.fillText(lines[i][1], columns[i], 422);
    }
    ctx.fillStyle = '#f4cf58'; ctx.font = 'bold 20px Georgia'; ctx.fillText('Collect them on the midway before they disappear!', 640, 475);
  }
  private startScoreboard(scores: number[]): void {
    const { ctx } = this;
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff4c8'; ctx.font = 'bold 39px Georgia'; ctx.fillText('SAVED TOP SCORES', 640, 215);
    ctx.font = 'bold 20px Georgia'; ctx.fillStyle = '#f4cf58'; ctx.textAlign = 'left'; ctx.fillText('RANK', 420, 260); ctx.textAlign = 'right'; ctx.fillText('SCORE', 860, 260);
    for (let i = 0; i < 5; i++) {
      const y = 290 + i * 34; ctx.fillStyle = i === 0 ? '#ffd95e' : '#fff4c8'; ctx.font = 'bold 25px Georgia';
      ctx.textAlign = 'left'; ctx.fillText(`${i + 1}.`, 430, y); ctx.textAlign = 'right'; ctx.fillText(scores[i] === undefined ? '—' : `${scores[i]}`, 850, y);
    }
  }
  private gameOverOverlay(v: FrameView): void {
    const { ctx } = this;
    ctx.fillStyle = '#1d1024e8'; ctx.fillRect(255, 95, 770, 525); ctx.strokeStyle = '#f6c84b'; ctx.lineWidth = 8; ctx.strokeRect(255, 95, 770, 525);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff4c8'; ctx.font = 'bold 49px Georgia'; ctx.fillText('THAT’S ALL, KERNEL!', 640, 168);
    ctx.font = 'bold 20px Georgia'; ctx.fillStyle = '#f4cf58'; ctx.textAlign = 'left'; ctx.fillText('SCORE', 350, 220); ctx.textAlign = 'right'; ctx.fillText('BEST', 930, 220);
    ctx.font = 'bold 34px Georgia'; ctx.fillStyle = '#fff4c8'; ctx.textAlign = 'left'; ctx.fillText(`${Math.floor(v.score)}`, 350, 260); ctx.textAlign = 'right'; ctx.fillText(`${Math.floor(v.highScore)}`, 930, 260);
    ctx.textAlign = 'center'; ctx.font = 'bold 23px Georgia'; ctx.fillStyle = '#f4cf58'; ctx.fillText('TOP FIVE SCORES', 640, 305);
    ctx.font = 'bold 24px Georgia';
    for (let i = 0; i < 5; i++) {
      const y = 335 + i * 36; ctx.fillStyle = i === 0 ? '#ffd95e' : '#fff4c8';
      ctx.textAlign = 'left'; ctx.fillText(`${i + 1}.`, 440, y); ctx.textAlign = 'right'; ctx.fillText(v.topScores[i] === undefined ? '—' : `${v.topScores[i]}`, 840, y);
    }
  }
  private image(name: AssetName, x: number, y: number, width: number, height: number, flip = false): void {
    const image = this.assets.get(name); if (!image?.complete) return; this.ctx.save();
    if (flip) { this.ctx.translate(x + width, y); this.ctx.scale(-1, 1); this.ctx.drawImage(image, 0, 0, width, height); } else this.ctx.drawImage(image, x, y, width, height); this.ctx.restore();
  }
  private crowImage(crow: Crow): void {
    if (!this.crowSheet.complete || !this.crowSheet.naturalWidth) return;
    const frame = crow.phase === 'diving' ? 2 : Math.floor(crow.flapTime) % 2;
    const sourceWidth = this.crowSheet.naturalWidth / 3;
    const { ctx } = this; ctx.save();
    ctx.translate(crow.x + crow.width / 2, crow.y + crow.height / 2);
    ctx.rotate(crow.tilt);
    if (crow.side === 'right') ctx.scale(-1, 1);
    ctx.drawImage(this.crowSheet, frame * sourceWidth, 0, sourceWidth, this.crowSheet.naturalHeight, -crow.width / 2, -crow.height / 2, crow.width, crow.height);
    ctx.restore();
  }
  private powerupImage(powerup: Powerup): void {
    if (!this.powerupSheet.complete || !this.powerupSheet.naturalWidth) return;
    const frame = powerup.type === 'multiplier' ? 0 : powerup.type === 'hide' ? 1 : 2;
    const sourceWidth = this.powerupSheet.naturalWidth / 3;
    const sourceSize = Math.min(sourceWidth, this.powerupSheet.naturalHeight);
    const sourceX = frame * sourceWidth + (sourceWidth - sourceSize) / 2;
    const sourceY = (this.powerupSheet.naturalHeight - sourceSize) / 2;
    const bob = Math.sin(powerup.age * 4) * 5;
    this.ctx.drawImage(this.powerupSheet, sourceX, sourceY, sourceSize, sourceSize, powerup.x, powerup.y + bob, powerup.width, powerup.height);
  }
  private powerupFrame(frame: number, x: number, y: number, size: number): void {
    if (!this.powerupSheet.complete || !this.powerupSheet.naturalWidth) return;
    const sourceWidth = this.powerupSheet.naturalWidth / 3;
    const sourceSize = Math.min(sourceWidth, this.powerupSheet.naturalHeight);
    const sourceX = frame * sourceWidth + (sourceWidth - sourceSize) / 2;
    const sourceY = (this.powerupSheet.naturalHeight - sourceSize) / 2;
    this.ctx.drawImage(this.powerupSheet, sourceX, sourceY, sourceSize, sourceSize, x, y, size, size);
  }
}
