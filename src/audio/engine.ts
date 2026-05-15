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
