import { useTransportStore } from '../../state/transport';
import { useProjectStore } from '../../state/project';
import { useViewStore, HarmonyWindow } from '../../state/view';
import { startPlayback, pausePlayback, stopPlayback } from '../../audio/transport';
import { setBpm as setAudioBpm } from '../../audio/engine';

export function TransportBar() {
  const playing = useTransportStore((s) => s.playing);
  const recording = useTransportStore((s) => s.recording);
  const toggleRecord = useTransportStore((s) => s.toggleRecord);
  const project = useProjectStore((s) => s.project);
  const setProjectBpm = useProjectStore((s) => s.setBpm);
  const { pitchClassMode, togglePitchClassMode, trailEnabled, toggleTrail, heatmapEnabled, toggleHeatmap, harmonyWindow, setHarmonyWindow } = useViewStore();

  function handleBpm(value: string) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      setProjectBpm(n);
      setAudioBpm(n);
    }
  }

  function backToStart() {
    if (playing) pausePlayback();
    useTransportStore.getState().setTick(0);
  }

  return (
    <div className="header-group">
      <button onClick={backToStart} className="transport-btn" title="Back to start">⏮</button>
      <button
        onClick={playing ? pausePlayback : startPlayback}
        className={`transport-btn ${playing ? 'playing' : ''}`}
        title={playing ? 'Pause (Space)' : 'Play (Space)'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <button onClick={stopPlayback} className={`transport-btn ${playing ? 'playing' : ''}`} title="Stop (rewinds to start)">⏹</button>
      <button onClick={toggleRecord} className="transport-btn" style={{ color: recording ? 'var(--accent)' : undefined }} title="Toggle record">●</button>
      <label>
        BPM
        <input type="number" value={project.bpm} onChange={(e) => handleBpm(e.target.value)} style={{ width: 56 }} />
      </label>
      <label title="How far back the chord detector looks. Arpeggios spread across a beat will still register as a triad.">
        Memory{' '}
        <select value={harmonyWindow} onChange={(e) => setHarmonyWindow(e.target.value as HarmonyWindow)}>
          <option value="off">off</option>
          <option value="1/16">1/16</option>
          <option value="1/8">1/8</option>
          <option value="1/4">1/4</option>
          <option value="1/2">1/2</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={pitchClassMode} onChange={togglePitchClassMode} />
        <span className="switch"></span>
        Pitch-class
      </label>
      <label className="toggle">
        <input type="checkbox" checked={trailEnabled} onChange={toggleTrail} />
        <span className="switch"></span>
        Trail
      </label>
      <label className="toggle">
        <input type="checkbox" checked={heatmapEnabled} onChange={toggleHeatmap} />
        <span className="switch"></span>
        Heatmap
      </label>
    </div>
  );
}
