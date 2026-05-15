import * as Tone from 'tone';
import { Project, Note, PPQ } from '../types/project';
import { getSynth } from './engine';

const scheduledIds = new Map<string, number>();   // noteId → Tone event id

function ticksToTransportTime(ticks: number): string {
  return `${ticks}i`;
}

export function scheduleNote(note: Note): void {
  const id = Tone.Transport.schedule((time) => {
    const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();
    const durSec = (note.durationTicks / PPQ) * (60 / Tone.Transport.bpm.value);
    getSynth().triggerAttackRelease(freq, durSec, time, note.velocity / 127);
  }, ticksToTransportTime(note.startTick));
  scheduledIds.set(note.id, id);
}

export function cancelNote(noteId: string): void {
  const id = scheduledIds.get(noteId);
  if (id !== undefined) {
    Tone.Transport.clear(id);
    scheduledIds.delete(noteId);
  }
}

export function clearAll(): void {
  for (const id of scheduledIds.values()) Tone.Transport.clear(id);
  scheduledIds.clear();
}

export function rescheduleProject(project: Project): void {
  clearAll();
  for (const track of project.tracks) {
    for (const note of track.notes) scheduleNote(note);
  }
}

export function setPosition(ticks: number): void {
  Tone.Transport.position = `${ticks}i`;
}

export function play(): void {
  Tone.Transport.start();
}

export function stop(): void {
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  getSynth().releaseAll();
}
