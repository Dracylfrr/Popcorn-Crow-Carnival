import type { Bounds } from './types';
export function overlaps(a: Bounds, b: Bounds): boolean { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
