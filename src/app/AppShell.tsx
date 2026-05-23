import { useEffect, useRef, useState } from 'react';
import { Landing } from './Landing';
import { TonnetzView } from '../components/tonnetz/TonnetzView';
import { Timeline } from '../components/timeline/Timeline';
import { TimelineToolbar } from '../components/timeline/TimelineToolbar';
import { useTimelineZoom } from '../components/timeline/useTimelineZoom';
import { TransportBar } from '../components/transport/TransportBar';
import { ProjectMenu } from '../components/project/ProjectMenu';
import { DemoMenu } from '../components/project/DemoMenu';
import { ViewMenu } from '../components/view/ViewMenu';
import { ToastList, useToasts } from './Toasts';
import * as Tone from 'tone';
import { startAudio, isAudioStarted } from '../audio/engine';
import { togglePlayback } from '../audio/transport';
import { panic } from '../audio/scheduler';
import { useProjectStore } from '../state/project';
import { useSelectionStore } from '../state/selection';
import { useViewStore } from '../state/view';
import {
  isLocalStorageAvailable, loadProjectFromLocalStorage, saveProjectToLocalStorage,
} from '../persistence/localStorage';

export function AppShell() {
  const { toasts, push } = useToasts();
  const [audioReady, setAudioReady] = useState(isAudioStarted());
  const project = useProjectStore((s) => s.project);
  const loadProject = useProjectStore((s) => s.loadProject);
  const timelineHeight = useViewStore((s) => s.timelineHeight);
  const setTimelineHeight = useViewStore((s) => s.setTimelineHeight);
  const dividerDrag = useRef<{ startY: number; startHeight: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { zoomBy, resetZoom } = useTimelineZoom(scrollRef);

  useEffect(() => {
    const p = loadProjectFromLocalStorage();
    if (p) loadProject(p);
    if (!isLocalStorageAvailable()) {
      push('Local storage unavailable — your changes will not autosave.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveProjectToLocalStorage(project), 2000);
    return () => clearTimeout(t);
  }, [project]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      togglePlayback();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function cleanup() {
      try {
        panic();
        // Suspend the underlying AudioContext so the OS releases the audio session
        const ctx = Tone.getContext().rawContext as AudioContext;
        void ctx.suspend?.();
      } catch {
        // best-effort; we're tearing down
      }
    }
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
    };
  }, []);

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

  // Divider drag
  useEffect(() => {
    function onMove(ev: MouseEvent) {
      if (!dividerDrag.current) return;
      const dy = ev.clientY - dividerDrag.current.startY;
      // Dragging down enlarges Tonnetz / shrinks timeline; dragging up does the opposite
      setTimelineHeight(dividerDrag.current.startHeight - dy);
    }
    function onUp() { dividerDrag.current = null; document.body.style.cursor = ''; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setTimelineHeight]);

  function onDividerMouseDown(e: React.MouseEvent) {
    dividerDrag.current = { startY: e.clientY, startHeight: timelineHeight };
    document.body.style.cursor = 'row-resize';
  }

  async function handleStartAudio() {
    try {
      await startAudio();
      setAudioReady(true);
    } catch (e) {
      push(`Audio failed to start: ${(e as Error).message}`);
    }
  }

  if (!audioReady) {
    return <Landing onEnter={handleStartAudio} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className="app-header">
        <div className="header-group">
          <span className="app-title">Tonnetz Studio</span>
        </div>
        <div className="header-group">
          <TransportBar />
        </div>
        <div className="header-group">
          <ViewMenu />
          <DemoMenu onError={push} onLoaded={(note) => push(`Loaded: ${note}`)} />
          <ProjectMenu onError={push} />
        </div>
      </header>
      <main style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <TonnetzView />
      </main>
      <div onMouseDown={onDividerMouseDown} className="divider" title="Drag to resize" />
      <TimelineToolbar zoomBy={zoomBy} resetZoom={resetZoom} />
      <footer ref={scrollRef} style={{ height: timelineHeight, overflow: 'auto', background: '#fbf8ef' }}>
        <Timeline scrollRef={scrollRef} zoomBy={zoomBy} />
      </footer>
      <ToastList toasts={toasts} />
    </div>
  );
}
