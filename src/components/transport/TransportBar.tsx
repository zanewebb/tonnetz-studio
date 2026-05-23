import { useTransportStore } from '../../state/transport';
import { useProjectStore } from '../../state/project';
import { startPlayback, pausePlayback, stopPlayback } from '../../audio/transport';
import { setBpm as setAudioBpm } from '../../audio/engine';

export function TransportBar() {
  const playing = useTransportStore((s) => s.playing);
  const recording = useTransportStore((s) => s.recording);
  const toggleRecord = useTransportStore((s) => s.toggleRecord);
  const project = useProjectStore((s) => s.project);
  const setProjectBpm = useProjectStore((s) => s.setBpm);

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
      <div className="transport-cluster">
        <button onClick={backToStart} className="transport-btn" title="Back to start">⏮</button>
        <button
          onClick={playing ? pausePlayback : startPlayback}
          className={`transport-btn primary ${playing ? 'playing' : ''}`}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={stopPlayback} className={`transport-btn ${playing ? 'playing' : ''}`} title="Stop (rewinds to start)">⏹</button>
        <button onClick={toggleRecord} className={`transport-btn ${recording ? 'recording' : ''}`} title="Toggle record">●</button>
      </div>
      <label className="inline-field">
        <span>BPM</span>
        <input type="number" value={project.bpm} onChange={(e) => handleBpm(e.target.value)} style={{ width: 56 }} />
      </label>
    </div>
  );
}
