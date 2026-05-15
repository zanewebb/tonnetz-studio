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
