import { Note } from '../types/project';

export function computeSoundingNotes(notes: Note[], tick: number): Note[] {
  return notes.filter((n) =>
    tick >= n.startTick && tick < n.startTick + n.durationTicks
  );
}

export function computeTonalDistribution(notes: Note[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const n of notes) {
    out.set(n.pitch, (out.get(n.pitch) ?? 0) + n.durationTicks);
  }
  return out;
}
