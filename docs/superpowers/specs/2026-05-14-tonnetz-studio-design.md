# Tonnetz Studio — Design Spec

**Date:** 2026-05-14
**Status:** v0.1 design, ready for implementation planning
**Repo target:** `zanewebb/tonnetz-studio` (GitHub Pages hosted)

## Summary

A static single-page web app that lets a user compose and analyze MIDI on an interactive Tonnetz lattice. The Tonnetz is the primary input surface: clicking a cell adds a note, clicking an edge adds two notes (a dyad), clicking a triangle adds a major or minor triad. During playback, the lattice highlights sounding notes and fills the implied chord triangle in real time. A compact timeline strip below shows the score in beats and bars, with a playhead the user can scrub.

The app is fully client-side and ships on GitHub Pages. There is no backend.

## Goals

- Make the Tonnetz a *first-class compositional surface*, not just an analysis view.
- Visually teach Neo-Riemannian relationships: triangles = triads, edges = dyads, neighbours = small voice-leading moves.
- Preserve musical work across sessions (autosave) and across machines (download/upload).
- Round-trip with standard MIDI files so the app interoperates with any DAW.

## Non-Goals (v1)

- Live Web MIDI output to a DAW. The implementation will leave room to add this later but it does not ship in v1.
- Piano-roll-style click-and-drag editing on the timeline. The timeline is read-only for v1; all input flows through the Tonnetz.
- Multi-track UI. The project data model supports multiple tracks (one is always present); the UI exposes only the first track in v1.
- Tempo changes or time signatures other than 4/4.
- Custom synth voices, instrument browser, mixer.
- Touch/mobile polish. The app should function on touch but is not optimized for it.

## User-Facing Workflows

1. **Compose from scratch.** Open the app, click cells/edges/triangles on the Tonnetz to drop notes at the timeline cursor, press play, hear it back, export `.mid`.
2. **Continue from a saved session.** Auto-restore the last project on load; or import a `.tnz.json` previously downloaded.
3. **Import an existing track and study it.** Load a `.mid` file. The lattice shows where the song lives, the heatmap shows the tonal centre of gravity, the playhead walks the song highlighting active notes and chord triangles.
4. **Toggle between pitched and pitch-class views.** Pitched is the composition default — each cell is a specific MIDI pitch. The pitch-class toggle collapses octaves to make the harmonic structure obvious for analysis.
5. **Toggle the fading trail.** When studying voice leading, recently-played notes leave a fading trail on the lattice.

## Architecture

### Stack

- **Vite + React + TypeScript** scaffold; static build deployed via GitHub Actions to the `gh-pages` branch.
- **Zustand** for global state. One store per concern; no Redux ceremony.
- **SVG** for the Tonnetz renderer. Declarative, easy hit-testing on circles, polygons, and lines. Pan/zoom via a CSS transform on the SVG root.
- **Tone.js** for synthesis and transport scheduling. `Tone.Transport` is the canonical audio clock; project ticks (PPQ=480) map to seconds via BPM.
- **`@tonejs/midi`** for `.mid` parse and write.

### Layout

```
┌─ Header: project name · transport (play/stop/record) · BPM · save/load ─┐
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                       TONNETZ  (≈70%)                                   │
│       — pan/zoom, click-to-add, hover preview, highlight overlays       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  TIMELINE  (≈30%) — bars/beats, note blocks, playhead, mini-heatmap     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Source layout

```
src/
  app/              AppShell, top-level layout
  components/
    tonnetz/        TonnetzView, Cell, Edge, ChordTriangle, TrailLayer, HeatmapLayer
    timeline/       Timeline, NoteBlock, Playhead, MiniHeatmap
    transport/      TransportBar, BpmInput, RecordToggle, NoteLengthPicker
    project/        ProjectMenu, ImportDialog, ExportDialog, MultiTrackPicker
  state/            project.ts, transport.ts, selection.ts, view.ts (Zustand stores)
  audio/            engine.ts (Tone.js setup), scheduler.ts, voices.ts
  midi/             import.ts, export.ts, normalize.ts
  lib/
    tonnetz/        coordinates.ts, chords.ts, voiceLeading.ts
    music/          pitch.ts, intervals.ts
  persistence/      localStorage.ts, projectFile.ts
  types/            project.ts, midi.ts
