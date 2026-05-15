import { useProjectStore } from '../../state/project';
import { serializeProject, parseProjectFile } from '../../persistence/projectFile';
import { exportMidi } from '../../midi/export';
import { importMidi } from '../../midi/import';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ProjectMenu({ onError }: { onError: (msg: string) => void }) {
  const project = useProjectStore((s) => s.project);
  const loadProject = useProjectStore((s) => s.loadProject);

  function saveProject() {
    const blob = new Blob([serializeProject(project)], { type: 'application/json' });
    downloadBlob(blob, `${project.name || 'project'}.tnz.json`);
  }

  function saveMidi() {
    downloadBlob(exportMidi(project), `${project.name || 'project'}.mid`);
  }

  async function handleFile(file: File) {
    try {
      if (file.name.endsWith('.tnz.json')) {
        const text = await file.text();
        loadProject(parseProjectFile(text));
      } else if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) {
        const buf = await file.arrayBuffer();
        const result = importMidi(buf, { strategy: 'merge' });
        loadProject(result.project);
        if (result.warnings.length > 0) onError(result.warnings.join(' '));
      } else {
        onError(`Unsupported file type: ${file.name}`);
      }
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={saveProject}>Save .tnz.json</button>
      <button onClick={saveMidi}>Save .mid</button>
      <label style={{ cursor: 'pointer' }}>
        Import
        <input
          type="file"
          accept=".mid,.midi,.json"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ''; }}
        />
      </label>
    </div>
  );
}
