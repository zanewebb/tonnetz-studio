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
