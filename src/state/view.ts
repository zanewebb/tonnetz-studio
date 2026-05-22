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
  timelineHeight: number;
  timelineZoom: number;
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  togglePitchClassMode: () => void;
  toggleTrail: () => void;
  toggleHeatmap: () => void;
  setNoteLength: (n: NoteLength) => void;
  setOctaveAnchor: (oct: number) => void;
  setTimelineHeight: (h: number) => void;
  setTimelineZoom: (z: number) => void;
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
  timelineHeight: 320,
  timelineZoom: 1,
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
  setTimelineHeight: (timelineHeight) => set({ timelineHeight: Math.max(120, Math.min(900, timelineHeight)) }),
  setTimelineZoom: (timelineZoom) => set({ timelineZoom: Math.max(0.25, Math.min(4, timelineZoom)) }),
  reset: () => set(DEFAULTS),
}));
