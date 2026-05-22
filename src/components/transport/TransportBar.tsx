import { useTransportStore } from '../../state/transport';
import { useProjectStore } from '../../state/project';
import { useViewStore } from '../../state/view';
import { startPlayback, stopPlayback } from '../../audio/transport';
import { setBpm as setAudioBpm } from '../../audio/engine';

export function TransportBar() {
  const playing = useTransportStore((s) => s.playing);
  const recording = useTransportStore((s) => s.recording);
  const toggleRecord = useTransportStore((s) => s.toggleRecord);
  const project = useProjectStore((s) => s.project);
  const setProjectBpm = useProjectStore((s) => s.setBpm);
  const { pitchClassMode, togglePitchClassMode, trailEnabled, toggleTrail, heatmapEnabled, toggleHeatmap } = useViewStore();

  function handleBpm(value: string) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      setProjectBpm(n);
      setAudioBpm(n);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8 }}>
      <button onClick={playing ? stopPlayback : startPlayback}>{playing ? '⏹' : '▶'}</button>
      <button onClick={toggleRecord} style={{ color: recording ? '#c25b3b' : undefined }}>
        ● Rec
      </button>
      <label>
        BPM <input type="number" value={project.bpm} onChange={(e) => handleBpm(e.target.value)} style={{ width: 60 }} />
      </label>
      <label>
        <input type="checkbox" checked={pitchClassMode} onChange={togglePitchClassMode} /> Pitch-class
      </label>
      <label>
        <input type="checkbox" checked={trailEnabled} onChange={toggleTrail} /> Trail
      </label>
      <label>
        <input type="checkbox" checked={heatmapEnabled} onChange={toggleHeatmap} /> Heatmap
      </label>
    </div>
  );
}
