import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY, saveProjectToLocalStorage, loadProjectFromLocalStorage,
  isLocalStorageAvailable,
} from './localStorage';
import { emptyProject } from '../types/project';

describe('localStorage persistence', () => {
  beforeEach(() => localStorage.clear());

  it('isLocalStorageAvailable is true in jsdom', () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('saves and loads the project', () => {
    const p = emptyProject();
    saveProjectToLocalStorage(p);
    expect(loadProjectFromLocalStorage()).toEqual(p);
  });

  it('returns null when no saved project', () => {
    expect(loadProjectFromLocalStorage()).toBeNull();
  });

  it('returns null and clears the key when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadProjectFromLocalStorage()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
