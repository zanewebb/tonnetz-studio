export const ANCHOR_MIDI = 60;   // middle C
export const DX = 60;
export const DY = 52;            // ≈ DX * sin(60°)

export type Axial = { u: number; v: number };

export function axialToPitch(u: number, v: number): number {
  return ANCHOR_MIDI + 7 * u + 4 * v;
}

export function axialToXY(u: number, v: number): { x: number; y: number } {
  return { x: u * DX + v * (DX / 2), y: v === 0 ? 0 : -v * DY };
}

export function pitchToAxial(pitch: number): Axial | null {
  const delta = pitch - ANCHOR_MIDI;
  if (delta % 7 === 0) return { u: delta / 7, v: 0 };
  for (const v of [1, -1, 2, -2, 3, -3]) {
    const rem = delta - 4 * v;
    if (rem % 7 === 0) return { u: rem / 7, v };
  }
  return null;
}

export function neighbours(u: number, v: number): Axial[] {
  return [
    { u: u + 1, v },
    { u: u - 1, v },
    { u, v: v + 1 },
    { u, v: v - 1 },
    { u: u + 1, v: v - 1 },
    { u: u - 1, v: v + 1 },
  ];
}
