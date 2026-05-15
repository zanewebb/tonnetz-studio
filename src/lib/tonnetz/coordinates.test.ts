import { describe, it, expect } from 'vitest';
import {
  axialToPitch, axialToXY, pitchToAxial, neighbours,
  ANCHOR_MIDI, DX, DY,
} from './coordinates';

describe('Tonnetz coordinates', () => {
  it('axialToPitch follows fifth-and-major-third axes', () => {
    expect(axialToPitch(0, 0)).toBe(ANCHOR_MIDI);          // C4 = 60
    expect(axialToPitch(1, 0)).toBe(ANCHOR_MIDI + 7);      // G4 = 67
    expect(axialToPitch(0, 1)).toBe(ANCHOR_MIDI + 4);      // E4 = 64
    expect(axialToPitch(1, 1)).toBe(ANCHOR_MIDI + 11);     // B4 = 71
    expect(axialToPitch(1, -1)).toBe(ANCHOR_MIDI + 3);     // Eb4 = 63
  });

  it('axialToXY uses dx=60, dy=52, half-offset by v', () => {
    expect(axialToXY(0, 0)).toEqual({ x: 0, y: 0 });
    expect(axialToXY(1, 0)).toEqual({ x: DX, y: 0 });
    expect(axialToXY(0, 1)).toEqual({ x: DX / 2, y: -DY });
  });

  it('pitchToAxial inverts axialToPitch when target is anchor', () => {
    const ax = pitchToAxial(ANCHOR_MIDI);
    expect(ax).not.toBeNull();
    expect(axialToPitch(ax!.u, ax!.v)).toBe(ANCHOR_MIDI);
  });

  it('pitchToAxial returns non-null for all chromatic pitches (algorithm covers full range)', () => {
    // The 7-step (fifths) + 4-step (major thirds) basis with v in [-3..3] covers
    // all 7 residues mod 7, so every pitch has a valid solution and never returns null.
    // The null return type is reserved for future algorithm variants with tighter bounds.
    for (let p = 0; p <= 127; p++) {
      expect(pitchToAxial(p)).not.toBeNull();
    }
  });

  it('neighbours returns six surrounding cells', () => {
    const ns = neighbours(0, 0);
    expect(ns).toHaveLength(6);
    expect(ns).toContainEqual({ u: 1, v: 0 });
    expect(ns).toContainEqual({ u: 0, v: 1 });
    expect(ns).toContainEqual({ u: 1, v: -1 });
    expect(ns).toContainEqual({ u: -1, v: 0 });
    expect(ns).toContainEqual({ u: 0, v: -1 });
    expect(ns).toContainEqual({ u: -1, v: 1 });
  });
});
