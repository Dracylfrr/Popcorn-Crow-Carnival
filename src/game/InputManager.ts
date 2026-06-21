export class InputManager {
  private down = new Set<string>();
  private pressed = new Set<string>();
  constructor() {
    addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Escape', 'Enter', 'KeyA', 'KeyD', 'KeyP'].includes(event.code)) event.preventDefault();
      if (!this.down.has(event.code)) this.pressed.add(event.code);
      this.down.add(event.code);
    });
    addEventListener('keyup', (event) => this.down.delete(event.code));
    addEventListener('blur', () => this.down.clear());
  }
  axis(): number { return Number(this.down.has('ArrowRight') || this.down.has('KeyD')) - Number(this.down.has('ArrowLeft') || this.down.has('KeyA')); }
  consume(...codes: string[]): boolean {
    const hit = codes.some((code) => this.pressed.has(code));
    codes.forEach((code) => this.pressed.delete(code));
    return hit;
  }
  endFrame(): void { this.pressed.clear(); }
}
