import { pitchClass } from '../music/pitch';

export type Triad = { type: 'major' | 'minor'; root: number };

export function findTriad(pitches: number[]): Triad | null {
  const pcSet = new Set(pitches.map(pitchClass));
  if (pcSet.size < 3) return null;
  for (const root of pcSet) {
    const third = (root + 4) % 12;
    const minorThird = (root + 3) % 12;
    const fifth = (root + 7) % 12;
    if (pcSet.has(fifth)) {
      if (pcSet.has(third)) return { type: 'major', root };
      if (pcSet.has(minorThird)) return { type: 'minor', root };
    }
  }
  return null;
}
