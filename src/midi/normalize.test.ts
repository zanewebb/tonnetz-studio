import { describe, it, expect } from 'vitest';
import { rescaleTicks } from './normalize';

describe('rescaleTicks', () => {
  it('scales ticks by target/source ratio', () => {
    expect(rescaleTicks(240, 240, 480)).toBe(480);
    expect(rescaleTicks(120, 96, 480)).toBe(600);
  });

  it('returns the same value when source equals target', () => {
    expect(rescaleTicks(123, 480, 480)).toBe(123);
  });

  it('rounds to integer ticks', () => {
    expect(rescaleTicks(1, 7, 480)).toBe(69);
  });
});
