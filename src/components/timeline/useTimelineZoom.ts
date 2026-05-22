import { useLayoutEffect, useRef, RefObject } from 'react';
import { useViewStore } from '../../state/view';
import { useTransportStore } from '../../state/transport';

const BASE_PX_PER_TICK = 0.08;

export function useTimelineZoom(scrollRef: RefObject<HTMLDivElement | null>) {
  const timelineZoom = useViewStore((s) => s.timelineZoom);
  const setTimelineZoom = useViewStore((s) => s.setTimelineZoom);
  const pendingAnchor = useRef<{ tick: number; screenX: number } | null>(null);

  useLayoutEffect(() => {
    if (!pendingAnchor.current || !scrollRef.current) return;
    const { tick, screenX } = pendingAnchor.current;
    pendingAnchor.current = null;
    const newPx = BASE_PX_PER_TICK * timelineZoom;
    const newScrollLeft = tick * newPx - screenX;
    scrollRef.current.scrollLeft = Math.max(0, newScrollLeft);
  }, [timelineZoom, scrollRef]);

  function captureAnchor(anchorMouseClientX?: number): { tick: number; screenX: number } | null {
    const el = scrollRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const oldPx = BASE_PX_PER_TICK * useViewStore.getState().timelineZoom;
    const scrollLeft = el.scrollLeft;
    if (anchorMouseClientX !== undefined) {
      const screenX = Math.max(0, Math.min(rect.width, anchorMouseClientX - rect.left));
      const tick = (scrollLeft + screenX) / oldPx;
      return { tick, screenX };
    }
    // Playhead anchor (fallback: visible center)
    const currentTick = useTransportStore.getState().currentTick;
    let screenX = currentTick * oldPx - scrollLeft;
    if (screenX < 0 || screenX > rect.width) screenX = rect.width / 2;
    return { tick: currentTick, screenX };
  }

  function zoomBy(factor: number, anchorMouseClientX?: number) {
    const anchor = captureAnchor(anchorMouseClientX);
    if (anchor) pendingAnchor.current = anchor;
    setTimelineZoom(timelineZoom * factor);
  }

  function resetZoom() {
    const anchor = captureAnchor();
    if (anchor) pendingAnchor.current = anchor;
    setTimelineZoom(1);
  }

  return { zoomBy, resetZoom };
}
