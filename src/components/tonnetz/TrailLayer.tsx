import { useEffect, useState } from 'react';
import { GridCell } from './grid';
import { pitchClass } from '../../lib/music/pitch';

type TrailEntry = { pitch: number; t: number };

export function TrailLayer({ cells, sounding, currentTick }: {
  cells: GridCell[]; sounding: number[]; currentTick: number;
}) {
  const [trail, setTrail] = useState<TrailEntry[]>([]);

  useEffect(() => {
    setTrail((prev) => {
      const next = prev.filter((e) => currentTick - e.t < 1920);
      for (const p of sounding) {
        if (!next.find((e) => e.pitch === p && currentTick - e.t < 100)) {
          next.push({ pitch: p, t: currentTick });
        }
      }
      return next;
    });
  }, [currentTick, sounding.join(',')]);

  return (
    <g pointerEvents="none">
      {trail.map((e, i) => {
        const cell = cells.find((c) => pitchClass(c.pitch) === pitchClass(e.pitch));
        if (!cell) return null;
        const age = currentTick - e.t;
        const opacity = Math.max(0, 0.85 * (1 - age / 1920));
        const radius = 14 + (age / 1920) * 6;   // expanding ring
        return (
          <circle key={i} cx={cell.x} cy={cell.y} r={radius}
            fill="none" stroke="#c25b3b" strokeWidth={2} opacity={opacity} />
        );
      })}
    </g>
  );
}
