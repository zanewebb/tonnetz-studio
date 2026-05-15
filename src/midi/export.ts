import { Midi } from '@tonejs/midi';
import { Project } from '../types/project';

export function exportMidi(project: Project): Blob {
  const midi = new Midi();
  // header.ppq is getter-only in @tonejs/midi; the library default (480) matches our PPQ constant
  midi.header.setTempo(project.bpm);
  for (const track of project.tracks) {
    const t = midi.addTrack();
    t.name = track.name;
    for (const n of track.notes) {
      t.addNote({
        midi: n.pitch,
        ticks: n.startTick,
        durationTicks: n.durationTicks,
        velocity: n.velocity / 127,
      });
    }
  }
  return new Blob([midi.toArray()], { type: 'audio/midi' });
}
