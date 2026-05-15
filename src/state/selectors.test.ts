import { describe, it, expect } from 'vitest';
import { computeSoundingNotes, computeTonalDistribution } from './selectors';
import { Note } from '../types/project';

const note = (id: string, pitch: number, start: number, dur: number): Note =>
  ({ id, pitch, startTick: start, durationTicks: dur, velocity: 100 });

describe('computeSoundingNotes', () => {
  it('returns notes whose interval [start, start+dur) contains tick', () => {
    const notes = [note('a', 60, 0, 480), note('b', 64, 480, 480)];
    expect(computeSoundingNotes(notes, 0).map(n => n.pitch)).toEqual([60]);
    expect(computeSoundingNotes(notes, 479).map(n => n.pitch)).toEqual([60]);
    expect(computeSoundingNotes(notes, 480).map(n => n.pitch)).toEqual([64]);
    expect(computeSoundingNotes(notes, 960).map(n => n.pitch)).toEqual([]);
  });
});

describe('computeTonalDistribution', () => {
  it('sums durations per pitch', () => {
    const notes = [
      note('a', 60, 0, 480),
      note('b', 60, 1000, 240),
      note('c', 64, 0, 720),
    ];
    const d = computeTonalDistribution(notes);
    expect(d.get(60)).toBe(720);
    expect(d.get(64)).toBe(720);
  });
});
