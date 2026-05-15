import { create } from 'zustand';

type SelectionState = {
  cells: Set<number>;       // pitches
  edges: Set<string>;       // 'pitchA-pitchB' (sorted)
  triangles: Set<string>;   // 'pitchA-pitchB-pitchC' (sorted)
  toggleCell: (pitch: number) => void;
  clear: () => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  cells: new Set(),
  edges: new Set(),
  triangles: new Set(),
  toggleCell: (pitch) => set((s) => {
    const cells = new Set(s.cells);
    if (cells.has(pitch)) cells.delete(pitch); else cells.add(pitch);
    return { cells };
  }),
  clear: () => set({ cells: new Set(), edges: new Set(), triangles: new Set() }),
}));
