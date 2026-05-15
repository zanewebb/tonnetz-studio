import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { midiToName } from '../../lib/music/pitch';

const BAR_TICKS = PPQ * 4;     // 4/4
const PX_PER_TICK = 0.08;       // ≈ 38 px per beat

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4,
  '1/8':  PPQ / 2,
  '1/4':  PPQ,
  '1/2':  PPQ * 2,
  '1/1':  PPQ * 4,
};

const ROW_HEIGHT = 5;
const TOP_PAD = 36;

export function Timeline() {
  const project = useProjectStore((s) => s.project);
  const { currentTick, setTick } = useTransportStore();
  const noteLength = useViewStore((s) => s.noteLength);
  const notes = project.tracks.flatMap((t) => t.notes);
  const maxTick = Math.max(BAR_TICKS * 8, ...notes.map((n) => n.startTick + n.durationTicks));
  const width = maxTick * PX_PER_TICK;
  const bars = Math.ceil(maxTick / BAR_TICKS);

  // Determine pitch range; default to 5 octaves around middle C
  const minPitch = notes.length ? Math.min(...notes.map((n) => n.pitch)) - 2 : 48;
  const maxPitch = notes.length ? Math.max(...notes.map((n) => n.pitch)) + 2 : 84;
  const pitchRows = maxPitch - minPitch + 1;
  const noteAreaHeight = pitchRows * ROW_HEIGHT;
  const svgHeight = Math.max(120, TOP_PAD + noteAreaHeight + 6);

  function rowY(pitch: number) {
    return TOP_PAD + (maxPitch - pitch) * ROW_HEIGHT;
  }

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rawTick = x / PX_PER_TICK;
    const snap = NOTE_LENGTH_TICKS[noteLength];
    const snapped = Math.round(rawTick / snap) * snap;
    setTick(Math.max(0, snapped));
  }

  return (
    <svg width={width} height={svgHeight} onClick={onClick} style={{ background: '#fbf8ef' }}>
      {/* Beat sub-lines (rendered first so bar lines win visually) */}
      {Array.from({ length: bars * 4 }, (_, i) => {
        const beatInBar = (i % 4) + 1;
        if (beatInBar === 1) return null; // skip beat 1 (bar line already there)
        const x = i * (BAR_TICKS / 4) * PX_PER_TICK;
        return (
          <g key={`beat-${i}`}>
            <line x1={x} y1={20} x2={x} y2={svgHeight} stroke="#e6e1d3" strokeWidth={0.5} />
            <text x={x + 2} y={28} fontSize={8} fill="#a39d8e">{beatInBar}</text>
          </g>
        );
      })}
      {/* Bar lines */}
      {Array.from({ length: bars + 1 }, (_, i) => (
        <g key={`bar-${i}`}>
          <line x1={i * BAR_TICKS * PX_PER_TICK} y1={0}
                x2={i * BAR_TICKS * PX_PER_TICK} y2={svgHeight}
                stroke="#bcb7a8" strokeWidth={1} />
          <text x={i * BAR_TICKS * PX_PER_TICK + 4} y={14} fontSize={10} fill="#5a5246" fontWeight={600}>
            Bar {i + 1}
          </text>
        </g>
      ))}
      {/* Note blocks */}
      {notes.map((n) => {
        const x = n.startTick * PX_PER_TICK;
        const w = Math.max(2, n.durationTicks * PX_PER_TICK);
        return (
          <g key={n.id} data-testid="timeline-note">
            <rect x={x} y={rowY(n.pitch)} width={w} height={ROW_HEIGHT - 1}
                  fill="#c25b3b" rx={1} />
            {w > 28 && (
              <text x={x + 3} y={rowY(n.pitch) + ROW_HEIGHT - 1.5}
                    fontSize={7} fill="#fff" pointerEvents="none">
                {midiToName(n.pitch)}
              </text>
            )}
          </g>
        );
      })}
      {/* Playhead */}
      <line
        data-testid="playhead"
        x1={currentTick * PX_PER_TICK} y1={0}
        x2={currentTick * PX_PER_TICK} y2={svgHeight}
        stroke="#c25b3b" strokeWidth={2}
      />
    </svg>
  );
}
