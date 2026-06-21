import './styles.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Game canvas not found');
const game = new Game(canvas);
void game.start();
document.querySelector<HTMLButtonElement>('#pause-button')?.addEventListener('click', () => game.togglePause());
document.querySelector<HTMLButtonElement>('#exit-button')?.addEventListener('click', () => game.exitToStart());
document.querySelector<HTMLButtonElement>('#play-button')?.addEventListener('click', () => game.beginGame());
document.querySelector<HTMLButtonElement>('#powerups-button')?.addEventListener('click', () => game.togglePowerupGuide());
document.querySelector<HTMLButtonElement>('#scores-button')?.addEventListener('click', () => game.toggleScoreboard());
document.querySelector<HTMLButtonElement>('#replay-button')?.addEventListener('click', () => game.beginGame());
document.querySelector<HTMLButtonElement>('#menu-button')?.addEventListener('click', () => game.exitToStart());
