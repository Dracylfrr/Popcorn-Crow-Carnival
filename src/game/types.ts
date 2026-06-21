export interface Vec2 { x: number; y: number }
export interface Bounds { x: number; y: number; width: number; height: number }
export interface SaveData { highScore: number; topScores: number[]; settings: { muted: boolean } }
export const WORLD = { width: 1280, height: 720, groundY: 600 } as const;
export const TUNING = {
  playerSpeed: 430,
  crowWarningMin: 1,
  crowWarningMax: 2,
  crowDiveDuration: 1.45,
  crowFlightSpeed: 145,
  crowDetectionDistance: 480,
  maxActiveCrows: 7,
  spawnIntervalStart: 3.4,
  spawnIntervalMin: 1.2,
  powerupSpawnMin: 9,
  powerupSpawnMax: 15,
  powerupDuration: 7,
  scoreMultiplier: 2,
  hitInvulnerability: 1.4
} as const;
