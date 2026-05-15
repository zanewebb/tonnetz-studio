import { describe, it, expect } from 'vitest';
import { findTriad } from './chords';

describe('findTriad', () => {
  it('detects C major from {C, E, G}', () => {
    expect(findTriad([60, 64, 67])).toEqual({ type: 'major', root: 0 });
  });

  it('detects A minor from {A, C, E}', () => {
    expect(findTriad([69, 60, 64])).toEqual({ type: 'minor', root: 9 });
  });

  it('is octave-invariant', () => {
    expect(findTriad([48, 76, 67])).toEqual({ type: 'major', root: 0 });
  });

  it('returns null when fewer than 3 distinct pitch classes', () => {
    expect(findTriad([60, 64])).toBeNull();
    expect(findTriad([60, 72])).toBeNull();
  });

  it('returns null for non-triad chords', () => {
    expect(findTriad([60, 64, 70])).toBeNull();   // C7 partial
    expect(findTriad([60, 63, 66])).toBeNull();   // diminished
  });

  it('returns null when more than 3 distinct pitch classes', () => {
    expect(findTriad([60, 64, 67, 70])).toBeNull();
  });
});
