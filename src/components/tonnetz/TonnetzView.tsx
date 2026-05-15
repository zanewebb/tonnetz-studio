import { buildGrid } from './grid';
import { buildEdges } from './edges';
import { midiToName } from '../../lib/music/pitch';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { previewNote, previewChord } from '../../audio/engine';

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4, '1/8': PPQ / 2, '1/4': PPQ, '1/2': PPQ * 2, '1/1': PPQ * 4,
};

export function TonnetzView() {
  const cells = buildGrid([-3, 3], [-2, 4]);
  const edges = buildEdges(cells);
  const { addNote, addNotes } = useProjectStore();
  const { playing, recording, currentTick } = useTransportStore();
  const { noteLength } = useViewStore();

  function canWrite(altKey: boolean) {
    return !altKey && (!playing || recording);
  }

  function writeNotes(pitches: number[]) {
    const dur = NOTE_LENGTH_TICKS[noteLength];
    addNotes(pitches.map((p) => ({
      pitch: p, startTick: currentTick, durationTicks: dur, velocity: 100,
    })));
  }

  function handleCellClick(pitch: number, e: React.MouseEvent) {
    previewNote(pitch);
    if (canWrite(e.altKey)) {
      addNote({
        pitch, startTick: currentTick,
        durationTicks: NOTE_LENGTH_TICKS[noteLength], velocity: 100,
      });
    }
  }

  function handleEdgeClick(a: number, b: number, e: React.MouseEvent) {
    previewChord([a, b]);
    if (canWrite(e.altKey)) writeNotes([a, b]);
  }

  return (
    <svg
      data-testid="tonnetz-svg"
      viewBox="-300 -260 600 520"
      width="100%"
      height="100%"
      style={{ background: '#fffdf7' }}
    >
      <g>
        {edges.map((e, i) => (
          <line
            key={`hit-${i}`}
            data-testid="tonnetz-edge"
            x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            stroke="transparent" strokeWidth={14}
            onClick={(ev) => handleEdgeClick(e.a.pitch, e.b.pitch, ev)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        {edges.map((e, i) => (
          <line
            key={`v-${i}`}
            x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            stroke="#e0dcd2" strokeWidth={1}
            pointerEvents="none"
          />
        ))}
        {cells.map((c) => (
          <g key={`${c.u},${c.v}`} transform={`translate(${c.x},${c.y})`}>
            <circle
              data-testid="tonnetz-cell"
              data-pitch={c.pitch}
              r={14}
              fill="#d9d3c4" stroke="#b8b1a0"
              onClick={(e) => handleCellClick(c.pitch, e)}
              style={{ cursor: 'pointer' }}
            />
            <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#5a5246" pointerEvents="none">
              {midiToName(c.pitch)}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
