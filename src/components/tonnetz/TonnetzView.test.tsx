import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TonnetzView } from './TonnetzView';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';

// Tone.js requires tslib which is not installed in the test environment;
// mock the audio engine so JSDOM does not try to import it.
vi.mock('../../audio/engine', () => ({
  previewNote: vi.fn(),
  previewChord: vi.fn(),
  isAudioStarted: vi.fn(() => false),
}));

describe('TonnetzView', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    useTransportStore.getState().reset();
  });

  it('renders cells with pitch labels', () => {
    render(<TonnetzView />);
    expect(screen.getAllByTestId('tonnetz-cell').length).toBeGreaterThan(0);
  });

  it('clicking a cell adds a note at the current tick', async () => {
    render(<TonnetzView />);
    const cells = screen.getAllByTestId('tonnetz-cell');
    await userEvent.click(cells[0]);
    expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(1);
  });

  it('clicking an edge adds two notes', () => {
    useProjectStore.getState().reset();
    render(<TonnetzView />);
    const edges = screen.getAllByTestId('tonnetz-edge');
    fireEvent.click(edges[0]);
    expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(2);
  });

  it('clicking a triangle adds three notes', () => {
    useProjectStore.getState().reset();
    render(<TonnetzView />);
    const tris = screen.getAllByTestId('tonnetz-triangle');
    fireEvent.click(tris[0]);
    expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(3);
  });

  it('lights cells whose pitches are sounding at the current tick', () => {
    useProjectStore.getState().reset();
    useProjectStore.getState().addNote({ pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 });
    useTransportStore.getState().setTick(0);
    render(<TonnetzView />);
    const lit = screen.getAllByTestId('tonnetz-cell').filter((el) =>
      (el as unknown as SVGCircleElement).getAttribute('fill') === '#c25b3b'
    );
    expect(lit.length).toBeGreaterThanOrEqual(1);
  });
});
