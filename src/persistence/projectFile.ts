import { Project } from '../types/project';

export function serializeProject(p: Project): string {
  return JSON.stringify(p, null, 2);
}

export function parseProjectFile(text: string): Project {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) {
    throw new Error(`Could not parse project file: ${(e as Error).message}`);
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Project file is not an object.');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error(
      `This file was saved with a different version of Tonnetz Studio (v${obj.version}). v1 expected.`
    );
  }
  return obj as unknown as Project;
}
