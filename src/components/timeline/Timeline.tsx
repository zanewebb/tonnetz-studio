import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { PPQ } from '../../types/project';

const BAR_TICKS = PPQ * 4;     // 4/4
const PX_PER_TICK = 0.08;       // ≈ 38 px per beat

export function Timeline() {
  const project = useProjectStore((s) => s.project);
  const { currentTick, setTick } = useTransportStore();
  const notes = project.tracks.flatMap((t) => t.notes);
  const maxTick = Math.max(BAR_TICKS * 8, ...notes.map((n) => n.startTick + n.durationTicks));
  const width = maxTick * PX_PER_TICK;
  const bars = Math.ceil(maxTick / BAR_TICKS);

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setTick(Math.round(x / PX_PER_TICK));
  }

  return (
    <svg width={width} height={120} onClick={onClick} style={{ background: '#fbf8ef' }}>
      {Array.from({ length: bars + 1 }, (_, i) => (
        <g key={i}>
          <line x1={i * BAR_TICKS * PX_PER_TICK} y1={0}
                x2={i * BAR_TICKS * PX_PER_TICK} y2={120}
                stroke="#d8d3c4" />
          <text x={i * BAR_TICKS * PX_PER_TICK + 4} y={14} fontSize={10} fill="#87827a">
            {i + 1}
          </text>
        </g>
      ))}
      {notes.map((n) => (
        <rect
          key={n.id}
          data-testid="timeline-note"
          x={n.startTick * PX_PER_TICK}
          y={40 + ((127 - n.pitch) % 60)}
          width={n.durationTicks * PX_PER_TICK}
          height={6}
          fill="#c25b3b"
          rx={2}
        />
      ))}
      <line
        data-testid="playhead"
        x1={currentTick * PX_PER_TICK} y1={0}
        x2={currentTick * PX_PER_TICK} y2={120}
        stroke="#c25b3b" strokeWidth={2}
      />
    </svg>
  );
}
