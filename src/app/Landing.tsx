import { useEffect, useState } from 'react';

const CHORDS = [
  { name: 'C major', vertices: [0, 1, 2] },
  { name: 'A minor', vertices: [0, 2, 3] },
  { name: 'F major', vertices: [4, 0, 2] },
  { name: 'G major', vertices: [1, 5, 6] },
];

const CELLS = [
  { id: 0, x: 60,  y: 84, label: 'C' },
  { id: 1, x: 120, y: 84, label: 'G' },
  { id: 2, x: 90,  y: 36, label: 'E' },
  { id: 3, x: 30,  y: 36, label: 'A' },
  { id: 4, x: 0,   y: 84, label: 'F' },
  { id: 5, x: 180, y: 84, label: 'D' },
  { id: 6, x: 150, y: 36, label: 'B' },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 2], [0, 3], [2, 3],
  [0, 4], [4, 2], [1, 5], [1, 6], [5, 6], [2, 6],
];

type Props = { onEnter: () => void };

export function Landing({ onEnter }: Props) {
  const [chordIdx, setChordIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setChordIdx((i) => (i + 1) % CHORDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const litTriangle = new Set(CHORDS[chordIdx].vertices);

  const pts = CHORDS[chordIdx].vertices
    .map((id) => CELLS.find((c) => c.id === id)!)
    .map((c) => `${c.x},${c.y}`)
    .join(' ');

  return (
    <div className={`landing-root ${mounted ? 'landing-mounted' : ''}`}>
      <div className="landing-card">
        <svg className="landing-tonnetz" viewBox="-20 0 220 120" width="220" height="120">
          {EDGES.map(([a, b], i) => {
            const A = CELLS[a], B = CELLS[b];
            return (
              <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                stroke="#d9d3c4" strokeWidth={1} />
            );
          })}
          <polygon
            points={pts}
            fill="rgba(194,91,59,0.22)"
            stroke="#c25b3b"
            strokeWidth={1.5}
            className="landing-triangle"
          />
          {CELLS.map((c) => (
            <g key={c.id}>
              <circle
                cx={c.x} cy={c.y} r={11}
                fill={litTriangle.has(c.id) ? '#c25b3b' : '#e8e3d3'}
                stroke={litTriangle.has(c.id) ? '#8b3a23' : '#bcb7a8'}
                strokeWidth={1}
                className="landing-cell"
              />
              <text x={c.x} y={c.y + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={9}
                fill={litTriangle.has(c.id) ? '#fff' : '#5a5246'}
                style={{ fontWeight: 600 }}>
                {c.label}
              </text>
            </g>
          ))}
        </svg>

        <h1 className="landing-title">Tonnetz Studio</h1>
        <p className="landing-subtitle">An interactive harmonic lattice</p>
        <p className="landing-chord" key={chordIdx}>{CHORDS[chordIdx].name}</p>

        <button className="landing-enter" onClick={onEnter}>
          <span aria-hidden>▶</span> Enter
        </button>
        <p className="landing-hint">Click to enable audio</p>
      </div>
    </div>
  );
}
