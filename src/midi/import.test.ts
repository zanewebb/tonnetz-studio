import { describe, it, expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { importMidi } from './import';

function buildFixture(): ArrayBuffer {
  const m = new Midi();
  m.header.setTempo(140);
  const t = m.addTrack();
  t.name = 'Lead';
  t.addNote({ midi: 60, ticks: 0, durationTicks: 480, velocity: 0.8 });
  t.addNote({ midi: 64, ticks: 480, durationTicks: 240, velocity: 0.8 });
  return m.toArray().buffer.slice(0) as ArrayBuffer;
}

describe('importMidi', () => {
  it('parses notes and tempo from a single-track file', () => {
    const buf = buildFixture();
    const result = importMidi(buf, { strategy: 'merge' });
    expect(result.warnings).toEqual([]);
    expect(result.project.bpm).toBe(140);
    expect(result.project.tracks).toHaveLength(1);
    expect(result.project.tracks[0].notes).toHaveLength(2);
    expect(result.project.tracks[0].notes[0].pitch).toBe(60);
  });

  it('emits a warning for tempo changes', () => {
    const m = new Midi();
    m.header.tempos.push({ ticks: 0, bpm: 120 } as any);
    m.header.tempos.push({ ticks: 480, bpm: 150 } as any);
    const t = m.addTrack();
    t.addNote({ midi: 60, ticks: 0, durationTicks: 480, velocity: 0.8 });
    const buf = m.toArray().buffer.slice(0) as ArrayBuffer;
    const result = importMidi(buf, { strategy: 'merge' });
    expect(result.warnings.some(w => /tempo/i.test(w))).toBe(true);
  });
});
