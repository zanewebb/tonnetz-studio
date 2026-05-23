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

export function computeDyadDistribution(notes: Note[]): Map<string, number> {
  // For every tick window between consecutive event boundaries, find sounding PCs
  // and attribute the window's duration to every pair of sounding PCs.
  const boundaries = new Set<number>();
  for (const n of notes) {
    boundaries.add(n.startTick);
    boundaries.add(n.startTick + n.durationTicks);
  }
  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const out = new Map<string, number>();
  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = sorted[i];
    const t1 = sorted[i + 1];
    const dur = t1 - t0;
    if (dur <= 0) continue;
    const activePCs = new Set<number>();
    for (const n of notes) {
      if (n.startTick <= t0 && n.startTick + n.durationTicks > t0) {
        activePCs.add(((n.pitch % 12) + 12) % 12);
      }
    }
    const arr = Array.from(activePCs).sort((a, b) => a - b);
    for (let a = 0; a < arr.length; a++) {
      for (let b = a + 1; b < arr.length; b++) {
        const key = `${arr[a]}-${arr[b]}`;
        out.set(key, (out.get(key) ?? 0) + dur);
      }
    }
  }
  return out;
}

export function computeTriadDistribution(notes: Note[]): Map<string, number> {
  // Same sweep, but triples
  const boundaries = new Set<number>();
  for (const n of notes) {
    boundaries.add(n.startTick);
    boundaries.add(n.startTick + n.durationTicks);
  }
  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const out = new Map<string, number>();
  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = sorted[i];
    const t1 = sorted[i + 1];
    const dur = t1 - t0;
    if (dur <= 0) continue;
    const activePCs = new Set<number>();
    for (const n of notes) {
      if (n.startTick <= t0 && n.startTick + n.durationTicks > t0) {
        activePCs.add(((n.pitch % 12) + 12) % 12);
      }
    }
    const arr = Array.from(activePCs).sort((a, b) => a - b);
    for (let a = 0; a < arr.length; a++) {
      for (let b = a + 1; b < arr.length; b++) {
        for (let c = b + 1; c < arr.length; c++) {
          const key = `${arr[a]}-${arr[b]}-${arr[c]}`;
          out.set(key, (out.get(key) ?? 0) + dur);
        }
      }
    }
  }
  return out;
}

export function computeHarmonicNotes(notes: Note[], tick: number, windowTicks: number): Note[] {
  // Notes whose original interval intersects [tick - windowTicks, tick]
  return notes.filter((n) => {
    const noteEnd = n.startTick + n.durationTicks;
    return noteEnd >= tick - windowTicks && n.startTick <= tick;
  });
}
