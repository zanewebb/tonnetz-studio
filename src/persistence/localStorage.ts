import { Project } from '../types/project';
import { parseProjectFile, serializeProject } from './projectFile';

export const STORAGE_KEY = 'tonnetz-studio:project';

export function isLocalStorageAvailable(): boolean {
  try {
    const k = '__tnz_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function saveProjectToLocalStorage(p: Project): void {
  if (!isLocalStorageAvailable()) return;
  window.localStorage.setItem(STORAGE_KEY, serializeProject(p));
}

export function loadProjectFromLocalStorage(): Project | null {
  if (!isLocalStorageAvailable()) return null;
  const text = window.localStorage.getItem(STORAGE_KEY);
  if (!text) return null;
  try {
    return parseProjectFile(text);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
