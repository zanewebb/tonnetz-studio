import { GridCell } from './grid';

export type Edge = { a: GridCell; b: GridCell };

export function buildEdges(cells: GridCell[]): Edge[] {
  const byKey = new Map(cells.map((c) => [`${c.u},${c.v}`, c]));
  const edges: Edge[] = [];
  for (const c of cells) {
    const neighbours = [
      [c.u + 1, c.v],
      [c.u, c.v + 1],
      [c.u + 1, c.v - 1],
    ];
    for (const [u, v] of neighbours) {
      const n = byKey.get(`${u},${v}`);
      if (n) edges.push({ a: c, b: n });
    }
  }
  return edges;
}
