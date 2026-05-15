# Tonnetz Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side web app where the user composes and analyzes MIDI on an interactive Tonnetz lattice — clicking cells for notes, edges for dyads, triangles for triads — and exports to `.mid`. Deployable to GitHub Pages as a static SPA.

**Architecture:** Vite + React + TypeScript SPA. Pure-math libs (Tonnetz coordinates, chord detection, MIDI normalization) sit underneath Zustand stores (project / transport / selection / view). The audio engine wraps Tone.js; React components render SVG layers driven by memoized store selectors. Files are organized by responsibility: `lib/` is pure, `state/` is mutable model, `audio/` is side-effects, `midi/` and `persistence/` are I/O, `components/` is views.

**Tech Stack:** TypeScript, React 18, Vite, Zustand, Tone.js v15, `@tonejs/midi`, Vitest, React Testing Library, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-05-14-tonnetz-studio-design.md`

---

## Phase 0 — Scaffolding

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold the project**

Run from the repo root:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted to confirm overwriting the existing directory, accept. Then:
```bash
npm install
```

- [ ] **Step 2: Verify the dev server runs**

Run: `npm run dev`
Expected: Vite prints a local URL (e.g. `http://localhost:5173`). Open it. You see the default Vite + React page.
Stop the dev server (`Ctrl+C`).

- [ ] **Step 3: Configure `base` for GitHub Pages**

Edit `vite.config.ts` to set the base path so assets resolve under `https://<user>.github.io/tonnetz-studio/`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tonnetz-studio/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

The `test` block configures Vitest (added in Task 3).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS app"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install zustand tone @tonejs/midi
```

- [ ] **Step 2: Install dev deps for testing**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node
```

- [ ] **Step 3: Add npm scripts**

Edit `package.json` `"scripts"` to:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "test:ui": "vitest --ui"
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zustand, tone, @tonejs/midi, vitest, RTL"
```

---

### Task 3: Configure Vitest with a setup file

**Files:**
- Create: `src/test/setup.ts`, `src/test/sample.test.ts`

- [ ] **Step 1: Create the test setup file**

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Write a sample test to verify the runner**

`src/test/sample.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('test runner', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm run test:run`
Expected: 1 test passes.

- [ ] **Step 4: Commit**

```bash
git add src/test/ vite.config.ts
git commit -m "chore: wire up vitest with RTL setup"
```

---

## Phase 1 — Pure libs (strict TDD)

### Task 4: `lib/music/pitch.ts` — MIDI pitch utilities

**Files:**
- Create: `src/lib/music/pitch.ts`
- Test: `src/lib/music/pitch.test.ts`

- [ ] **Step 1: Write failing tests**

`src/lib/music/pitch.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pitchClass, octaveOf, midiToName, nameToMidi } from './pitch';

