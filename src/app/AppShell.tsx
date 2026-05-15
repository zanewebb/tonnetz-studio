import { useEffect, useState } from 'react';
import { TonnetzView } from '../components/tonnetz/TonnetzView';
import { Timeline } from '../components/timeline/Timeline';
import { TransportBar } from '../components/transport/TransportBar';
import { ProjectMenu } from '../components/project/ProjectMenu';
import { ToastList, useToasts } from './Toasts';
import { startAudio, isAudioStarted } from '../audio/engine';
import { useProjectStore } from '../state/project';
import { useSelectionStore } from '../state/selection';
import {
  isLocalStorageAvailable, loadProjectFromLocalStorage, saveProjectToLocalStorage,
} from '../persistence/localStorage';
import { togglePlayback } from '../audio/transport';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave debounce
  useEffect(() => {
    const t = setTimeout(() => saveProjectToLocalStorage(project), 2000);
    return () => clearTimeout(t);
  }, [project]);

  // Global spacebar play/pause
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      // Don't hijack space inside text inputs / number inputs
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      togglePlayback();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Global Delete/Backspace/Escape for note selection
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const ids = Array.from(useSelectionStore.getState().selectedNoteIds);
        if (ids.length === 0) return;
        e.preventDefault();
        useProjectStore.getState().removeNotes(ids);
        useSelectionStore.getState().clearNoteSelection();
      } else if (e.code === 'Escape') {
        useSelectionStore.getState().clearNoteSelection();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
