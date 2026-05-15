import { create } from 'zustand';

type SelectionState = {
  cells: Set<number>;
  edges: Set<string>;
  triangles: Set<string>;
  selectedNoteIds: Set<string>;
  toggleCell: (pitch: number) => void;
  setNoteSelection: (ids: string[]) => void;
  addNoteSelection: (ids: string[]) => void;
  toggleNoteSelection: (id: string) => void;
  clearNoteSelection: () => void;
  clear: () => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  cells: new Set(),
  edges: new Set(),
  triangles: new Set(),
  selectedNoteIds: new Set(),
  toggleCell: (pitch) => set((s) => {
    const cells = new Set(s.cells);
    if (cells.has(pitch)) cells.delete(pitch); else cells.add(pitch);
    return { cells };
  }),
  setNoteSelection: (ids) => set({ selectedNoteIds: new Set(ids) }),
  addNoteSelection: (ids) => set((s) => {
    const next = new Set(s.selectedNoteIds);
    for (const id of ids) next.add(id);
    return { selectedNoteIds: next };
  }),
  toggleNoteSelection: (id) => set((s) => {
    const next = new Set(s.selectedNoteIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedNoteIds: next };
  }),
  clearNoteSelection: () => set({ selectedNoteIds: new Set() }),
  clear: () => set({
    cells: new Set(), edges: new Set(), triangles: new Set(),
    selectedNoteIds: new Set(),
  }),
}));
