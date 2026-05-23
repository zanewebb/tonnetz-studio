import { useEffect } from 'react';

type Props = { open: boolean; onClose: () => void };

export function AboutModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="about-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="about-card" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="about-title">About the Tonnetz</h2>

        <section className="about-section">
          <h3>What it is</h3>
          <p>
            The <em>Tonnetz</em> (German for "tone network") is a 19th-century geometric
            map of musical pitches. Every cell is a note. Moving <strong>right</strong> goes
            up a perfect fifth. Moving <strong>up-right</strong> goes up a major third.
            Moving <strong>down-right</strong> goes up a minor third. Because <code>7 = 4 + 3</code>,
            every triangle on the lattice is exactly one major or minor triad.
          </p>
        </section>

        <section className="about-section">
          <h3>How to use it here</h3>
          <ul>
            <li><strong>Click a cell</strong> → adds (and plays) a single note.</li>
            <li><strong>Click an edge</strong> → adds two notes (a dyad).</li>
            <li><strong>Click a triangle</strong> → adds three notes (a major or minor triad).</li>
            <li>During playback the lattice <strong>highlights</strong> the notes currently sounding and fills any chord triangle they form. Watch how a song moves through harmonic space in real time.</li>
            <li>Drag notes on the timeline below to move them; drag their edges to resize. Snap, zoom, and chord-memory settings live in the toolbar.</li>
          </ul>
        </section>

        <section className="about-section">
          <h3>Visualization modes</h3>
          <ul>
            <li><strong>Pitch-class</strong> collapses octaves so the harmonic structure is the same anywhere on the lattice.</li>
            <li><strong>Trail</strong> shows the path your music has taken through the lattice over the last bar — useful for spotting voice leading.</li>
            <li><strong>Heatmap</strong> colors cells, edges, and triangles by how often each note, interval, and chord appears in the song. Switch to logarithmic scale if rare-but-important tones get washed out.</li>
            <li><strong>Chord memory</strong> lets the chord detector look back a beat or two — so an arpeggio across a beat still registers as a triad.</li>
          </ul>
        </section>

        <section className="about-section about-footer">
          <p>
            Load a demo, paste a MIDI URL, or import your own <code>.mid</code> file to
            see your music live on the lattice.
          </p>
        </section>
      </div>
    </div>
  );
}
