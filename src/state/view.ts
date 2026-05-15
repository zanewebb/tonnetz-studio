import { create } from 'zustand';

export type NoteLength = '1/16' | '1/8' | '1/4' | '1/2' | '1/1';

type ViewState = {
  pan: { x: number; y: number };
  zoom: number;
  pitchClassMode: boolean;
  trailEnabled: boolean;
  heatmapEnabled: boolean;
  noteLength: NoteLength;
  octaveAnchor: number;             // used in pitch-class mode
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  togglePitchClassMode: () => void;
  toggleTrail: () => void;
  toggleHeatmap: () => void;
  setNoteLength: (n: NoteLength) => void;
  setOctaveAnchor: (oct: number) => void;
  reset: () => void;
};

const DEFAULTS = {
  pan: { x: 0, y: 0 },
  zoom: 1,
  pitchClassMode: false,
  trailEnabled: false,
  heatmapEnabled: false,
  noteLength: '1/4' as NoteLength,
  octaveAnchor: 4,
};

export const useViewStore = create<ViewState>((set) => ({
  ...DEFAULTS,
  setPan: (pan) => set({ pan }),
  setZoom: (zoom) => set({ zoom }),
  togglePitchClassMode: () => set((s) => ({ pitchClassMode: !s.pitchClassMode })),
  toggleTrail: () => set((s) => ({ trailEnabled: !s.trailEnabled })),
  toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
  setNoteLength: (noteLength) => set({ noteLength }),
  setOctaveAnchor: (octaveAnchor) => set({ octaveAnchor }),
  reset: () => set(DEFAULTS),
}));
