import { describe, expect, it } from 'vitest';
import { place } from './position';

const VIEWPORT = { width: 1000, height: 800 };
const POPUP = { width: 200, height: 100 };

describe('place', () => {
  it('centers the popup below the target by default', () => {
    expect(place({ top: 100, left: 100, width: 40, height: 20 }, POPUP, VIEWPORT)).toEqual({ side: 'bottom', top: 128, left: 20 });
  });

  it('flips above when the popup does not fit below and there is more room above', () => {
    expect(place({ top: 700, left: 100, width: 40, height: 20 }, POPUP, VIEWPORT)).toEqual({ side: 'top', top: 592, left: 20 });
  });

  it('stays below when neither side fits and below has more room, clamped inside the viewport', () => {
    const p = place({ top: 100, left: 100, width: 40, height: 20 }, { width: 200, height: 250 }, { width: 1000, height: 300 });
    expect(p).toEqual({ side: 'bottom', top: 42, left: 20 });
  });

  it('clamps horizontally at the left edge', () => {
    expect(place({ top: 100, left: 0, width: 20, height: 20 }, POPUP, VIEWPORT).left).toBe(8);
  });

  it('clamps horizontally at the right edge', () => {
    expect(place({ top: 100, left: 980, width: 20, height: 20 }, POPUP, VIEWPORT).left).toBe(792);
  });

  it('pins a popup taller than the viewport to the top margin', () => {
    expect(place({ top: 100, left: 100, width: 40, height: 20 }, { width: 200, height: 400 }, { width: 1000, height: 300 }).top).toBe(8);
  });

  it('uses the gap it is given', () => {
    expect(place({ top: 100, left: 100, width: 40, height: 20 }, POPUP, VIEWPORT, 12).top).toBe(132);
  });
});
