import { useEffect, useState } from 'react';
import { useProjectStore } from '../../state/project';
import { importMidi } from '../../midi/import';
import { fetchMidiArrayBuffer, FetchMode } from '../../midi/fetchMidi';
import { stopPlayback } from '../../audio/transport';

type Demo = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  fetchMode: FetchMode;
  note: string;
};

export function DemoMenu({ onError, onLoaded }: { onError: (msg: string) => void; onLoaded?: (note: string) => void }) {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const loadProject = useProjectStore((s) => s.loadProject);

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/';
    fetch(`${base}demos/demos.json`)
      .then((r) => r.json())
      .then((data) => setDemos(data.demos))
      .catch((e) => onError(`Could not load demos: ${(e as Error).message}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFromUrl(url: string, mode: FetchMode, note?: string) {
    setBusy(true);
    try {
      const buf = await fetchMidiArrayBuffer(url, mode);
      const result = importMidi(buf, { strategy: 'merge' });
      stopPlayback();
      loadProject(result.project);
      if (result.warnings.length > 0) onError(result.warnings.join(' '));
      if (note && onLoaded) onLoaded(note);
    } catch (e) {
      onError(`Could not load MIDI: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function onPickDemo(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const d = demos.find((x) => x.id === id);
    if (!d) return;
    loadFromUrl(d.url, d.fetchMode, d.note);
    e.currentTarget.value = '';
  }

  function onPasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;
    loadFromUrl(url, 'direct');
    setUrlInput('');
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ fontSize: 12, color: '#5a5246' }}>
        Demos{' '}
        <select onChange={onPickDemo} disabled={busy || demos.length === 0} defaultValue="">
          <option value="">{busy ? 'Loading…' : 'Pick a demo…'}</option>
          {demos.map((d) => (
            <option key={d.id} value={d.id}>{d.title} ({d.subtitle})</option>
          ))}
        </select>
      </label>
      <form onSubmit={onPasteSubmit} style={{ display: 'flex', gap: 4 }}>
        <input
          type="url"
          placeholder="Paste MIDI URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          style={{ width: 200, fontSize: 12 }}
          disabled={busy}
        />
        <button type="submit" disabled={busy || urlInput.trim().length === 0}>
          Load
        </button>
      </form>
    </div>
  );
}
