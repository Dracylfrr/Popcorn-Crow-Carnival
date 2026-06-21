import type { SaveData } from './types';
const DEFAULT_SAVE: SaveData = { highScore: 0, topScores: [], settings: { muted: false } };
export interface SaveAdapter { load(): Promise<SaveData>; save(data: SaveData): Promise<void> }
class BrowserSaveAdapter implements SaveAdapter {
  load(): Promise<SaveData> { try { const raw = JSON.parse(localStorage.getItem('popcorn-crow-save') ?? '{}') as Partial<SaveData>; return Promise.resolve({ ...DEFAULT_SAVE, ...raw, topScores: Array.isArray(raw.topScores) ? raw.topScores.slice(0, 5) : [] }); } catch { return Promise.resolve(DEFAULT_SAVE); } }
  save(data: SaveData): Promise<void> { localStorage.setItem('popcorn-crow-save', JSON.stringify(data)); return Promise.resolve(); }
}
class TauriSaveAdapter implements SaveAdapter {
  async load(): Promise<SaveData> { const { invoke } = await import('@tauri-apps/api/core'); return (await invoke('load_save')) as SaveData; }
  async save(data: SaveData): Promise<void> { const { invoke } = await import('@tauri-apps/api/core'); await invoke('save_game', { data }); }
}
export class SaveManager {
  private adapter: SaveAdapter = '__TAURI_INTERNALS__' in window ? new TauriSaveAdapter() : new BrowserSaveAdapter();
  load(): Promise<SaveData> { return this.adapter.load(); }
  save(data: SaveData): Promise<void> { return this.adapter.save(data); }
}
