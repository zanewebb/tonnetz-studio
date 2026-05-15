import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './project';

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  it('starts with one empty track', () => {
    const { project } = useProjectStore.getState();
    expect(project.tracks).toHaveLength(1);
    expect(project.tracks[0].notes).toHaveLength(0);
  });

  it('addNote appends a note to track 0', () => {
    useProjectStore.getState().addNote({ pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 });
    const { project } = useProjectStore.getState();
    expect(project.tracks[0].notes).toHaveLength(1);
    expect(project.tracks[0].notes[0].pitch).toBe(60);
  });

  it('removeNote drops a note by id', () => {
    useProjectStore.getState().addNote({ pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 });
    const id = useProjectStore.getState().project.tracks[0].notes[0].id;
    useProjectStore.getState().removeNote(id);
    expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(0);
  });

  it('setBpm updates bpm', () => {
    useProjectStore.getState().setBpm(140);
    expect(useProjectStore.getState().project.bpm).toBe(140);
  });

  it('undo restores the previous project snapshot', () => {
    useProjectStore.getState().addNote({ pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 });
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(0);
  });
});
