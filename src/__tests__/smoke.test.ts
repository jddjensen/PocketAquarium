import { describe, it, expect } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

describe('game config', () => {
  it('has sensible dimensions', () => {
    expect(GAME_WIDTH).toBeGreaterThan(0);
    expect(GAME_HEIGHT).toBeGreaterThan(0);
  });
});
