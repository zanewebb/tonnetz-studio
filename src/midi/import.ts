import { Midi } from '@tonejs/midi';
import { Project, Note, PPQ, noteId, emptyProject } from '../types/project';
import { rescaleTicks } from './normalize';

export type ImportStrategy = { strategy: 'merge' } | { strategy: 'pick'; trackIndex: number };

export type ImportResult = {
  project: Project;
  warnings: string[];
  detectedTracks: { index: number; name: string; noteCount: number }[];
};

export function importMidi(buffer: ArrayBuffer, opts: ImportStrategy): ImportResult {
  const midi = new Midi(buffer);
  const warnings: string[] = [];
  const sourcePPQ = midi.header.ppq;

  const detectedTracks = midi.tracks.map((t, i) => ({
    index: i,
    name: t.name || `Track ${i + 1}`,
    noteCount: t.notes.length,
  }));

  const firstTempo = Math.round(midi.header.tempos[0]?.bpm ?? 120);
  if (midi.header.tempos.length > 1) {
    warnings.push(`Tempo changes were flattened to ${firstTempo} BPM (v1 limitation).`);
  }

  const ts = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4];
  if (ts[0] !== 4 || ts[1] !== 4) {
    warnings.push(`Time signature ${ts[0]}/${ts[1]} loaded as 4/4 (v1 limitation).`);
  }

  const sourceTracks = opts.strategy === 'pick' ? [midi.tracks[opts.trackIndex]] : midi.tracks;
  const allNotes: Note[] = [];
  for (const t of sourceTracks) {
    for (const n of t.notes) {
      allNotes.push({
        id: noteId(),
        pitch: n.midi,
        startTick: rescaleTicks(n.ticks, sourcePPQ, PPQ),
        durationTicks: rescaleTicks(n.durationTicks, sourcePPQ, PPQ),
        velocity: Math.round(n.velocity * 127),
      });
    }
  }

  const project: Project = {
    ...emptyProject(),
    bpm: firstTempo,
    tracks: [{ id: 'track-1', name: 'Imported', color: '#c25b3b', notes: allNotes }],
  };

  return { project, warnings, detectedTracks };
}
