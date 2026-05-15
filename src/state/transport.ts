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
  stop: () => set({ playing: false }),
  toggleRecord: () => set((s) => ({ recording: !s.recording })),
  setTick: (currentTick) => set({ currentTick }),
  reset: () => set({ playing: false, recording: false, currentTick: 0 }),
}));
