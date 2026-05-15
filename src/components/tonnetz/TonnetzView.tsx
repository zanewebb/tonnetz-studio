import { useRef } from 'react';
import { buildGrid } from './grid';
import { buildEdges } from './edges';
import { buildTriangles } from './triangles';
import { midiToName, pitchClass } from '../../lib/music/pitch';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { previewNote, previewChord } from '../../audio/engine';
import { computeSoundingNotes } from '../../state/selectors';
import { findTriad } from '../../lib/tonnetz/chords';
import { TrailLayer } from './TrailLayer';
import { HeatmapLayer } from './HeatmapLayer';

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4, '1/8': PPQ / 2, '1/4': PPQ, '1/2': PPQ * 2, '1/1': PPQ * 4,
};

export function TonnetzView() {
  const cells = buildGrid([-3, 3], [-2, 4]);
  const edges = buildEdges(cells);
  const triangles = buildTriangles(cells);
  const project = useProjectStore((s) => s.project);
  const { addNote, addNotes } = useProjectStore();
  const { playing, recording, currentTick } = useTransportStore();
  const { noteLength, trailEnabled, heatmapEnabled, pan, zoom, setPan, setZoom, pitchClassMode, octaveAnchor } = useViewStore();

  const dragStart = useRef<{ x: number; y: number; pan: { x: number; y: number } } | null>(null);

  const allNotes = project.tracks.flatMap((t) => t.notes);
  const sounding = computeSoundingNotes(allNotes, currentTick);
  const soundingPitches = new Set(sounding.map((n) => n.pitch));
  const triad = findTriad(sounding.map((n) => n.pitch));

  const litTriangleKey = triad
    ? [triad.root, (triad.root + (triad.type === 'major' ? 4 : 3)) % 12, (triad.root + 7) % 12]
        .sort((a, b) => a - b).join(',')
    : null;

  function trianglePCKey(t: { a: { pitch: number }; b: { pitch: number }; c: { pitch: number } }) {
    return [t.a.pitch, t.b.pitch, t.c.pitch].map(pitchClass).sort((a, b) => a - b).join(',');
  }

  function canWrite(altKey: boolean) {
    return !altKey && (!playing || recording);
  }

  function applyOctaveAnchor(pitches: number[]): number[] {
    if (!pitchClassMode) return pitches;
    return pitches.map((p) => (octaveAnchor + 1) * 12 + ((p % 12) + 12) % 12);
  }

  function writeNotes(pitches: number[]) {
    const dur = NOTE_LENGTH_TICKS[noteLength];
    addNotes(applyOctaveAnchor(pitches).map((p) => ({
      pitch: p, startTick: currentTick, durationTicks: dur, velocity: 100,
    })));
  }

  function handleCellClick(pitch: number, e: React.MouseEvent) {
    previewNote(pitch);
    if (canWrite(e.altKey)) {
      const writePitch = applyOctaveAnchor([pitch])[0];
      addNote({
        pitch: writePitch, startTick: currentTick,
        durationTicks: NOTE_LENGTH_TICKS[noteLength], velocity: 100,
      });
    }
  }

  function handleEdgeClick(a: number, b: number, e: React.MouseEvent) {
    previewChord([a, b]);
    if (canWrite(e.altKey)) writeNotes([a, b]);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(Math.min(2, Math.max(0.5, zoom + delta)));
  }

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as Element).tagName === 'svg') {
      dragStart.current = { x: e.clientX, y: e.clientY, pan };
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragStart.current) return;
    setPan({
      x: dragStart.current.pan.x + (e.clientX - dragStart.current.x),
      y: dragStart.current.pan.y + (e.clientY - dragStart.current.y),
    });
  }

  function onMouseUp() { dragStart.current = null; }

  return (
    <svg
      data-testid="tonnetz-svg"
      viewBox="-300 -260 600 520"
      width="100%"
      height="100%"
      style={{ background: '#fffdf7' }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {heatmapEnabled && <HeatmapLayer cells={cells} notes={allNotes} />}
        <g>
          {triangles.map((t, i) => (
            <polygon
              key={i}
              data-testid="tonnetz-triangle"
              points={`${t.a.x},${t.a.y} ${t.b.x},${t.b.y} ${t.c.x},${t.c.y}`}
              fill={litTriangleKey && trianglePCKey(t) === litTriangleKey ? 'rgba(194,91,59,0.22)' : 'transparent'}
              stroke={litTriangleKey && trianglePCKey(t) === litTriangleKey ? '#c25b3b' : 'none'}
              strokeWidth={1.5}
              onClick={(e) => {
                previewChord([t.a.pitch, t.b.pitch, t.c.pitch]);
                if (canWrite(e.altKey)) writeNotes([t.a.pitch, t.b.pitch, t.c.pitch]);
              }}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </g>
        {trailEnabled && <TrailLayer cells={cells} sounding={sounding.map((n) => n.pitch)} currentTick={currentTick} />}
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
                fill={soundingPitches.has(c.pitch) ? '#c25b3b' : '#d9d3c4'}
                stroke={soundingPitches.has(c.pitch) ? '#8b3a23' : '#b8b1a0'}
                onClick={(e) => handleCellClick(c.pitch, e)}
                style={{ cursor: 'pointer' }}
              />
              <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#5a5246" pointerEvents="none">
                {pitchClassMode ? midiToName(c.pitch).replace(/-?\d+$/, '') : midiToName(c.pitch)}
              </text>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
