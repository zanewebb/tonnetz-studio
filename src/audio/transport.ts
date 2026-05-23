import { useTransportStore } from '../state/transport';
import { useProjectStore } from '../state/project';
import { startAudio, setBpm as setAudioBpm } from './engine';
import { rescheduleProject, play as schedulerPlay, stop as schedulerStop, pause as schedulerPause, setPosition } from './scheduler';
import { startPlayheadSync, stopPlayheadSync } from './playheadSync';

export async function startPlayback(): Promise<void> {
  const { project } = useProjectStore.getState();
  const { currentTick } = useTransportStore.getState();
  await startAudio();
  setAudioBpm(project.bpm);
  rescheduleProject(project);
  setPosition(currentTick);
  schedulerPlay();
  startPlayheadSync();
  useTransportStore.getState().play();
}

export function pausePlayback(): void {
  schedulerPause();
  stopPlayheadSync();
  useTransportStore.getState().stop();   // sets playing:false but keeps currentTick
}

export function stopPlayback(): void {
  // "Stop" = back to start. Cancels all scheduled events and rewinds to tick 0.
  schedulerStop();
  stopPlayheadSync();
  useTransportStore.getState().setTick(0);
  useTransportStore.getState().stop();
}

export async function togglePlayback(): Promise<void> {
  if (useTransportStore.getState().playing) pausePlayback();
  else await startPlayback();
}