```

### Module boundaries

- `lib/tonnetz/*` and `lib/music/*` are pure math. No React, no audio, no DOM. They take pitches and return positions, chord identifications, or interval data.
- `audio/*` knows nothing about React; it consumes events from the transport store and writes audio.
- `midi/*` is pure data transformation: file bytes ↔ project notes.
- `components/*` are thin views over the stores. No business logic in components.

Each module can be loaded and tested in isolation.

## Data Model

### Project schema (the `.tnz.json` file)

```ts
type Project = {
  version: 1;
  name: string;
  bpm: number;
  timeSignature: [number, number];   // locked to [4, 4] in v1
  ppq: 480;                           // pulses-per-quarter
  tracks: Track[];                    // length 1 in v1; shape is multi-track-ready
};

type Track = {
  id: string;
  name: string;
  color: string;
  notes: Note[];
};

type Note = {
  id: string;
  pitch: number;          // MIDI note number, 0-127
  startTick: number;
  durationTicks: number;
  velocity: number;       // 0-127
};
```

`version: 1` is the schema discriminator. Future format changes bump the version; loaders refuse mismatched versions with a clear error.

### Zustand stores

| Store | Owns |
|---|---|
| `projectStore` | `Project` + mutation methods (`addNote`, `removeNote`, `setBpm`, `loadFromMidi`, `loadFromProjectFile`) and a 50-entry undo stack |
| `transportStore` | `playing`, `recording`, `currentTick`, `loopRange?`, play/stop methods |
| `selectionStore` | Selected cells, edges, triangles |
| `viewStore` | UI-only: pan, zoom, `pitchClassMode: boolean`, `trailEnabled: boolean`, `noteLength: NoteLength` |

### Derived state (selectors, no extra storage)

- `soundingNotes(now)` — `projectStore.notes ∩ {start ≤ currentTick < start + duration}`. Drives the cell highlight layer.
- `impliedTriad(soundingNotes)` — pure function in `lib/tonnetz/chords.ts`; returns `{type: 'major'|'minor', root: pitch}` if three sounding notes form a triad, else `null`. Drives the chord-triangle overlay.
- `tonalDistribution(notes)` — per-pitch time-weighted sum across all notes. Drives the heatmap layer.

## Tonnetz Math

### Coordinate convention

The canonical Tonnetz axes:

- `→` right by one cell = +7 semitones (perfect fifth)
- `↗` upper-right by one cell = +4 semitones (major third)
- `↘` lower-right by one cell = +3 semitones (minor third)

The identity `7 = 4 + 3` is exactly why every triangle on the lattice is a valid major or minor triad.

### Mapping pitches to positions

Axial coordinates `(u, v)`. `pitch = anchorMidi + 7·u + 4·v`. SVG position:

```
x = u · dx + v · dx / 2
y = -v · dy
```

with `dx = 60`, `dy = 52` (≈ 60 · sin 60°).

- **Pitched view**: `(u, v) → MIDI pitch` is one-to-one within a finite visible window. Default viewport = three octaves centred on middle C (MIDI 60). Pan and zoom via a CSS transform on the SVG root.
- **Pitch-class view**: `pitchClass = pitch mod 12`. The lattice tiles forever; many cells share the same label. Clicks in PC mode add notes at the octave indicated by a small "octave anchor" picker.

### Triad detection

`findTriad(pitchClasses: number[]): {type: 'major'|'minor', root: number} | null`. A set `{p, p+4, p+7}` is major; `{p, p+3, p+7}` is minor. Anything else returns `null`.

### Hit testing (three click modes)

- **Cell** — click on a circle → one `Note` at the cell's pitch.
- **Edge** — click on a line segment → two `Note` records (one per endpoint pitch), both sharing the same `startTick` and `durationTicks`.
- **Triangle** — click inside a polygon but not on a circle or edge → three `Note` records (one per vertex pitch), all sharing the same `startTick` and `durationTicks`. The detected chord name renders as a small floating tag near the cursor.

Edges are rendered with a transparent wider stroke under the visible thinner one so the hit zone is forgiving.

### Render layers (back → front)

1. Edge layer (faint grey)
2. Triangle hit zones (transparent polygons)
3. Lit-triangle overlay (chord highlight from `impliedTriad`)
4. Trail overlay (when `viewStore.trailEnabled`)
5. Heatmap overlay (tonal distribution, when in analysis mode)
6. Cells (circles + pitch labels)
7. Lit-cell overlay (sounding notes)
8. Selection overlay (current user selection)

Each layer is a small React component reading derived selectors. SVG node count is bounded by the viewport (≈ 50–100 cells visible) so re-render cost is low.

### Click-to-add behaviour

- A click adds a note at the timeline cursor's current tick, with duration from a "note length" dropdown in the transport bar (default 1/4; choices 1/16, 1/8, 1/4, 1/2, 1/1).
- Shift+click extends the selection. Cmd/Ctrl+click toggles individual cells.
- Drag in empty area = pan. Wheel = zoom. Drag-on-cell is reserved for future piano-roll-style edits and does nothing in v1.

## Audio, Transport, Playhead

### Time model

Project ticks (PPQ=480) are canonical. Seconds derive from BPM via `Tone.Transport`. `transportStore.bpm` is mirrored to `Tone.Transport.bpm.value` on change.

### Synth (`audio/engine.ts`)

A single global `Tone.PolySynth(Tone.Synth, …)` wired to `Tone.Destination`. Oscillator type `sawtooth`; envelope `{attack: 0.02, decay: 0.15, sustain: 0.65, release: 0.4}`. Polyphony capped at 16 voices to guard against runaway voice allocation.

Web Audio's user-gesture requirement is satisfied by a one-time "Start audio" overlay on the first interaction, which calls `Tone.start()`.

### Scheduling (`audio/scheduler.ts`)

- **Play**: clear all scheduled events; walk the project notes; schedule each via `Tone.Transport.schedule(time => synth.triggerAttackRelease(pitch, durSec, time, vel/127), tickToSec(startTick))`. Store the returned event-id on the note for later cancellation.
- **Edit during playback**: `addNote` schedules just that note if its start tick is in the future; `removeNote` cancels its event-id. `setBpm` is automatic because seconds derive from BPM.
- **Stop**: `Tone.Transport.stop()` + `synth.releaseAll()` + clear scheduled events.

### Playhead UI sync

A single `requestAnimationFrame` loop reads `Tone.Transport.ticks` into `transportStore.currentTick`. The Tonnetz highlight layer reads `currentTick` via a memoized selector that only re-renders when the *set* of sounding pitches actually changes (not every frame). The timeline's playhead reads raw `currentTick` for smooth motion.

### Click-preview (audition)

Clicking any cell/edge/triangle plays the resulting pitches for a short preview duration (0.5s) regardless of transport state. The `Alt` modifier means *preview only* — don't write the notes to the project. Without `Alt`, the click both previews and writes (subject to the record-mode rules below).

### Record mode

A "Record" toggle in the transport bar controls whether clicks write notes during playback. When stopped, clicks always write at the cursor.

| Transport | Record toggle | Click behaviour |
|---|---|---|
| Stopped | (ignored) | Preview + write at the timeline cursor |
| Playing | Off | Preview only (no write) |
| Playing | On | Preview + write at `currentTick`, snapped to the grid (default 1/16) |

In all rows, `Alt+click` overrides to preview-only.

## MIDI I/O

### Import (`midi/import.ts`)

- Parse `.mid` with `@tonejs/midi`. Convert events to `Note` records.
- Normalize external PPQ to internal 480 by ratio.
- **Multi-track inputs**: a dialog appears — "This MIDI has N tracks. Pick one or merge all." The selection collapses to a single track in v1.
- **Tempo changes**: keep the first tempo, show a toast: "Tempo changes were flattened to {bpm} BPM."
- **Time signature**: same treatment — load the notes, force 4/4 display, toast if it differed.
- Viewport auto-fits on import so any notes outside the default 3-octave window are visible.

### Export (`midi/export.ts`)

Build a `@tonejs/midi` `Midi` instance, single track, write all notes, set tempo and PPQ, encode to `Blob`, trigger download via a transient `<a download>`.

## Persistence

- `.tnz.json` files = `JSON.stringify(project, null, 2)`. The `version` field is the schema discriminator.
- **Autosave**: write the working project to `localStorage["tonnetz-studio:project"]`, debounced 2s after the last edit.
- **Boot**: rehydrate from localStorage if present, otherwise start with an empty project.
- **"Save Project"** menu button downloads `.tnz.json`.
- **"Save MIDI"** menu button exports `.mid`.
- **"Import"** opens a file picker that accepts both `.tnz.json` and `.mid`; extension determines the loader.

## Error Handling

Validate only at boundaries. Internal code trusts internal code.

- **File parse failures** (`.mid` or `.tnz.json`) → non-blocking toast with the error text; project state untouched.
- **`localStorage` unavailable** (e.g. Safari private mode) → app works normally, autosave is silently disabled, a dismissible banner explains the situation once.
- **`AudioContext` init failure** → blocking overlay with a "Tap to start audio" retry. The only blocking error in the app.
- **Schema mismatch on import** → reject with "This file was saved with a different version of Tonnetz Studio (vN). v1 expected."

## Testing

- **Vitest unit tests**: `lib/tonnetz/coordinates.ts`, `lib/tonnetz/chords.ts`, `lib/music/*`, `midi/import.ts`, `midi/export.ts`, every Zustand mutation. Pure functions, fast, deterministic. This is where the bulk of coverage lives.
- **React Testing Library**: Tonnetz click resolution (cell vs edge vs triangle), timeline note placement, transport state transitions, playhead-highlight sync.
- **Playwright integration (deferred, post-v1)**: load a fixture `.mid`, press play, assert the playhead and lit cells. Useful but not blocking the v1 ship.

## Deployment

- Vite `build` produces a fully static `dist/`.
- GitHub Actions workflow on push to `main`: `npm ci` → `npm run build` → publish `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`.
- `vite.config.ts` sets `base: '/tonnetz-studio/'` so asset paths resolve under the repo's GH Pages URL.

## Open follow-ups (post-v1, not blocking)

- **Live Web MIDI output** to a DAW (the "B" workflow we discussed and deferred).
- **Piano-roll editing** on the timeline as a secondary input method.
- **Multi-track** UI on top of the existing data model.
- **Tempo changes and non-4/4** time signatures.
- **Custom synth voices** / instrument browser.
- **Mobile/touch polish.**
