import { describe, it, expect } from 'vitest';
import { serializeProject, parseProjectFile } from './projectFile';
import { emptyProject } from '../types/project';

describe('projectFile', () => {
  it('round-trips an empty project', () => {
    const p = emptyProject();
    const text = serializeProject(p);
    expect(parseProjectFile(text)).toEqual(p);
  });

  it('rejects mismatched versions', () => {
    const bad = JSON.stringify({ ...emptyProject(), version: 2 });
    expect(() => parseProjectFile(bad)).toThrow(/version/);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseProjectFile('{not json')).toThrow();
  });

  it('rejects a structurally invalid project (missing tracks)', () => {
    const bad = JSON.stringify({ version: 1, name: 'x', bpm: 120, timeSignature: [4,4], ppq: 480 });
    expect(() => parseProjectFile(bad)).toThrow(/malformed/);
  });
});
