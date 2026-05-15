import { useTransportStore } from '../state/transport';
import { useProjectStore } from '../state/project';
import { startAudio, setBpm as setAudioBpm } from './engine';
import { rescheduleProject, play as schedulerPlay, stop as schedulerStop, setPosition } from './scheduler';
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

export function stopPlayback(): void {
  schedulerStop();
  stopPlayheadSync();
  useTransportStore.getState().stop();
}

export async function togglePlayback(): Promise<void> {
  if (useTransportStore.getState().playing) stopPlayback();
  else await startPlayback();
}
