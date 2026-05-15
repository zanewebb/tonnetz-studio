import { describe, it, expect, beforeEach } from 'vitest';
import { useTransportStore } from './transport';
import { useSelectionStore } from './selection';
import { useViewStore } from './view';

describe('transportStore', () => {
  beforeEach(() => useTransportStore.getState().reset());

  it('starts stopped at tick 0', () => {
    const s = useTransportStore.getState();
    expect(s.playing).toBe(false);
    expect(s.recording).toBe(false);
    expect(s.currentTick).toBe(0);
  });

  it('play/stop toggles state', () => {
    useTransportStore.getState().play();
    expect(useTransportStore.getState().playing).toBe(true);
    useTransportStore.getState().stop();
    expect(useTransportStore.getState().playing).toBe(false);
    // currentTick is preserved across stop
  });

  it('setTick updates currentTick', () => {
    useTransportStore.getState().setTick(960);
    expect(useTransportStore.getState().currentTick).toBe(960);
  });
});

describe('selectionStore', () => {
  beforeEach(() => useSelectionStore.getState().clear());

  it('toggleCell adds and removes pitches', () => {
    useSelectionStore.getState().toggleCell(60);
    expect(useSelectionStore.getState().cells.has(60)).toBe(true);
    useSelectionStore.getState().toggleCell(60);
    expect(useSelectionStore.getState().cells.has(60)).toBe(false);
  });
});

describe('viewStore', () => {
  beforeEach(() => useViewStore.getState().reset());

  it('default values are reasonable', () => {
    const s = useViewStore.getState();
    expect(s.pitchClassMode).toBe(false);
    expect(s.trailEnabled).toBe(false);
    expect(s.noteLength).toBe('1/4');
    expect(s.zoom).toBe(1);
  });

  it('togglePitchClassMode flips the boolean', () => {
    useViewStore.getState().togglePitchClassMode();
    expect(useViewStore.getState().pitchClassMode).toBe(true);
  });
});
