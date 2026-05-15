export type Note = {
  id: string;
  pitch: number;          // MIDI 0-127
  startTick: number;
  durationTicks: number;
  velocity: number;       // 0-127
};

export type Track = {
  id: string;
  name: string;
  color: string;
  notes: Note[];
};

export type Project = {
  version: 1;
  name: string;
  bpm: number;
  timeSignature: [number, number];
  ppq: 480;
  tracks: Track[];
};

export const PPQ = 480 as const;

export function emptyProject(): Project {
  return {
    version: 1,
    name: 'Untitled',
    bpm: 120,
    timeSignature: [4, 4],
    ppq: PPQ,
    tracks: [{ id: 'track-1', name: 'Track 1', color: '#c25b3b', notes: [] }],
  };
}

let _counter = 0;
export function noteId(): string {
  return `n-${Date.now().toString(36)}-${(_counter++).toString(36)}`;
}
