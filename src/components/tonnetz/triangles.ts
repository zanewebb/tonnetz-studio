import { GridCell } from './grid';

export type Triangle = { a: GridCell; b: GridCell; c: GridCell; type: 'up' | 'down' };

export function buildTriangles(cells: GridCell[]): Triangle[] {
  const byKey = new Map(cells.map((c) => [`${c.u},${c.v}`, c]));
  const tris: Triangle[] = [];
  for (const c of cells) {
    const right = byKey.get(`${c.u + 1},${c.v}`);
    const upRight = byKey.get(`${c.u},${c.v + 1}`);
    const downRight = byKey.get(`${c.u + 1},${c.v - 1}`);
    if (right && upRight) tris.push({ a: c, b: right, c: upRight, type: 'up' });
    if (right && downRight) tris.push({ a: c, b: right, c: downRight, type: 'down' });
  }
  return tris;
}
