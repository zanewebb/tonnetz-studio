import { pitchClass } from '../music/pitch';

export type Triad = { type: 'major' | 'minor'; root: number };

export function findTriad(pitches: number[]): Triad | null {
  const pcs = Array.from(new Set(pitches.map(pitchClass)));
  if (pcs.length !== 3) return null;
  for (const root of pcs) {
    const third = (root + 4) % 12;
    const minorThird = (root + 3) % 12;
    const fifth = (root + 7) % 12;
    if (pcs.includes(fifth)) {
      if (pcs.includes(third)) return { type: 'major', root };
      if (pcs.includes(minorThird)) return { type: 'minor', root };
    }
  }
  return null;
}
