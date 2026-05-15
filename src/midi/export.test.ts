import { describe, it, expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { exportMidi } from './export';
import { Project } from '../types/project';

describe('exportMidi', () => {
  it('produces a parseable .mid blob with the right notes and tempo', async () => {
    const project: Project = {
      version: 1, name: 'Test', bpm: 110, timeSignature: [4, 4], ppq: 480,
      tracks: [{
        id: 't1', name: 'Lead', color: '#fff',
        notes: [
          { id: 'a', pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 },
          { id: 'b', pitch: 64, startTick: 480, durationTicks: 240, velocity: 80 },
        ],
      }],
    };
    const blob = exportMidi(project);
    const buf = await blob.arrayBuffer();
    const parsed = new Midi(buf);
    expect(parsed.tracks[0].notes).toHaveLength(2);
    expect(parsed.tracks[0].notes[0].midi).toBe(60);
    expect(parsed.header.tempos[0].bpm).toBeCloseTo(110, 1);
  });
});
