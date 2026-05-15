import { axialToPitch, axialToXY, Axial } from '../../lib/tonnetz/coordinates';

export type GridCell = Axial & { x: number; y: number; pitch: number };

export function buildGrid(uRange: [number, number], vRange: [number, number]): GridCell[] {
  const cells: GridCell[] = [];
  for (let v = vRange[0]; v <= vRange[1]; v++) {
    for (let u = uRange[0]; u <= uRange[1]; u++) {
      const { x, y } = axialToXY(u, v);
      cells.push({ u, v, x, y, pitch: axialToPitch(u, v) });
    }
  }
  return cells;
}
