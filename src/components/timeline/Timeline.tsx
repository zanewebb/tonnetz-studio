import { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useSelectionStore } from '../../state/selection';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { midiToName } from '../../lib/music/pitch';

const BAR_TICKS = PPQ * 4;
const BASE_PX_PER_TICK = 0.08;
const ROW_HEIGHT = 5;
const TOP_PAD = 36;
const RESIZE_HANDLE_PX = 6;
const DRAG_THRESHOLD_PX = 4;

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4, '1/8': PPQ / 2, '1/4': PPQ, '1/2': PPQ * 2, '1/1': PPQ * 4,
};

type Drag =
  | { kind: 'idle' }
  | { kind: 'maybe-pan'; startX: number; startY: number; shift: boolean }
  | { kind: 'rubber-band'; startX: number; startY: number; curX: number; curY: number; shift: boolean }
  | { kind: 'resize-right'; noteId: string; startTick: number }
  | { kind: 'resize-left'; noteId: string; endTick: number };

export function Timeline() {
  const project = useProjectStore((s) => s.project);
  const setNoteDuration = useProjectStore((s) => s.setNoteDuration);
  const updateNote = useProjectStore((s) => s.updateNote);
  const { currentTick, setTick } = useTransportStore();
  const noteLength = useViewStore((s) => s.noteLength);
  const timelineZoom = useViewStore((s) => s.timelineZoom);
  const selectedNoteIds = useSelectionStore((s) => s.selectedNoteIds);
  const setNoteSelection = useSelectionStore((s) => s.setNoteSelection);
  const addNoteSelection = useSelectionStore((s) => s.addNoteSelection);
  const toggleNoteSelection = useSelectionStore((s) => s.toggleNoteSelection);
  const clearNoteSelection = useSelectionStore((s) => s.clearNoteSelection);

  const PX_PER_TICK = BASE_PX_PER_TICK * timelineZoom;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<Drag>({ kind: 'idle' });

  const notes = project.tracks.flatMap((t) => t.notes);
  const maxTick = Math.max(BAR_TICKS * 8, ...notes.map((n) => n.startTick + n.durationTicks));
  const width = maxTick * PX_PER_TICK;
  const bars = Math.ceil(maxTick / BAR_TICKS);
  const minPitch = notes.length ? Math.min(...notes.map((n) => n.pitch)) - 2 : 48;
  const maxPitch = notes.length ? Math.max(...notes.map((n) => n.pitch)) + 2 : 84;
  const pitchRows = maxPitch - minPitch + 1;
  const noteAreaHeight = pitchRows * ROW_HEIGHT;
  const svgHeight = Math.max(120, TOP_PAD + noteAreaHeight + 6);

  function rowY(pitch: number) {
    return TOP_PAD + (maxPitch - pitch) * ROW_HEIGHT;
  }
  function svgPoint(e: React.MouseEvent | MouseEvent): { x: number; y: number } {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Right-edge resize tracking
  useEffect(() => {
    if (drag.kind !== 'resize-right') return;
    function onMove(ev: MouseEvent) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const tickAtCursor = x / PX_PER_TICK;
      const startTick = (drag as { startTick: number }).startTick;
      const snap = NOTE_LENGTH_TICKS[noteLength];
      const newEnd = Math.max(startTick + snap, Math.round(tickAtCursor / snap) * snap);
      const newDur = newEnd - startTick;
      setNoteDuration((drag as { noteId: string }).noteId, newDur);
    }
    function onUp() { setDrag({ kind: 'idle' }); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, noteLength, setNoteDuration, PX_PER_TICK]);

  // Left-edge resize tracking
  useEffect(() => {
    if (drag.kind !== 'resize-left') return;
    function onMove(ev: MouseEvent) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const tickAtCursor = x / PX_PER_TICK;
      const endTick = (drag as { endTick: number }).endTick;
      const snap = NOTE_LENGTH_TICKS[noteLength];
      const newStart = Math.max(0, Math.min(endTick - snap, Math.round(tickAtCursor / snap) * snap));
      updateNote((drag as { noteId: string }).noteId, {
        startTick: newStart,
        durationTicks: endTick - newStart,
      });
    }
    function onUp() { setDrag({ kind: 'idle' }); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, noteLength, updateNote, PX_PER_TICK]);

  function onSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if ((e.target as Element).getAttribute('data-role') !== 'background') return;
    const p = svgPoint(e);
    setDrag({ kind: 'maybe-pan', startX: p.x, startY: p.y, shift: e.shiftKey });
  }
  function onSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (drag.kind === 'maybe-pan') {
      const p = svgPoint(e);
      const dx = p.x - drag.startX, dy = p.y - drag.startY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        setDrag({ kind: 'rubber-band', startX: drag.startX, startY: drag.startY, curX: p.x, curY: p.y, shift: drag.shift });
      }
    } else if (drag.kind === 'rubber-band') {
      const p = svgPoint(e);
      setDrag({ ...drag, curX: p.x, curY: p.y });
    }
  }
  function onSvgMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    if (drag.kind === 'maybe-pan') {
      const p = svgPoint(e);
      const rawTick = p.x / PX_PER_TICK;
      const snap = NOTE_LENGTH_TICKS[noteLength];
      const snapped = Math.max(0, Math.round(rawTick / snap) * snap);
      setTick(snapped);
      clearNoteSelection();
      setDrag({ kind: 'idle' });
      return;
    }
    if (drag.kind === 'rubber-band') {
      const x0 = Math.min(drag.startX, drag.curX);
      const x1 = Math.max(drag.startX, drag.curX);
      const y0 = Math.min(drag.startY, drag.curY);
      const y1 = Math.max(drag.startY, drag.curY);
      const hits: string[] = [];
      for (const n of notes) {
        const nx0 = n.startTick * PX_PER_TICK;
        const nx1 = nx0 + n.durationTicks * PX_PER_TICK;
        const ny0 = rowY(n.pitch);
        const ny1 = ny0 + ROW_HEIGHT - 1;
        const intersects = nx0 <= x1 && nx1 >= x0 && ny0 <= y1 && ny1 >= y0;
        if (intersects) hits.push(n.id);
      }
      if (drag.shift) addNoteSelection(hits);
      else setNoteSelection(hits);
      setDrag({ kind: 'idle' });
    }
  }

  function onNoteMouseDown(e: React.MouseEvent, noteId: string, startTick: number, duration: number) {
    const rect = (e.currentTarget as SVGGraphicsElement).getBoundingClientRect();
    const fromLeft = e.clientX - rect.left;
    const fromRight = rect.right - e.clientX;
    const endTick = startTick + duration;

    if (fromRight <= RESIZE_HANDLE_PX) {
      e.stopPropagation();
      setDrag({ kind: 'resize-right', noteId, startTick });
      return;
    }
    if (fromLeft <= RESIZE_HANDLE_PX) {
      e.stopPropagation();
      setDrag({ kind: 'resize-left', noteId, endTick });
      return;
    }
    e.stopPropagation();
    if (e.shiftKey) addNoteSelection([noteId]);
    else if (e.metaKey || e.ctrlKey) toggleNoteSelection(noteId);
    else setNoteSelection([noteId]);
  }

  function noteCursor(e: React.MouseEvent, _w: number): string {
    const rect = (e.currentTarget as SVGGraphicsElement).getBoundingClientRect();
    const fromLeft = e.clientX - rect.left;
    const fromRight = rect.right - e.clientX;
    if (fromLeft <= RESIZE_HANDLE_PX || fromRight <= RESIZE_HANDLE_PX) return 'ew-resize';
    return 'pointer';
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={svgHeight}
      style={{ background: '#fbf8ef', userSelect: 'none', display: 'block' }}
      onMouseDown={onSvgMouseDown}
      onMouseMove={onSvgMouseMove}
      onMouseUp={onSvgMouseUp}
    >
      <rect data-role="background" x={0} y={0} width={width} height={svgHeight} fill="transparent" />
      {Array.from({ length: bars * 4 }, (_, i) => {
        const beatInBar = (i % 4) + 1;
        if (beatInBar === 1) return null;
        const x = i * (BAR_TICKS / 4) * PX_PER_TICK;
        return (
          <g key={`beat-${i}`}>
            <line x1={x} y1={20} x2={x} y2={svgHeight} stroke="#e6e1d3" strokeWidth={0.5} pointerEvents="none" />
            <text x={x + 2} y={28} fontSize={8} fill="#a39d8e" pointerEvents="none">{beatInBar}</text>
          </g>
        );
      })}
      {Array.from({ length: bars + 1 }, (_, i) => (
        <g key={`bar-${i}`}>
          <line x1={i * BAR_TICKS * PX_PER_TICK} y1={0}
                x2={i * BAR_TICKS * PX_PER_TICK} y2={svgHeight}
                stroke="#bcb7a8" strokeWidth={1} pointerEvents="none" />
          <text x={i * BAR_TICKS * PX_PER_TICK + 4} y={14}
                fontSize={10} fill="#5a5246" fontWeight={600} pointerEvents="none">
            Bar {i + 1}
          </text>
        </g>
      ))}
      {notes.map((n) => {
        const x = n.startTick * PX_PER_TICK;
        const w = Math.max(2, n.durationTicks * PX_PER_TICK);
        const selected = selectedNoteIds.has(n.id);
        return (
          <g key={n.id} data-testid="timeline-note">
            <rect
              x={x} y={rowY(n.pitch)} width={w} height={ROW_HEIGHT - 1}
              fill={selected ? '#ff7d4e' : '#c25b3b'}
              stroke={selected ? '#5a1f0e' : 'none'}
              strokeWidth={selected ? 1 : 0}
              rx={1}
              onMouseDown={(e) => onNoteMouseDown(e, n.id, n.startTick, n.durationTicks)}
              onMouseMove={(e) => {
                (e.currentTarget as SVGRectElement).style.cursor = noteCursor(e, w);
              }}
            />
            {w > 28 && (
              <text x={x + 3} y={rowY(n.pitch) + ROW_HEIGHT - 1.5}
                    fontSize={7} fill="#fff" pointerEvents="none">
                {midiToName(n.pitch)}
              </text>
            )}
          </g>
        );
      })}
      {drag.kind === 'rubber-band' && (
        <rect
          x={Math.min(drag.startX, drag.curX)}
          y={Math.min(drag.startY, drag.curY)}
          width={Math.abs(drag.curX - drag.startX)}
          height={Math.abs(drag.curY - drag.startY)}
          fill="rgba(194,91,59,0.12)"
          stroke="#c25b3b"
          strokeDasharray="3 3"
          pointerEvents="none"
        />
      )}
      <line
        data-testid="playhead"
        x1={currentTick * PX_PER_TICK} y1={0}
        x2={currentTick * PX_PER_TICK} y2={svgHeight}
        stroke="#c25b3b" strokeWidth={2}
        pointerEvents="none"
      />
    </svg>
  );
}
