import { create } from 'zustand';
import { Project, Note, emptyProject, noteId } from '../types/project';

type NoteInput = Omit<Note, 'id'>;

type ProjectState = {
  project: Project;
  history: Project[];      // undo snapshots
  reset: () => void;
  addNote: (note: NoteInput) => void;
  addNotes: (notes: NoteInput[]) => void;
  removeNote: (id: string) => void;
  setBpm: (bpm: number) => void;
  loadProject: (project: Project) => void;
  undo: () => void;
};

const UNDO_LIMIT = 50;

function snapshot(state: ProjectState): Project[] {
  const next = [...state.history, structuredClone(state.project)];
  return next.length > UNDO_LIMIT ? next.slice(-UNDO_LIMIT) : next;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: emptyProject(),
  history: [],

  reset: () => set({ project: emptyProject(), history: [] }),

  addNote: (note) => set((s) => {
    const newNote: Note = { id: noteId(), ...note };
    const tracks = s.project.tracks.map((t, i) =>
      i === 0 ? { ...t, notes: [...t.notes, newNote] } : t
    );
    return { project: { ...s.project, tracks }, history: snapshot(s) };
  }),

  addNotes: (notes) => set((s) => {
    const newNotes: Note[] = notes.map((n) => ({ id: noteId(), ...n }));
    const tracks = s.project.tracks.map((t, i) =>
      i === 0 ? { ...t, notes: [...t.notes, ...newNotes] } : t
    );
    return { project: { ...s.project, tracks }, history: snapshot(s) };
  }),

  removeNote: (id) => set((s) => {
    const tracks = s.project.tracks.map((t) => ({
      ...t, notes: t.notes.filter((n) => n.id !== id),
    }));
    return { project: { ...s.project, tracks }, history: snapshot(s) };
  }),

  setBpm: (bpm) => set((s) => ({
    project: { ...s.project, bpm },
    history: snapshot(s),
  })),

  loadProject: (project) => set(() => ({ project, history: [] })),

  undo: () => set((s) => {
    if (s.history.length === 0) return s;
    const previous = s.history[s.history.length - 1];
    return { project: previous, history: s.history.slice(0, -1) };
  }),
}));
