export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Placement {
  top: number;
  left: number;
  side: 'top' | 'bottom';
}

/** Closest a popup may come to the viewport's edges. */
const MARGIN = 8;

/**
 * Places a popup next to a target, in viewport coordinates. Prefers below the target, flips above when the
 * popup doesn't fit below and there's more room above, then clamps both axes inside the viewport.
 */
export function place(target: Rect, popup: Size, viewport: Size, gap = 8): Placement {
  const below = viewport.height - (target.top + target.height) - gap - MARGIN;
  const above = target.top - gap - MARGIN;
  const side = popup.height > below && above > below ? 'top' : 'bottom';
  const top = side === 'bottom' ? target.top + target.height + gap : target.top - gap - popup.height;
  const left = target.left + target.width / 2 - popup.width / 2;
  return {
    side,
    top: clamp(top, MARGIN, viewport.height - popup.height - MARGIN),
    left: clamp(left, MARGIN, viewport.width - popup.width - MARGIN),
  };
}

/** Keeps value within [min, max]; when the popup is bigger than the room (max < min), min wins. */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
