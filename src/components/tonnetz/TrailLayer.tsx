import { useEffect, useState } from 'react';
import { GridCell } from './grid';
import { Edge } from './edges';
import { Triangle } from './triangles';
import { pitchClass } from '../../lib/music/pitch';

type CellEntry = { kind: 'cell'; pitch: number; t: number };
type EdgeEntry = { kind: 'edge'; pcA: number; pcB: number; t: number };
type TriadEntry = { kind: 'triad'; pcA: number; pcB: number; pcC: number; t: number };
type TrailEntry = CellEntry | EdgeEntry | TriadEntry;

const TRAIL_LIFETIME = 1920; // 1 bar in ticks

export function TrailLayer({ cells, edges, triangles, sounding, currentTick }: {
  cells: GridCell[];
  edges: Edge[];
  triangles: Triangle[];
  sounding: number[];
  currentTick: number;
}) {
  const [trail, setTrail] = useState<TrailEntry[]>([]);

  useEffect(() => {
    setTrail((prev) => {
      const next = prev.filter((e) => currentTick - e.t < TRAIL_LIFETIME);
      const soundingPCs = new Set(sounding.map(pitchClass));
      // Add currently-sounding cells
      for (const p of sounding) {
        if (!next.find((e) => e.kind === 'cell' && e.pitch === p && currentTick - e.t < 100)) {
          next.push({ kind: 'cell', pitch: p, t: currentTick });
        }
      }
      // Add edges whose endpoints are both sounding (by PC)
      for (const ed of edges) {
        const a = pitchClass(ed.a.pitch);
        const b = pitchClass(ed.b.pitch);
        if (a !== b && soundingPCs.has(a) && soundingPCs.has(b)) {
          const exists = next.find((e) =>
            e.kind === 'edge' && ((e.pcA === a && e.pcB === b) || (e.pcA === b && e.pcB === a)) && currentTick - e.t < 100
          );
          if (!exists) next.push({ kind: 'edge', pcA: a, pcB: b, t: currentTick });
        }
      }
      // Add triangles whose three vertices are all sounding (by PC)
      for (const tri of triangles) {
        const a = pitchClass(tri.a.pitch);
        const b = pitchClass(tri.b.pitch);
        const c = pitchClass(tri.c.pitch);
        const pcs = [a, b, c];
        if (new Set(pcs).size === 3 && pcs.every((p) => soundingPCs.has(p))) {
          const key = pcs.slice().sort().join('-');
          const exists = next.find((e) =>
            e.kind === 'triad' && [e.pcA, e.pcB, e.pcC].sort().join('-') === key && currentTick - e.t < 100
          );
          if (!exists) next.push({ kind: 'triad', pcA: a, pcB: b, pcC: c, t: currentTick });
        }
      }
      return next;
    });
  }, [currentTick, sounding.join(','), edges, triangles, cells]);

  return (
    <g pointerEvents="none">
      {trail.map((e, i) => {
        const age = currentTick - e.t;
        const fade = Math.max(0, 1 - age / TRAIL_LIFETIME);
        if (e.kind === 'cell') {
          const cell = cells.find((c) => pitchClass(c.pitch) === pitchClass(e.pitch));
          if (!cell) return null;
          const radius = 14 + (age / TRAIL_LIFETIME) * 6;
          return (
            <circle key={`c-${i}`} cx={cell.x} cy={cell.y} r={radius}
              fill="none" stroke="#c25b3b" strokeWidth={2} opacity={0.85 * fade} />
          );
        }
        if (e.kind === 'edge') {
          const ed = edges.find((x) =>
            (pitchClass(x.a.pitch) === e.pcA && pitchClass(x.b.pitch) === e.pcB) ||
            (pitchClass(x.a.pitch) === e.pcB && pitchClass(x.b.pitch) === e.pcA)
          );
          if (!ed) return null;
          return (
            <line key={`e-${i}`} x1={ed.a.x} y1={ed.a.y} x2={ed.b.x} y2={ed.b.y}
              stroke="#c25b3b" strokeWidth={3} opacity={0.7 * fade} />
          );
        }
        // triad
        const key = [e.pcA, e.pcB, e.pcC].sort().join('-');
        const tri = triangles.find((t) =>
          [pitchClass(t.a.pitch), pitchClass(t.b.pitch), pitchClass(t.c.pitch)].sort().join('-') === key
        );
        if (!tri) return null;
        return (
          <polygon key={`t-${i}`}
            points={`${tri.a.x},${tri.a.y} ${tri.b.x},${tri.b.y} ${tri.c.x},${tri.c.y}`}
            fill={`rgba(194,91,59,${0.35 * fade})`}
            stroke="#c25b3b" strokeWidth={1.5} opacity={fade} />
        );
      })}
    </g>
  );
}
