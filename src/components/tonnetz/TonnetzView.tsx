import { buildGrid } from './grid';
import { midiToName } from '../../lib/music/pitch';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { previewNote } from '../../audio/engine';

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4,
  '1/8':  PPQ / 2,
  '1/4':  PPQ,
  '1/2':  PPQ * 2,
  '1/1':  PPQ * 4,
};

export function TonnetzView() {
  const cells = buildGrid([-3, 3], [-2, 4]);
  const { addNote } = useProjectStore();
  const { playing, recording, currentTick } = useTransportStore();
  const { noteLength } = useViewStore();

  function handleCellClick(pitch: number, e: React.MouseEvent) {
    const altOnly = e.altKey;
    previewNote(pitch);
    if (altOnly) return;
    // record-mode rule: write when stopped OR (playing & recording)
    if (!playing || recording) {
      addNote({
        pitch,
        startTick: currentTick,
        durationTicks: NOTE_LENGTH_TICKS[noteLength],
        velocity: 100,
      });
    }
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
        {cells.map((c) => (
          <g key={`${c.u},${c.v}`} transform={`translate(${c.x},${c.y})`}>
            <circle
              data-testid="tonnetz-cell"
              data-pitch={c.pitch}
              r={14}
              fill="#d9d3c4"
              stroke="#b8b1a0"
              onClick={(e) => handleCellClick(c.pitch, e)}
              style={{ cursor: 'pointer' }}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="#5a5246"
              pointerEvents="none"
            >
              {midiToName(c.pitch)}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
