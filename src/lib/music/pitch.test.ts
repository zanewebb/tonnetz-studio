import { describe, it, expect } from 'vitest';
import { pitchClass, octaveOf, midiToName, nameToMidi } from './pitch';

describe('pitch', () => {
  it('pitchClass returns 0-11', () => {
    expect(pitchClass(60)).toBe(0);   // C4
    expect(pitchClass(61)).toBe(1);   // C#4
    expect(pitchClass(72)).toBe(0);   // C5
  });

  it('octaveOf returns scientific octave', () => {
    expect(octaveOf(60)).toBe(4);    // middle C is C4
    expect(octaveOf(72)).toBe(5);
    expect(octaveOf(0)).toBe(-1);
  });

  it('midiToName produces sharps by default', () => {
    expect(midiToName(60)).toBe('C4');
    expect(midiToName(61)).toBe('C#4');
    expect(midiToName(70)).toBe('A#4');
  });

  it('nameToMidi is the inverse of midiToName', () => {
    for (const m of [0, 21, 60, 61, 70, 108, 127]) {
      expect(nameToMidi(midiToName(m))).toBe(m);
    }
  });
});
