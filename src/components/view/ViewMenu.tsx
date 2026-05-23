import { useState, useRef, useEffect } from 'react';
import { useViewStore, HarmonyWindow, HeatmapScale } from '../../state/view';

export function ViewMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    pitchClassMode, togglePitchClassMode,
    trailEnabled, toggleTrail,
    heatmapEnabled, toggleHeatmap,
    heatmapScale, setHeatmapScale,
    harmonyWindow, setHarmonyWindow,
  } = useViewStore();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const activeCount = [pitchClassMode, trailEnabled, heatmapEnabled].filter(Boolean).length;

  return (
    <div className="dropdown" ref={ref}>
      <button className="dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        View{activeCount > 0 && <span className="badge">{activeCount}</span>} ▾
      </button>
      {open && (
        <div className="dropdown-panel">
          <label className="toggle-row">
            <span>Pitch-class lattice</span>
            <input type="checkbox" checked={pitchClassMode} onChange={togglePitchClassMode} />
            <span className="switch"></span>
          </label>
          <label className="toggle-row">
            <span>Note trail</span>
            <input type="checkbox" checked={trailEnabled} onChange={toggleTrail} />
            <span className="switch"></span>
          </label>
          <label className="toggle-row">
            <span>Tonal heatmap</span>
            <input type="checkbox" checked={heatmapEnabled} onChange={toggleHeatmap} />
            <span className="switch"></span>
          </label>
          <div className="dropdown-divider" />
          <label className="field-row">
            <span>Heatmap scale</span>
            <select value={heatmapScale} onChange={(e) => setHeatmapScale(e.target.value as HeatmapScale)}>
              <option value="linear">Linear</option>
              <option value="log">Logarithmic</option>
            </select>
          </label>
          <label className="field-row" title="How far back the chord detector looks. Arpeggios across a beat still register as a triad.">
            <span>Chord memory</span>
            <select value={harmonyWindow} onChange={(e) => setHarmonyWindow(e.target.value as HarmonyWindow)}>
              <option value="off">off</option>
              <option value="1/16">1/16</option>
              <option value="1/8">1/8</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="1">1 beat</option>
              <option value="2">2 beats</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
