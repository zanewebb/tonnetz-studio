import { useProjectStore } from '../../state/project';
import { useSelectionStore } from '../../state/selection';
import { useViewStore, NoteLength } from '../../state/view';

export function TimelineToolbar() {
  const { noteLength, setNoteLength, timelineZoom, setTimelineZoom } = useViewStore();
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
      <label>
        Length{' '}
        <select value={noteLength} onChange={(e) => setNoteLength(e.target.value as NoteLength)}>
          {(['1/16','1/8','1/4','1/2','1/1'] as NoteLength[]).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>Zoom</span>
        <button onClick={() => setTimelineZoom(timelineZoom / 1.25)} title="Zoom out">−</button>
        <span style={{ minWidth: 42, textAlign: 'center' }}>{Math.round(timelineZoom * 100)}%</span>
        <button onClick={() => setTimelineZoom(timelineZoom * 1.25)} title="Zoom in">+</button>
        <button onClick={() => setTimelineZoom(1)} title="Reset zoom">⟲</button>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {selectedCount > 0 ? (
          <>
            <span>Selected: {selectedCount}</span>
            <button onClick={deleteSelected}>Delete</button>
            <button onClick={clearNoteSelection}>Clear</button>
          </>
        ) : (
          <span style={{ color: '#a39d8e' }}>Select notes to edit</span>
        )}
      </div>
    </div>
  );
}
