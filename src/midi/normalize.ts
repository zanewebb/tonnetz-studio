export function rescaleTicks(ticks: number, sourcePPQ: number, targetPPQ: number): number {
  if (sourcePPQ === targetPPQ) return ticks;
  return Math.round((ticks * targetPPQ) / sourcePPQ);
}
