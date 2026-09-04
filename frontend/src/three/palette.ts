/**
 * The scene's share of the Executive Titanium & Electric Gold system.
 * Kept in one place so the WebGL materials and the Tailwind tokens stay in step.
 */
export const SCENE = {
  /** Electric gold — wireframes, rings, chunk nodes. */
  gold: '#F59E0B',
  /** Deep amber — the glowing inner core. */
  amber: '#D97706',
  /** Liquid champagne — highlights and the active citation. */
  champagne: '#FDE68A',
  /** Warm ivory — specular light. */
  ivory: '#FFFBEB',
  /** Titanium charcoal — fog and shadowed metal. */
  titanium: '#08090D',
  slate: '#232838',
} as const;