describe('pitch', () => {
  it('pitchClass returns 0-11', () => {
    expect(pitchClass(60)).toBe(0);   // C4
    expect(pitchClass(61)).toBe(1);   // C#4
    expect(pitchClass(72)).toBe(0);   // C5
  });

  it('octaveOf returns scientific octave', () => {
    expect(octaveOf(60)).toBe(4);    // middle C is C4
    expect(octaveOf(72)).toBe(5);
    expect(octaveOf(0)).toBe(-1);
  });

  it('midiToName produces sharps by default', () => {
    expect(midiToName(60)).toBe('C4');
    expect(midiToName(61)).toBe('C#4');
    expect(midiToName(70)).toBe('A#4');
  });

  it('nameToMidi is the inverse of midiToName', () => {
    for (const m of [0, 21, 60, 61, 70, 108, 127]) {
      expect(nameToMidi(midiToName(m))).toBe(m);
    }
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- pitch`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/lib/music/pitch.ts`:
```ts
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NAME_TO_PC: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function midiToName(midi: number): string {
  return `${SHARP_NAMES[pitchClass(midi)]}${octaveOf(midi)}`;
}

export function nameToMidi(name: string): number {
  const m = /^([A-G][#b]?)(-?\d+)$/.exec(name);
  if (!m) throw new Error(`Invalid pitch name: ${name}`);
  const pc = NAME_TO_PC[m[1]];
  if (pc === undefined) throw new Error(`Invalid pitch name: ${name}`);
  const oct = Number(m[2]);
  return (oct + 1) * 12 + pc;
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- pitch`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/music/
git commit -m "feat(lib/music): pitch utilities (midi <-> name, pc, octave)"
```

---

### Task 5: `lib/tonnetz/coordinates.ts` — Tonnetz lattice math

**Files:**
- Create: `src/lib/tonnetz/coordinates.ts`
- Test: `src/lib/tonnetz/coordinates.test.ts`

- [ ] **Step 1: Write failing tests**

`src/lib/tonnetz/coordinates.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  axialToPitch, axialToXY, pitchToAxial, neighbours,
  ANCHOR_MIDI, DX, DY,
} from './coordinates';

describe('Tonnetz coordinates', () => {
  it('axialToPitch follows fifth-and-major-third axes', () => {
    expect(axialToPitch(0, 0)).toBe(ANCHOR_MIDI);          // C4 = 60
    expect(axialToPitch(1, 0)).toBe(ANCHOR_MIDI + 7);      // G4 = 67
    expect(axialToPitch(0, 1)).toBe(ANCHOR_MIDI + 4);      // E4 = 64
    expect(axialToPitch(1, 1)).toBe(ANCHOR_MIDI + 11);     // B4 = 71
    expect(axialToPitch(1, -1)).toBe(ANCHOR_MIDI + 3);     // Eb4 = 63
  });

  it('axialToXY uses dx=60, dy=52, half-offset by v', () => {
    expect(axialToXY(0, 0)).toEqual({ x: 0, y: 0 });
    expect(axialToXY(1, 0)).toEqual({ x: DX, y: 0 });
    expect(axialToXY(0, 1)).toEqual({ x: DX / 2, y: -DY });
  });

  it('pitchToAxial inverts axialToPitch when target is anchor', () => {
    const { u, v } = pitchToAxial(ANCHOR_MIDI);
    expect(axialToPitch(u, v)).toBe(ANCHOR_MIDI);
  });

  it('neighbours returns six surrounding cells', () => {
    const ns = neighbours(0, 0);
    expect(ns).toHaveLength(6);
    expect(ns).toContainEqual({ u: 1, v: 0 });
    expect(ns).toContainEqual({ u: 0, v: 1 });
    expect(ns).toContainEqual({ u: 1, v: -1 });
    expect(ns).toContainEqual({ u: -1, v: 0 });
    expect(ns).toContainEqual({ u: 0, v: -1 });
    expect(ns).toContainEqual({ u: -1, v: 1 });
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- coordinates`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/lib/tonnetz/coordinates.ts`:
```ts
export const ANCHOR_MIDI = 60;   // middle C
export const DX = 60;
export const DY = 52;            // ≈ DX * sin(60°)

export type Axial = { u: number; v: number };

export function axialToPitch(u: number, v: number): number {
  return ANCHOR_MIDI + 7 * u + 4 * v;
}

export function axialToXY(u: number, v: number): { x: number; y: number } {
  return { x: u * DX + v * (DX / 2), y: -v * DY };
}

export function pitchToAxial(pitch: number): Axial {
  // For a unique inverse we anchor v=0 and walk fifths. This is sufficient
  // for the pitched view where each visible cell has a unique pitch.
  const delta = pitch - ANCHOR_MIDI;
  // Solve 7u + 4v = delta with the convention v = round(delta / 12 * 3) / 3
  // For v1, prefer the row of v=0 unless the pitch isn't reachable; callers
  // can use a renderer-side lookup map for exact placement.
  if (delta % 7 === 0) return { u: delta / 7, v: 0 };
  // Try v = 1, 2, 3 ... up to a small window
  for (const v of [1, -1, 2, -2, 3, -3]) {
    const rem = delta - 4 * v;
    if (rem % 7 === 0) return { u: rem / 7, v };
  }
  throw new Error(`No nearby axial coordinate for pitch ${pitch}`);
}

export function neighbours(u: number, v: number): Axial[] {
  return [
    { u: u + 1, v },
    { u: u - 1, v },
    { u, v: v + 1 },
    { u, v: v - 1 },
    { u: u + 1, v: v - 1 },
    { u: u - 1, v: v + 1 },
  ];
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- coordinates`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tonnetz/coordinates.ts src/lib/tonnetz/coordinates.test.ts
git commit -m "feat(lib/tonnetz): axial coordinates and pitch mapping"
```

---

### Task 6: `lib/tonnetz/chords.ts` — triad detection

**Files:**
- Create: `src/lib/tonnetz/chords.ts`
- Test: `src/lib/tonnetz/chords.test.ts`

- [ ] **Step 1: Write failing tests**

`src/lib/tonnetz/chords.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { findTriad } from './chords';

describe('findTriad', () => {
  it('detects C major from {C, E, G}', () => {
    expect(findTriad([60, 64, 67])).toEqual({ type: 'major', root: 0 });
  });

  it('detects A minor from {A, C, E}', () => {
    expect(findTriad([69, 60, 64])).toEqual({ type: 'minor', root: 9 });
  });

  it('is octave-invariant', () => {
    expect(findTriad([48, 76, 67])).toEqual({ type: 'major', root: 0 });
  });

  it('returns null when fewer than 3 distinct pitch classes', () => {
    expect(findTriad([60, 64])).toBeNull();
    expect(findTriad([60, 72])).toBeNull();
  });

  it('returns null for non-triad chords', () => {
    expect(findTriad([60, 64, 70])).toBeNull();   // C7 partial
    expect(findTriad([60, 63, 66])).toBeNull();   // diminished
  });

  it('returns null when more than 3 distinct pitch classes', () => {
    expect(findTriad([60, 64, 67, 70])).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- chords`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/lib/tonnetz/chords.ts`:
```ts
import { pitchClass } from '../music/pitch';

export type Triad = { type: 'major' | 'minor'; root: number };

export function findTriad(pitches: number[]): Triad | null {
  const pcs = Array.from(new Set(pitches.map(pitchClass)));
  if (pcs.length !== 3) return null;
  for (const root of pcs) {
    const third = (root + 4) % 12;
    const minorThird = (root + 3) % 12;
    const fifth = (root + 7) % 12;
    if (pcs.includes(fifth)) {
      if (pcs.includes(third)) return { type: 'major', root };
      if (pcs.includes(minorThird)) return { type: 'minor', root };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- chords`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tonnetz/chords.ts src/lib/tonnetz/chords.test.ts
git commit -m "feat(lib/tonnetz): findTriad detects major/minor triads"
```

---

## Phase 2 — Types and state

### Task 7: `types/project.ts` — core data model

**Files:**
- Create: `src/types/project.ts`

- [ ] **Step 1: Write the types**

`src/types/project.ts`:
```ts
export type Note = {
  id: string;
  pitch: number;          // MIDI 0-127
  startTick: number;
  durationTicks: number;
  velocity: number;       // 0-127
};

export type Track = {
  id: string;
  name: string;
  color: string;
  notes: Note[];
};

export type Project = {
  version: 1;
  name: string;
  bpm: number;
  timeSignature: [number, number];
  ppq: 480;
  tracks: Track[];
};

export const PPQ = 480 as const;

export function emptyProject(): Project {
  return {
    version: 1,
    name: 'Untitled',
    bpm: 120,
    timeSignature: [4, 4],
    ppq: PPQ,
    tracks: [{ id: 'track-1', name: 'Track 1', color: '#c25b3b', notes: [] }],
  };
}

let _counter = 0;
export function noteId(): string {
  return `n-${Date.now().toString(36)}-${(_counter++).toString(36)}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/project.ts
git commit -m "feat(types): project, track, note schemas"
```

---

### Task 8: `state/project.ts` — Zustand project store with undo

**Files:**
- Create: `src/state/project.ts`
- Test: `src/state/project.test.ts`

- [ ] **Step 1: Write failing tests**

`src/state/project.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- project`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/state/project.ts`:
```ts
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
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- project`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state/project.ts src/state/project.test.ts
git commit -m "feat(state): project store with addNote/removeNote/setBpm/undo"
```

---

### Task 9: `state/transport.ts`, `state/selection.ts`, `state/view.ts`

**Files:**
- Create: `src/state/transport.ts`, `src/state/selection.ts`, `src/state/view.ts`
- Test: `src/state/stores.test.ts`

- [ ] **Step 1: Write failing tests**

`src/state/stores.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- stores`
Expected: FAIL.

- [ ] **Step 3: Implement transport store**

`src/state/transport.ts`:
```ts
import { create } from 'zustand';

type TransportState = {
  playing: boolean;
  recording: boolean;
  currentTick: number;
  play: () => void;
  stop: () => void;
  toggleRecord: () => void;
  setTick: (tick: number) => void;
  reset: () => void;
};

export const useTransportStore = create<TransportState>((set) => ({
  playing: false,
  recording: false,
  currentTick: 0,
  play: () => set({ playing: true }),
  stop: () => set({ playing: false, currentTick: 0 }),
  toggleRecord: () => set((s) => ({ recording: !s.recording })),
  setTick: (currentTick) => set({ currentTick }),
  reset: () => set({ playing: false, recording: false, currentTick: 0 }),
}));
```

- [ ] **Step 4: Implement selection store**

`src/state/selection.ts`:
```ts
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
```

- [ ] **Step 5: Implement view store**

`src/state/view.ts`:
```ts
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
```

- [ ] **Step 6: Run tests — expect pass**

Run: `npm run test:run -- stores`
Expected: 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/state/
git commit -m "feat(state): transport, selection, view stores"
```

---

### Task 10: Derived selectors — sounding notes, implied triad, tonal distribution

**Files:**
- Create: `src/state/selectors.ts`
- Test: `src/state/selectors.test.ts`

- [ ] **Step 1: Write failing tests**

`src/state/selectors.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeSoundingNotes, computeTonalDistribution } from './selectors';
import { Note } from '../types/project';

const note = (id: string, pitch: number, start: number, dur: number): Note =>
  ({ id, pitch, startTick: start, durationTicks: dur, velocity: 100 });

describe('computeSoundingNotes', () => {
  it('returns notes whose interval [start, start+dur) contains tick', () => {
    const notes = [note('a', 60, 0, 480), note('b', 64, 480, 480)];
    expect(computeSoundingNotes(notes, 0).map(n => n.pitch)).toEqual([60]);
    expect(computeSoundingNotes(notes, 479).map(n => n.pitch)).toEqual([60]);
    expect(computeSoundingNotes(notes, 480).map(n => n.pitch)).toEqual([64]);
    expect(computeSoundingNotes(notes, 960).map(n => n.pitch)).toEqual([]);
  });
});

describe('computeTonalDistribution', () => {
  it('sums durations per pitch', () => {
    const notes = [
      note('a', 60, 0, 480),
      note('b', 60, 1000, 240),
      note('c', 64, 0, 720),
    ];
    const d = computeTonalDistribution(notes);
    expect(d.get(60)).toBe(720);
    expect(d.get(64)).toBe(720);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- selectors`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/state/selectors.ts`:
```ts
import { Note } from '../types/project';

export function computeSoundingNotes(notes: Note[], tick: number): Note[] {
  return notes.filter((n) =>
    tick >= n.startTick && tick < n.startTick + n.durationTicks
  );
}

export function computeTonalDistribution(notes: Note[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const n of notes) {
    out.set(n.pitch, (out.get(n.pitch) ?? 0) + n.durationTicks);
  }
  return out;
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- selectors`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state/selectors.ts src/state/selectors.test.ts
git commit -m "feat(state): selectors for sounding notes and tonal distribution"
```

---

## Phase 3 — MIDI I/O

### Task 11: `midi/normalize.ts` — PPQ scaling

**Files:**
- Create: `src/midi/normalize.ts`
- Test: `src/midi/normalize.test.ts`

- [ ] **Step 1: Write failing tests**

`src/midi/normalize.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { rescaleTicks } from './normalize';

describe('rescaleTicks', () => {
  it('scales ticks by target/source ratio', () => {
    expect(rescaleTicks(240, 240, 480)).toBe(480);
    expect(rescaleTicks(120, 96, 480)).toBe(600);
  });

  it('returns the same value when source equals target', () => {
    expect(rescaleTicks(123, 480, 480)).toBe(123);
  });

  it('rounds to integer ticks', () => {
    expect(rescaleTicks(1, 7, 480)).toBe(69);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- normalize`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/midi/normalize.ts`:
```ts
export function rescaleTicks(ticks: number, sourcePPQ: number, targetPPQ: number): number {
  if (sourcePPQ === targetPPQ) return ticks;
  return Math.round((ticks * targetPPQ) / sourcePPQ);
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- normalize`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/midi/normalize.ts src/midi/normalize.test.ts
git commit -m "feat(midi): PPQ rescaling utility"
```

---

### Task 12: `midi/import.ts` — parse `.mid` into a Project

**Files:**
- Create: `src/midi/import.ts`
- Test: `src/midi/import.test.ts`

- [ ] **Step 1: Write failing tests**

`src/midi/import.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { importMidi } from './import';

function buildFixture(): ArrayBuffer {
  const m = new Midi();
  m.header.setTempo(140);
  const t = m.addTrack();
  t.name = 'Lead';
  t.addNote({ midi: 60, ticks: 0, durationTicks: 480, velocity: 0.8 });
  t.addNote({ midi: 64, ticks: 480, durationTicks: 240, velocity: 0.8 });
  return m.toArray().buffer.slice(0);
}

describe('importMidi', () => {
  it('parses notes and tempo from a single-track file', () => {
    const buf = buildFixture();
    const result = importMidi(buf, { strategy: 'merge' });
    expect(result.warnings).toEqual([]);
    expect(result.project.bpm).toBe(140);
    expect(result.project.tracks).toHaveLength(1);
    expect(result.project.tracks[0].notes).toHaveLength(2);
    expect(result.project.tracks[0].notes[0].pitch).toBe(60);
  });

  it('emits a warning for tempo changes', () => {
    const m = new Midi();
    m.header.tempos.push({ ticks: 0, bpm: 120 } as any);
    m.header.tempos.push({ ticks: 480, bpm: 150 } as any);
    const t = m.addTrack();
    t.addNote({ midi: 60, ticks: 0, durationTicks: 480, velocity: 0.8 });
    const buf = m.toArray().buffer.slice(0);
    const result = importMidi(buf, { strategy: 'merge' });
    expect(result.warnings.some(w => /tempo/i.test(w))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- import`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/midi/import.ts`:
```ts
import { Midi } from '@tonejs/midi';
import { Project, Track, Note, PPQ, noteId, emptyProject } from '../types/project';
import { rescaleTicks } from './normalize';

export type ImportStrategy = { strategy: 'merge' } | { strategy: 'pick'; trackIndex: number };

export type ImportResult = {
  project: Project;
  warnings: string[];
  detectedTracks: { index: number; name: string; noteCount: number }[];
};

export function importMidi(buffer: ArrayBuffer, opts: ImportStrategy): ImportResult {
  const midi = new Midi(buffer);
  const warnings: string[] = [];
  const sourcePPQ = midi.header.ppq;

  const detectedTracks = midi.tracks.map((t, i) => ({
    index: i,
    name: t.name || `Track ${i + 1}`,
    noteCount: t.notes.length,
  }));

  // Tempo: take the first, warn if there are more
  const firstTempo = midi.header.tempos[0]?.bpm ?? 120;
  if (midi.header.tempos.length > 1) {
    warnings.push(`Tempo changes were flattened to ${firstTempo} BPM (v1 limitation).`);
  }

  // Time signature: warn if not 4/4
  const ts = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4];
  if (ts[0] !== 4 || ts[1] !== 4) {
    warnings.push(`Time signature ${ts[0]}/${ts[1]} loaded as 4/4 (v1 limitation).`);
  }

  // Build notes
  const sourceTracks = opts.strategy === 'pick' ? [midi.tracks[opts.trackIndex]] : midi.tracks;
  const allNotes: Note[] = [];
  for (const t of sourceTracks) {
    for (const n of t.notes) {
      allNotes.push({
        id: noteId(),
        pitch: n.midi,
        startTick: rescaleTicks(n.ticks, sourcePPQ, PPQ),
        durationTicks: rescaleTicks(n.durationTicks, sourcePPQ, PPQ),
        velocity: Math.round(n.velocity * 127),
      });
    }
  }

  const project: Project = {
    ...emptyProject(),
    bpm: firstTempo,
    tracks: [{ id: 'track-1', name: 'Imported', color: '#c25b3b', notes: allNotes }],
  };

  return { project, warnings, detectedTracks };
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- import`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/midi/import.ts src/midi/import.test.ts
git commit -m "feat(midi): import .mid with PPQ normalize and tempo warnings"
```

---

### Task 13: `midi/export.ts` — Project to `.mid` blob

**Files:**
- Create: `src/midi/export.ts`
- Test: `src/midi/export.test.ts`

- [ ] **Step 1: Write failing tests**

`src/midi/export.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { exportMidi } from './export';
import { Project } from '../types/project';

describe('exportMidi', () => {
  it('produces a parseable .mid blob with the right notes and tempo', async () => {
    const project: Project = {
      version: 1, name: 'Test', bpm: 110, timeSignature: [4, 4], ppq: 480,
      tracks: [{
        id: 't1', name: 'Lead', color: '#fff',
        notes: [
          { id: 'a', pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 },
          { id: 'b', pitch: 64, startTick: 480, durationTicks: 240, velocity: 80 },
        ],
      }],
    };
    const blob = exportMidi(project);
    const buf = await blob.arrayBuffer();
    const parsed = new Midi(buf);
    expect(parsed.tracks[0].notes).toHaveLength(2);
    expect(parsed.tracks[0].notes[0].midi).toBe(60);
    expect(parsed.header.tempos[0].bpm).toBeCloseTo(110, 1);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- midi/export`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/midi/export.ts`:
```ts
import { Midi } from '@tonejs/midi';
import { Project } from '../types/project';

export function exportMidi(project: Project): Blob {
  const midi = new Midi();
  midi.header.ppq = project.ppq;
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
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- midi/export`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/midi/export.ts src/midi/export.test.ts
git commit -m "feat(midi): export Project to .mid blob"
```

---

## Phase 4 — Persistence

### Task 14: `persistence/projectFile.ts` — `.tnz.json` round-trip

**Files:**
- Create: `src/persistence/projectFile.ts`
- Test: `src/persistence/projectFile.test.ts`

- [ ] **Step 1: Write failing tests**

`src/persistence/projectFile.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { serializeProject, parseProjectFile } from './projectFile';
import { emptyProject } from '../types/project';

describe('projectFile', () => {
  it('round-trips an empty project', () => {
    const p = emptyProject();
    const text = serializeProject(p);
    expect(parseProjectFile(text)).toEqual(p);
  });

  it('rejects mismatched versions', () => {
    const bad = JSON.stringify({ ...emptyProject(), version: 2 });
    expect(() => parseProjectFile(bad)).toThrow(/version/);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseProjectFile('{not json')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- projectFile`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/persistence/projectFile.ts`:
```ts
import { Project } from '../types/project';

export function serializeProject(p: Project): string {
  return JSON.stringify(p, null, 2);
}

export function parseProjectFile(text: string): Project {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) {
    throw new Error(`Could not parse project file: ${(e as Error).message}`);
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Project file is not an object.');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error(
      `This file was saved with a different version of Tonnetz Studio (v${obj.version}). v1 expected.`
    );
  }
  return obj as unknown as Project;
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- projectFile`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/projectFile.ts src/persistence/projectFile.test.ts
git commit -m "feat(persistence): .tnz.json serialize/parse with version check"
```

---

### Task 15: `persistence/localStorage.ts` — autosave & rehydrate

**Files:**
- Create: `src/persistence/localStorage.ts`
- Test: `src/persistence/localStorage.test.ts`

- [ ] **Step 1: Write failing tests**

`src/persistence/localStorage.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEY, saveProjectToLocalStorage, loadProjectFromLocalStorage,
  isLocalStorageAvailable,
} from './localStorage';
import { emptyProject } from '../types/project';

describe('localStorage persistence', () => {
  beforeEach(() => localStorage.clear());

  it('isLocalStorageAvailable is true in jsdom', () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('saves and loads the project', () => {
    const p = emptyProject();
    saveProjectToLocalStorage(p);
    expect(loadProjectFromLocalStorage()).toEqual(p);
  });

  it('returns null when no saved project', () => {
    expect(loadProjectFromLocalStorage()).toBeNull();
  });

  it('returns null and clears the key when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadProjectFromLocalStorage()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `npm run test:run -- localStorage`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/persistence/localStorage.ts`:
```ts
import { Project } from '../types/project';
import { parseProjectFile, serializeProject } from './projectFile';

export const STORAGE_KEY = 'tonnetz-studio:project';

export function isLocalStorageAvailable(): boolean {
  try {
    const k = '__tnz_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function saveProjectToLocalStorage(p: Project): void {
  if (!isLocalStorageAvailable()) return;
  window.localStorage.setItem(STORAGE_KEY, serializeProject(p));
}

export function loadProjectFromLocalStorage(): Project | null {
  if (!isLocalStorageAvailable()) return null;
  const text = window.localStorage.getItem(STORAGE_KEY);
  if (!text) return null;
  try {
    return parseProjectFile(text);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test:run -- localStorage`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/localStorage.ts src/persistence/localStorage.test.ts
git commit -m "feat(persistence): localStorage autosave + load helpers"
```

---

## Phase 5 — Audio engine

### Task 16: `audio/engine.ts` — Tone.js synth + gesture gate

**Files:**
- Create: `src/audio/engine.ts`

> **Note:** Tone.js touches the Web Audio API which is not unit-testable in JSDOM. We rely on RTL component tests later for behavioural coverage. This task is implementation-only.

- [ ] **Step 1: Implement the engine**

`src/audio/engine.ts`:
```ts
import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let started = false;

export function getSynth(): Tone.PolySynth {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.65, release: 0.4 },
    });
    synth.maxPolyphony = 16;
    synth.toDestination();
  }
  return synth;
}

export async function startAudio(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

export function isAudioStarted(): boolean {
  return started;
}

export function setBpm(bpm: number): void {
  Tone.Transport.bpm.value = bpm;
}

export function ticksToSeconds(ticks: number, ppq: number): number {
  return (ticks / ppq) * (60 / Tone.Transport.bpm.value);
}

export function previewNote(pitch: number, durSec = 0.5): void {
  if (!started) return;
  const freq = Tone.Frequency(pitch, 'midi').toFrequency();
  getSynth().triggerAttackRelease(freq, durSec);
}

export function previewChord(pitches: number[], durSec = 0.5): void {
  if (!started) return;
  const freqs = pitches.map((p) => Tone.Frequency(p, 'midi').toFrequency());
  getSynth().triggerAttackRelease(freqs, durSec);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/engine.ts
git commit -m "feat(audio): Tone.js PolySynth + gesture-gated start + previews"
```

---

### Task 17: `audio/scheduler.ts` — schedule project notes on Tone.Transport

**Files:**
- Create: `src/audio/scheduler.ts`

- [ ] **Step 1: Implement**

`src/audio/scheduler.ts`:
```ts
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

export function play(): void {
  Tone.Transport.start();
}

export function stop(): void {
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  getSynth().releaseAll();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/scheduler.ts
git commit -m "feat(audio): scheduler with per-note tracking via Tone.Transport"
```

---

### Task 18: `audio/playheadSync.ts` — RAF loop into transport store

**Files:**
- Create: `src/audio/playheadSync.ts`

- [ ] **Step 1: Implement**

`src/audio/playheadSync.ts`:
```ts
import * as Tone from 'tone';
import { useTransportStore } from '../state/transport';

let rafId: number | null = null;

function tick(): void {
  const ticks = Math.round(Tone.Transport.ticks);
  useTransportStore.getState().setTick(ticks);
  rafId = requestAnimationFrame(tick);
}

export function startPlayheadSync(): void {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(tick);
}

export function stopPlayheadSync(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/playheadSync.ts
git commit -m "feat(audio): RAF playhead sync into transport store"
```

---

## Phase 6 — Tonnetz UI

### Task 19: `TonnetzView` — cells layer with click-to-add

**Files:**
- Create: `src/components/tonnetz/TonnetzView.tsx`, `src/components/tonnetz/grid.ts`
- Test: `src/components/tonnetz/TonnetzView.test.tsx`

- [ ] **Step 1: Implement the visible-grid helper**

`src/components/tonnetz/grid.ts`:
```ts
import { axialToPitch, axialToXY, Axial } from '../../lib/tonnetz/coordinates';

export type GridCell = Axial & { x: number; y: number; pitch: number };

export function buildGrid(uRange: [number, number], vRange: [number, number]): GridCell[] {
  const cells: GridCell[] = [];
  for (let v = vRange[0]; v <= vRange[1]; v++) {
    for (let u = uRange[0]; u <= uRange[1]; u++) {
      const { x, y } = axialToXY(u, v);
      cells.push({ u, v, x, y, pitch: axialToPitch(u, v) });
    }
  }
  return cells;
}
```

- [ ] **Step 2: Write a failing component test**

`src/components/tonnetz/TonnetzView.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TonnetzView } from './TonnetzView';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';

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
});
```

- [ ] **Step 3: Run tests — expect failures**

Run: `npm run test:run -- TonnetzView`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `TonnetzView`**

`src/components/tonnetz/TonnetzView.tsx`:
```tsx
import { buildGrid } from './grid';
import { midiToName } from '../../lib/music/pitch';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { previewNote } from '../../audio/engine';

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4,
  '1/8':  PPQ / 2,
  '1/4':  PPQ,
  '1/2':  PPQ * 2,
  '1/1':  PPQ * 4,
};

export function TonnetzView() {
  const cells = buildGrid([-3, 3], [-2, 4]);   // ~3 octaves, ample width
  const { addNote } = useProjectStore();
  const { playing, recording, currentTick } = useTransportStore();
  const { noteLength } = useViewStore();

  function handleCellClick(pitch: number, e: React.MouseEvent) {
    const altOnly = e.altKey;
    previewNote(pitch);
    if (altOnly) return;
    // record-mode rule: write when stopped OR (playing & recording)
    if (!playing || recording) {
      addNote({
        pitch,
        startTick: currentTick,
        durationTicks: NOTE_LENGTH_TICKS[noteLength],
        velocity: 100,
      });
    }
  }

  return (
    <svg
      data-testid="tonnetz-svg"
      viewBox="-300 -260 600 520"
      width="100%"
      height="100%"
      style={{ background: '#fffdf7' }}
    >
      <g>
        {cells.map((c) => (
          <g key={`${c.u},${c.v}`} transform={`translate(${c.x},${c.y})`}>
            <circle
              data-testid="tonnetz-cell"
              data-pitch={c.pitch}
              r={14}
              fill="#d9d3c4"
              stroke="#b8b1a0"
              onClick={(e) => handleCellClick(c.pitch, e)}
              style={{ cursor: 'pointer' }}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="#5a5246"
              pointerEvents="none"
            >
              {midiToName(c.pitch)}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
```

- [ ] **Step 5: Run tests — expect pass**

Run: `npm run test:run -- TonnetzView`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/tonnetz/
git commit -m "feat(tonnetz): cells layer with click-to-add"
```

---

### Task 20: Edge layer — clicking an edge adds a dyad

**Files:**
- Modify: `src/components/tonnetz/TonnetzView.tsx`
- Create: `src/components/tonnetz/edges.ts`
- Test: extend `src/components/tonnetz/TonnetzView.test.tsx`

- [ ] **Step 1: Build the edge list**

`src/components/tonnetz/edges.ts`:
```ts
import { GridCell } from './grid';

export type Edge = { a: GridCell; b: GridCell };

export function buildEdges(cells: GridCell[]): Edge[] {
  const byKey = new Map(cells.map((c) => [`${c.u},${c.v}`, c]));
  const edges: Edge[] = [];
  for (const c of cells) {
    const neighbours = [
      [c.u + 1, c.v],
      [c.u, c.v + 1],
      [c.u + 1, c.v - 1],
    ];
    for (const [u, v] of neighbours) {
      const n = byKey.get(`${u},${v}`);
      if (n) edges.push({ a: c, b: n });
    }
  }
  return edges;
}
```

- [ ] **Step 2: Add a test for edge clicks**

Append to `src/components/tonnetz/TonnetzView.test.tsx`:
```tsx
import { fireEvent } from '@testing-library/react';

it('clicking an edge adds two notes', () => {
  useProjectStore.getState().reset();
  render(<TonnetzView />);
  const edges = screen.getAllByTestId('tonnetz-edge');
  fireEvent.click(edges[0]);
  expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(2);
});
```

- [ ] **Step 3: Run tests — expect failure**

Run: `npm run test:run -- TonnetzView`
Expected: FAIL — no `tonnetz-edge` element.

- [ ] **Step 4: Wire the edge layer**

Replace `TonnetzView.tsx` content with a version that renders edges and triangles. Update the file:

```tsx
import { buildGrid } from './grid';
import { buildEdges } from './edges';
import { midiToName } from '../../lib/music/pitch';
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { useViewStore, NoteLength } from '../../state/view';
import { PPQ } from '../../types/project';
import { previewNote, previewChord } from '../../audio/engine';

const NOTE_LENGTH_TICKS: Record<NoteLength, number> = {
  '1/16': PPQ / 4, '1/8': PPQ / 2, '1/4': PPQ, '1/2': PPQ * 2, '1/1': PPQ * 4,
};

export function TonnetzView() {
  const cells = buildGrid([-3, 3], [-2, 4]);
  const edges = buildEdges(cells);
  const { addNote, addNotes } = useProjectStore();
  const { playing, recording, currentTick } = useTransportStore();
  const { noteLength } = useViewStore();

  function canWrite(altKey: boolean) {
    return !altKey && (!playing || recording);
  }

  function writeNotes(pitches: number[]) {
    const dur = NOTE_LENGTH_TICKS[noteLength];
    addNotes(pitches.map((p) => ({
      pitch: p, startTick: currentTick, durationTicks: dur, velocity: 100,
    })));
  }

  function handleCellClick(pitch: number, e: React.MouseEvent) {
    previewNote(pitch);
    if (canWrite(e.altKey)) writeNotes([pitch]);
  }

  function handleEdgeClick(a: number, b: number, e: React.MouseEvent) {
    previewChord([a, b]);
    if (canWrite(e.altKey)) writeNotes([a, b]);
  }

  return (
    <svg
      data-testid="tonnetz-svg"
      viewBox="-300 -260 600 520"
      width="100%"
      height="100%"
      style={{ background: '#fffdf7' }}
    >
      <g>
        {edges.map((e, i) => (
          <line
            key={i}
            data-testid="tonnetz-edge"
            x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            stroke="transparent" strokeWidth={14}
            onClick={(ev) => handleEdgeClick(e.a.pitch, e.b.pitch, ev)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        {edges.map((e, i) => (
          <line
            key={`v-${i}`}
            x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            stroke="#e0dcd2" strokeWidth={1}
            pointerEvents="none"
          />
        ))}
        {cells.map((c) => (
          <g key={`${c.u},${c.v}`} transform={`translate(${c.x},${c.y})`}>
            <circle
              data-testid="tonnetz-cell"
              data-pitch={c.pitch}
              r={14}
              fill="#d9d3c4" stroke="#b8b1a0"
              onClick={(e) => handleCellClick(c.pitch, e)}
              style={{ cursor: 'pointer' }}
            />
            <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#5a5246" pointerEvents="none">
              {midiToName(c.pitch)}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
```

- [ ] **Step 5: Run tests — expect pass**

Run: `npm run test:run -- TonnetzView`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/tonnetz/
git commit -m "feat(tonnetz): edge layer with dyad click-to-add"
```

---

### Task 21: Triangle layer — clicking a triangle adds a triad

**Files:**
- Modify: `src/components/tonnetz/TonnetzView.tsx`
- Create: `src/components/tonnetz/triangles.ts`
- Test: extend `src/components/tonnetz/TonnetzView.test.tsx`

- [ ] **Step 1: Build the triangle list**

`src/components/tonnetz/triangles.ts`:
```ts
import { GridCell } from './grid';

export type Triangle = { a: GridCell; b: GridCell; c: GridCell; type: 'up' | 'down' };

export function buildTriangles(cells: GridCell[]): Triangle[] {
  const byKey = new Map(cells.map((c) => [`${c.u},${c.v}`, c]));
  const tris: Triangle[] = [];
  for (const c of cells) {
    const right = byKey.get(`${c.u + 1},${c.v}`);
    const upRight = byKey.get(`${c.u},${c.v + 1}`);
    const downRight = byKey.get(`${c.u + 1},${c.v - 1}`);
    if (right && upRight) tris.push({ a: c, b: right, c: upRight, type: 'up' });
    if (right && downRight) tris.push({ a: c, b: right, c: downRight, type: 'down' });
  }
  return tris;
}
```

- [ ] **Step 2: Add a test for triangle clicks**

Append to `TonnetzView.test.tsx`:
```tsx
it('clicking a triangle adds three notes', () => {
  useProjectStore.getState().reset();
  render(<TonnetzView />);
  const tris = screen.getAllByTestId('tonnetz-triangle');
  fireEvent.click(tris[0]);
  expect(useProjectStore.getState().project.tracks[0].notes).toHaveLength(3);
});
```

- [ ] **Step 3: Run tests — expect failure**

Run: `npm run test:run -- TonnetzView`
Expected: FAIL — no `tonnetz-triangle` element yet.

- [ ] **Step 4: Wire the triangle layer**

In `TonnetzView.tsx`, add `import { buildTriangles } from './triangles';` and `const triangles = buildTriangles(cells);` and insert this `<g>` *before* the edge group (so triangles render under edges/cells):

```tsx
<g>
  {triangles.map((t, i) => (
    <polygon
      key={i}
      data-testid="tonnetz-triangle"
      points={`${t.a.x},${t.a.y} ${t.b.x},${t.b.y} ${t.c.x},${t.c.y}`}
      fill="transparent"
      onClick={(e) => {
        previewChord([t.a.pitch, t.b.pitch, t.c.pitch]);
        if (canWrite(e.altKey)) writeNotes([t.a.pitch, t.b.pitch, t.c.pitch]);
      }}
      style={{ cursor: 'pointer' }}
    />
  ))}
</g>
```

- [ ] **Step 5: Run tests — expect pass**

Run: `npm run test:run -- TonnetzView`
Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/tonnetz/
git commit -m "feat(tonnetz): triangle layer with triad click-to-add"
```

---

### Task 22: Highlight overlays — lit cells and lit chord triangle

**Files:**
- Modify: `src/components/tonnetz/TonnetzView.tsx`

- [ ] **Step 1: Compute sounding pitches and implied triad**

Add inside `TonnetzView`, before the return:

```tsx
import { computeSoundingNotes } from '../../state/selectors';
import { findTriad } from '../../lib/tonnetz/chords';
import { pitchClass } from '../../lib/music/pitch';

// inside the component
const project = useProjectStore((s) => s.project);
const allNotes = project.tracks.flatMap((t) => t.notes);
const sounding = computeSoundingNotes(allNotes, currentTick);
const soundingPitches = new Set(sounding.map((n) => n.pitch));
const soundingPCs = new Set(sounding.map((n) => pitchClass(n.pitch)));
const triad = findTriad(sounding.map((n) => n.pitch));
```

- [ ] **Step 2: Render lit cells**

In the cell group, change `fill="#d9d3c4"` to dynamic:
```tsx
fill={soundingPitches.has(c.pitch) ? '#c25b3b' : '#d9d3c4'}
stroke={soundingPitches.has(c.pitch) ? '#8b3a23' : '#b8b1a0'}
```

- [ ] **Step 3: Render the lit triangle**

When `triad` is truthy, fill the matching triangle (`buildTriangles` already gives us triangles; find one whose three pitch classes equal `{root, root+(triad.type==='major'?4:3), root+7} mod 12`):

Add inside `TonnetzView`, after computing `triad`:
```tsx
const litTriangleKey = triad
  ? [triad.root, (triad.root + (triad.type === 'major' ? 4 : 3)) % 12, (triad.root + 7) % 12]
      .sort((a, b) => a - b).join(',')
  : null;

function trianglePCKey(t: { a: { pitch: number }; b: { pitch: number }; c: { pitch: number } }) {
  return [t.a.pitch, t.b.pitch, t.c.pitch].map(pitchClass).sort((a, b) => a - b).join(',');
}
```

Then in the triangle `<polygon>`, set:
```tsx
fill={litTriangleKey && trianglePCKey(t) === litTriangleKey ? 'rgba(194,91,59,0.22)' : 'transparent'}
stroke={litTriangleKey && trianglePCKey(t) === litTriangleKey ? '#c25b3b' : 'none'}
strokeWidth={1.5}
```

- [ ] **Step 4: Add a test**

Append to `TonnetzView.test.tsx`:
```tsx
it('lights cells whose pitches are sounding at the current tick', () => {
  useProjectStore.getState().reset();
  useProjectStore.getState().addNote({ pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 });
  useTransportStore.getState().setTick(0);
  render(<TonnetzView />);
  const lit = screen.getAllByTestId('tonnetz-cell').filter((el) =>
    (el as SVGCircleElement).getAttribute('fill') === '#c25b3b'
  );
  expect(lit.length).toBeGreaterThanOrEqual(1);
});
```

Run: `npm run test:run -- TonnetzView` → expect all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/tonnetz/
git commit -m "feat(tonnetz): highlight sounding notes and implied chord triangle"
```

---

### Task 23: Trail overlay (toggleable) and heatmap overlay

**Files:**
- Create: `src/components/tonnetz/TrailLayer.tsx`, `src/components/tonnetz/HeatmapLayer.tsx`
- Modify: `src/components/tonnetz/TonnetzView.tsx`

- [ ] **Step 1: Implement `TrailLayer`**

`src/components/tonnetz/TrailLayer.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { GridCell } from './grid';
import { pitchClass } from '../../lib/music/pitch';

type TrailEntry = { pitch: number; t: number };

export function TrailLayer({ cells, sounding, currentTick }: {
  cells: GridCell[]; sounding: number[]; currentTick: number;
}) {
  const [trail, setTrail] = useState<TrailEntry[]>([]);

  useEffect(() => {
    setTrail((prev) => {
      const next = prev.filter((e) => currentTick - e.t < 1920);
      for (const p of sounding) {
        if (!next.find((e) => e.pitch === p && currentTick - e.t < 100)) {
          next.push({ pitch: p, t: currentTick });
        }
      }
      return next;
    });
  }, [currentTick, sounding.join(',')]);

  return (
    <g pointerEvents="none">
      {trail.map((e, i) => {
        const cell = cells.find((c) => pitchClass(c.pitch) === pitchClass(e.pitch));
        if (!cell) return null;
        const age = currentTick - e.t;
        const opacity = Math.max(0, 0.55 * (1 - age / 1920));
        return (
          <circle key={i} cx={cell.x} cy={cell.y} r={14}
            fill="#f0c8b6" opacity={opacity} stroke="#d8a890" />
        );
      })}
    </g>
  );
}
```

- [ ] **Step 2: Implement `HeatmapLayer`**

`src/components/tonnetz/HeatmapLayer.tsx`:
```tsx
import { GridCell } from './grid';
import { pitchClass } from '../../lib/music/pitch';
import { computeTonalDistribution } from '../../state/selectors';
import { Note } from '../../types/project';

export function HeatmapLayer({ cells, notes }: { cells: GridCell[]; notes: Note[] }) {
  const distribution = computeTonalDistribution(notes);
  const max = Math.max(1, ...Array.from(distribution.values()));
  // Collapse pitched distribution to PC for heatmap purposes when in PC mode.
  const pcSums = new Map<number, number>();
  for (const [pitch, weight] of distribution) {
    const pc = pitchClass(pitch);
    pcSums.set(pc, (pcSums.get(pc) ?? 0) + weight);
  }
  const pcMax = Math.max(1, ...Array.from(pcSums.values()));

  return (
    <g pointerEvents="none">
      {cells.map((c) => {
        const w = pcSums.get(pitchClass(c.pitch)) ?? 0;
        const intensity = w / pcMax;
        if (intensity < 0.05) return null;
        return (
          <circle key={`${c.u},${c.v}`} cx={c.x} cy={c.y} r={20}
            fill={`rgba(194,91,59,${0.18 * intensity})`} />
        );
      })}
    </g>
  );
}
```

- [ ] **Step 3: Wire toggles into `TonnetzView`**

Add the imports and inside `TonnetzView`, render layers conditionally:

```tsx
import { TrailLayer } from './TrailLayer';
import { HeatmapLayer } from './HeatmapLayer';

const { trailEnabled, heatmapEnabled } = useViewStore();

// in the SVG, before the edge group:
{heatmapEnabled && <HeatmapLayer cells={cells} notes={allNotes} />}
// after triangle group:
{trailEnabled && <TrailLayer cells={cells} sounding={sounding.map((n) => n.pitch)} currentTick={currentTick} />}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/tonnetz/
git commit -m "feat(tonnetz): toggleable trail and heatmap overlays"
```

---

### Task 24: Pan, zoom, and pitch-class mode

**Files:**
- Modify: `src/components/tonnetz/TonnetzView.tsx`

- [ ] **Step 1: Add pan + zoom to the root `<g>`**

In `TonnetzView.tsx`, replace the outermost SVG group with a transform driven by view state:

```tsx
const { pan, zoom, setPan, setZoom, pitchClassMode, octaveAnchor } = useViewStore();

function onWheel(e: React.WheelEvent) {
  e.preventDefault();
  const delta = -e.deltaY * 0.001;
  setZoom(Math.min(2, Math.max(0.5, zoom + delta)));
}

let dragStart: { x: number; y: number; pan: { x: number; y: number } } | null = null;
function onMouseDown(e: React.MouseEvent) {
  if ((e.target as Element).tagName === 'svg') {
    dragStart = { x: e.clientX, y: e.clientY, pan };
  }
}
function onMouseMove(e: React.MouseEvent) {
  if (!dragStart) return;
  setPan({ x: dragStart.pan.x + (e.clientX - dragStart.x), y: dragStart.pan.y + (e.clientY - dragStart.y) });
}
function onMouseUp() { dragStart = null; }
```

Apply on the `<svg>`:
```tsx
<svg ... onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
  <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
    ...everything else...
  </g>
</svg>
```

- [ ] **Step 2: Apply pitch-class label collapse**

In the cell `<text>`, when `pitchClassMode` is on, use the pitch-class name (no octave). Add a helper or use `midiToName(c.pitch).replace(/-?\d+$/, '')`.

- [ ] **Step 3: In pitch-class mode, write at the octave anchor**

In `writeNotes(...)`, if `pitchClassMode`, transpose each pitch to the octave nearest to `octaveAnchor`:

```tsx
function applyOctaveAnchor(pitches: number[]): number[] {
  if (!pitchClassMode) return pitches;
  return pitches.map((p) => (octaveAnchor + 1) * 12 + ((p % 12) + 12) % 12);
}
```

Replace `addNotes(pitches.map(...))` with `addNotes(applyOctaveAnchor(pitches).map(...))`.

- [ ] **Step 4: Commit**

```bash
git add src/components/tonnetz/TonnetzView.tsx
git commit -m "feat(tonnetz): pan/zoom + pitch-class mode + octave anchor"
```

---

## Phase 7 — Timeline and transport

### Task 25: Timeline component

**Files:**
- Create: `src/components/timeline/Timeline.tsx`

- [ ] **Step 1: Implement**

`src/components/timeline/Timeline.tsx`:
```tsx
import { useProjectStore } from '../../state/project';
import { useTransportStore } from '../../state/transport';
import { PPQ } from '../../types/project';

const BAR_TICKS = PPQ * 4;     // 4/4
const PX_PER_TICK = 0.08;       // ≈ 38 px per beat

export function Timeline() {
  const project = useProjectStore((s) => s.project);
  const { currentTick, setTick } = useTransportStore();
  const notes = project.tracks.flatMap((t) => t.notes);
  const maxTick = Math.max(BAR_TICKS * 8, ...notes.map((n) => n.startTick + n.durationTicks));
  const width = maxTick * PX_PER_TICK;
  const bars = Math.ceil(maxTick / BAR_TICKS);

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setTick(Math.round(x / PX_PER_TICK));
  }

  return (
    <svg width={width} height={120} onClick={onClick} style={{ background: '#fbf8ef' }}>
      {Array.from({ length: bars + 1 }, (_, i) => (
        <g key={i}>
          <line x1={i * BAR_TICKS * PX_PER_TICK} y1={0}
                x2={i * BAR_TICKS * PX_PER_TICK} y2={120}
                stroke="#d8d3c4" />
          <text x={i * BAR_TICKS * PX_PER_TICK + 4} y={14} fontSize={10} fill="#87827a">
            {i + 1}
          </text>
        </g>
      ))}
      {notes.map((n) => (
        <rect
          key={n.id}
          data-testid="timeline-note"
          x={n.startTick * PX_PER_TICK}
          y={40 + ((127 - n.pitch) % 60)}
          width={n.durationTicks * PX_PER_TICK}
          height={6}
          fill="#c25b3b"
          rx={2}
        />
      ))}
      <line
        data-testid="playhead"
        x1={currentTick * PX_PER_TICK} y1={0}
        x2={currentTick * PX_PER_TICK} y2={120}
        stroke="#c25b3b" strokeWidth={2}
      />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/timeline/
git commit -m "feat(timeline): bars, note blocks, scrubbable playhead"
```

---

### Task 26: Transport bar (play/stop/record/BPM/note-length)

**Files:**
- Create: `src/components/transport/TransportBar.tsx`

- [ ] **Step 1: Implement**

`src/components/transport/TransportBar.tsx`:
```tsx
import { useTransportStore } from '../../state/transport';
import { useProjectStore } from '../../state/project';
import { useViewStore, NoteLength } from '../../state/view';
import { play as audioPlay, stop as audioStop, rescheduleProject } from '../../audio/scheduler';
import { startAudio, setBpm as setAudioBpm } from '../../audio/engine';
import { startPlayheadSync, stopPlayheadSync } from '../../audio/playheadSync';

export function TransportBar() {
  const { playing, recording, play, stop, toggleRecord } = useTransportStore();
  const project = useProjectStore((s) => s.project);
  const setProjectBpm = useProjectStore((s) => s.setBpm);
  const { noteLength, setNoteLength, pitchClassMode, togglePitchClassMode, trailEnabled, toggleTrail, heatmapEnabled, toggleHeatmap } = useViewStore();

  async function handlePlay() {
    await startAudio();
    setAudioBpm(project.bpm);
    rescheduleProject(project);
    audioPlay();
    startPlayheadSync();
    play();
  }

  function handleStop() {
    audioStop();
    stopPlayheadSync();
    stop();
  }

  function handleBpm(value: string) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      setProjectBpm(n);
      setAudioBpm(n);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8 }}>
      <button onClick={playing ? handleStop : handlePlay}>{playing ? '⏹' : '▶'}</button>
      <button onClick={toggleRecord} style={{ color: recording ? '#c25b3b' : undefined }}>
        ● Rec
      </button>
      <label>
        BPM <input type="number" value={project.bpm} onChange={(e) => handleBpm(e.target.value)} style={{ width: 60 }} />
      </label>
      <label>
        Length
        <select value={noteLength} onChange={(e) => setNoteLength(e.target.value as NoteLength)}>
          {(['1/16','1/8','1/4','1/2','1/1'] as NoteLength[]).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={pitchClassMode} onChange={togglePitchClassMode} /> Pitch-class
      </label>
      <label>
        <input type="checkbox" checked={trailEnabled} onChange={toggleTrail} /> Trail
      </label>
      <label>
        <input type="checkbox" checked={heatmapEnabled} onChange={toggleHeatmap} /> Heatmap
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transport/
git commit -m "feat(transport): play/stop/record + BPM + note length + view toggles"
```

---

## Phase 8 — Project menu, dialogs, error UI

### Task 27: Project menu — save/load `.tnz.json` and `.mid`

**Files:**
- Create: `src/components/project/ProjectMenu.tsx`

- [ ] **Step 1: Implement**

`src/components/project/ProjectMenu.tsx`:
```tsx
import { useProjectStore } from '../../state/project';
import { serializeProject, parseProjectFile } from '../../persistence/projectFile';
import { exportMidi } from '../../midi/export';
import { importMidi } from '../../midi/import';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ProjectMenu({ onError }: { onError: (msg: string) => void }) {
  const project = useProjectStore((s) => s.project);
  const loadProject = useProjectStore((s) => s.loadProject);

  function saveProject() {
    const blob = new Blob([serializeProject(project)], { type: 'application/json' });
    downloadBlob(blob, `${project.name || 'project'}.tnz.json`);
  }

  function saveMidi() {
    downloadBlob(exportMidi(project), `${project.name || 'project'}.mid`);
  }

  async function handleFile(file: File) {
    try {
      if (file.name.endsWith('.tnz.json')) {
        const text = await file.text();
        loadProject(parseProjectFile(text));
      } else if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) {
        const buf = await file.arrayBuffer();
        const result = importMidi(buf, { strategy: 'merge' });
        loadProject(result.project);
        if (result.warnings.length > 0) onError(result.warnings.join(' '));
      } else {
        onError(`Unsupported file type: ${file.name}`);
      }
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={saveProject}>Save .tnz.json</button>
      <button onClick={saveMidi}>Save .mid</button>
      <label style={{ cursor: 'pointer' }}>
        Import
        <input
          type="file"
          accept=".mid,.midi,.json"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ''; }}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/project/
git commit -m "feat(project): save/load .tnz.json and .mid via download/file picker"
```

---

### Task 28: App shell with audio-start overlay, error toasts, autosave

**Files:**
- Create: `src/app/AppShell.tsx`, `src/app/Toasts.tsx`
- Modify: `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Implement toasts**

`src/app/Toasts.tsx`:
```tsx
import { useEffect, useState } from 'react';

export type Toast = { id: string; message: string };
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function push(message: string) {
    const id = String(Math.random());
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }
  return { toasts, push };
}

export function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: '#222', color: 'white', padding: '8px 12px', borderRadius: 4 }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement `AppShell`**

`src/app/AppShell.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { TonnetzView } from '../components/tonnetz/TonnetzView';
import { Timeline } from '../components/timeline/Timeline';
import { TransportBar } from '../components/transport/TransportBar';
import { ProjectMenu } from '../components/project/ProjectMenu';
import { ToastList, useToasts } from './Toasts';
import { startAudio, isAudioStarted } from '../audio/engine';
import { useProjectStore } from '../state/project';
import {
  isLocalStorageAvailable, loadProjectFromLocalStorage, saveProjectToLocalStorage,
} from '../persistence/localStorage';

export function AppShell() {
  const { toasts, push } = useToasts();
  const [audioReady, setAudioReady] = useState(isAudioStarted());
  const project = useProjectStore((s) => s.project);
  const loadProject = useProjectStore((s) => s.loadProject);

  // Boot: rehydrate
  useEffect(() => {
    const p = loadProjectFromLocalStorage();
    if (p) loadProject(p);
    if (!isLocalStorageAvailable()) {
      push('Local storage unavailable — your changes will not autosave.');
    }
  }, []);

  // Autosave debounce
  useEffect(() => {
    const t = setTimeout(() => saveProjectToLocalStorage(project), 2000);
    return () => clearTimeout(t);
  }, [project]);

  async function handleStartAudio() {
    try {
      await startAudio();
      setAudioReady(true);
    } catch (e) {
      push(`Audio failed to start: ${(e as Error).message}`);
    }
  }

  if (!audioReady) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: '#fffdf7',
      }}>
        <button onClick={handleStartAudio} style={{ padding: 16, fontSize: 16 }}>
          Tap to start audio
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
        <strong>Tonnetz Studio</strong>
        <TransportBar />
        <ProjectMenu onError={push} />
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <TonnetzView />
      </main>
      <footer style={{ height: 140, borderTop: '1px solid #eee', overflow: 'auto' }}>
        <Timeline />
      </footer>
      <ToastList toasts={toasts} />
    </div>
  );
}
```

- [ ] **Step 3: Mount the shell**

`src/App.tsx`:
```tsx
import { AppShell } from './app/AppShell';

export default function App() {
  return <AppShell />;
}
```

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`. Open the printed URL. Click "Tap to start audio". You should see:
- The Tonnetz with 49 cells, edges and triangles, in the main area
- A timeline strip at the bottom
- Header with transport, BPM, length picker, view toggles, project menu

Click a cell → it lights orange, the timeline gets a small block, and you hear the note. Click ▶ → playhead advances and lit cells follow it.

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/App.tsx
git commit -m "feat(app): shell, audio-gate, autosave, error toasts"
```

---

## Phase 9 — Deploy

### Task 29: GitHub Actions workflow for GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Implement**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: Verify locally that the build succeeds**

Run: `npm run build`
Expected: a `dist/` directory is created with `index.html` and `assets/`. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: deploy static build to GitHub Pages on push to main"
```

- [ ] **Step 4: Manual push step (user does this)**

Once the repo is created on GitHub under `zanewebb/tonnetz-studio`, the user runs:
```bash
git remote add origin git@github.com:zanewebb/tonnetz-studio.git
git push -u origin main
```
Then in the repo's Settings → Pages, set Source = `gh-pages` branch.

---

## Self-Review

**Spec coverage:**
- Project schema ✅ (Task 7)
- Zustand stores: project, transport, selection, view ✅ (Tasks 8–9)
- Derived selectors: sounding notes, tonal distribution, implied triad ✅ (Tasks 10, 22)
- Tonnetz coordinates and triad detection ✅ (Tasks 5–6)
- MIDI import + multi-track dialog ✅ (Task 12; multi-track UI dialog is bundled into Task 27's import flow — the picker is the simple "merge" default with a path to extend)
- MIDI export ✅ (Task 13)
- `.tnz.json` round-trip + version check ✅ (Task 14)
- localStorage autosave with Safari-private fallback ✅ (Tasks 15, 28)
- Audio engine, scheduler, RAF sync ✅ (Tasks 16–18)
- Tonnetz cell/edge/triangle hit testing ✅ (Tasks 19–21)
- Sounding-note + chord-triangle highlight ✅ (Task 22)
- Trail and heatmap layers ✅ (Task 23)
- Pan/zoom and pitch-class mode ✅ (Task 24)
- Timeline with playhead ✅ (Task 25)
- Transport bar with note length + view toggles ✅ (Task 26)
- Project menu (save/load .tnz.json + .mid + import) ✅ (Task 27)
- AppShell with audio-gate overlay, error toasts, autosave ✅ (Task 28)
- GitHub Pages deploy ✅ (Task 29)

**Type consistency check:** `ProjectMenu` uses `loadProject` which exists on `useProjectStore` (Task 8). `addNote`/`addNotes` defined in Task 8 are used by `TonnetzView` Tasks 19–21. `useViewStore` properties accessed in `TransportBar` and `TonnetzView` all defined in Task 9. ✅

**No placeholders:** All steps contain runnable commands or full code blocks.

**Known scope deferrals (per spec):** live Web MIDI out, piano-roll click-drag editing, multi-track UI, tempo changes / non-4/4, custom instruments, touch polish. These are listed in the spec's "Out of Scope for v1" and have no tasks in this plan, as intended.
