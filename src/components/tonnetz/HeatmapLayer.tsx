import { GridCell } from './grid';
import { pitchClass } from '../../lib/music/pitch';
import { computeTonalDistribution } from '../../state/selectors';
import { Note } from '../../types/project';

export function HeatmapLayer({ cells, notes }: { cells: GridCell[]; notes: Note[] }) {
  const distribution = computeTonalDistribution(notes);
  const pcSums = new Map<number, number>();
  for (const [pitch, weight] of distribution) {
    const pc = pitchClass(pitch);
    pcSums.set(pc, (pcSums.get(pc) ?? 0) + weight);
  }
  const pcMax = Math.max(1, ...Array.from(pcSums.values()));

  return (
    <g pointerEvents="none">
      {cells.map((c) => {
        const w = pcSums.get(pitchClass(c.pitch)) ?? 0;
        const intensity = w / pcMax;
        if (intensity < 0.05) return null;
        return (
          <circle key={`${c.u},${c.v}`} cx={c.x} cy={c.y} r={20}
            fill={`rgba(194,91,59,${0.18 * intensity})`} />
        );
      })}
    </g>
  );
}
