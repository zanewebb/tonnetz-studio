import { useProjectStore } from '../../state/project';
import { useSelectionStore } from '../../state/selection';
import { useViewStore, NoteLength } from '../../state/view';

type Props = {
  zoomBy: (factor: number, anchorMouseClientX?: number) => void;
  resetZoom: () => void;
};

export function TimelineToolbar({ zoomBy, resetZoom }: Props) {
  const { noteLength, setNoteLength, timelineZoom } = useViewStore();
  const selectedNoteIds = useSelectionStore((s) => s.selectedNoteIds);
  const clearNoteSelection = useSelectionStore((s) => s.clearNoteSelection);
  const removeNotes = useProjectStore((s) => s.removeNotes);

  const selectedCount = selectedNoteIds.size;

  function deleteSelected() {
    if (selectedCount === 0) return;
    removeNotes(Array.from(selectedNoteIds));
    clearNoteSelection();
  }

  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'center', padding: '6px 12px',
      background: '#f0ebd9', borderTop: '1px solid #d8d3c4', borderBottom: '1px solid #e6e1d3',
      fontSize: 12, color: '#5a5246',
    }}>
      <label title="Snap grid for click-to-add length, scrub, resize, and move. Hold Alt while dragging to bypass snap.">
        Snap{' '}
        <select value={noteLength} onChange={(e) => setNoteLength(e.target.value as NoteLength)}>
          {(['1/16','1/8','1/4','1/2','1/1'] as NoteLength[]).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>Zoom</span>
        <button onClick={() => zoomBy(1/1.25)} title="Zoom out (around playhead)">−</button>
        <span style={{ minWidth: 42, textAlign: 'center' }}>{Math.round(timelineZoom * 100)}%</span>
        <button onClick={() => zoomBy(1.25)} title="Zoom in (around playhead)">+</button>
        <button onClick={resetZoom} title="Reset zoom">⟲</button>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {selectedCount > 0 ? (
          <>
            <span>Selected: {selectedCount}</span>
            <button onClick={deleteSelected}>Delete</button>
            <button onClick={clearNoteSelection}>Clear</button>
          </>
        ) : (
          <span style={{ color: '#a39d8e' }}>Drag notes · Edges resize · Hold Alt to bypass snap · Shift / Cmd / rubber-band to multi-select · Del removes</span>
        )}
      </div>
    </div>
  );
}
