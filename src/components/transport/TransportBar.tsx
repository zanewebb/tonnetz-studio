import { useTransportStore } from '../../state/transport';
import { useProjectStore } from '../../state/project';
import { useViewStore, NoteLength } from '../../state/view';
import { play as audioPlay, stop as audioStop, rescheduleProject } from '../../audio/scheduler';
import { startAudio, setBpm as setAudioBpm } from '../../audio/engine';
import { startPlayheadSync, stopPlayheadSync } from '../../audio/playheadSync';

export function TransportBar() {
  const { playing, recording, play, stop, toggleRecord } = useTransportStore();
  const project = useProjectStore((s) => s.project);
  const setProjectBpm = useProjectStore((s) => s.setBpm);
  const { noteLength, setNoteLength, pitchClassMode, togglePitchClassMode, trailEnabled, toggleTrail, heatmapEnabled, toggleHeatmap } = useViewStore();

  async function handlePlay() {
    await startAudio();
    setAudioBpm(project.bpm);
    rescheduleProject(project);
    audioPlay();
    startPlayheadSync();
    play();
  }

  function handleStop() {
    audioStop();
    stopPlayheadSync();
    stop();
  }

  function handleBpm(value: string) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      setProjectBpm(n);
      setAudioBpm(n);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8 }}>
      <button onClick={playing ? handleStop : handlePlay}>{playing ? '⏹' : '▶'}</button>
      <button onClick={toggleRecord} style={{ color: recording ? '#c25b3b' : undefined }}>
        ● Rec
      </button>
      <label>
        BPM <input type="number" value={project.bpm} onChange={(e) => handleBpm(e.target.value)} style={{ width: 60 }} />
      </label>
      <label>
        Length
        <select value={noteLength} onChange={(e) => setNoteLength(e.target.value as NoteLength)}>
          {(['1/16','1/8','1/4','1/2','1/1'] as NoteLength[]).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
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
