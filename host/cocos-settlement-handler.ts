export type MiniGameRating = 'S' | 'A' | 'B' | 'C';

export interface MiniGameSettlement {
  rating: MiniGameRating;
  score: number;
  attribute: string;
  modifier: 3 | 1 | 0 | -1;
  [key: string]: unknown;
}

export const MODIFIER_BY_RATING: Record<MiniGameRating, MiniGameSettlement['modifier']> = {
  S: 3,
  A: 1,
  B: 0,
  C: -1,
};

export function isMiniGameRating(value: unknown): value is MiniGameRating {
  return value === 'S' || value === 'A' || value === 'B' || value === 'C';
}

export function isMiniGameSettlement(value: unknown): value is MiniGameSettlement {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  if (!isMiniGameRating(payload.rating)) {
    return false;
  }
  if (typeof payload.score !== 'number' || !Number.isFinite(payload.score)) {
    return false;
  }
  if (typeof payload.attribute !== 'string' || payload.attribute.length === 0) {
    return false;
  }
  if (payload.modifier !== MODIFIER_BY_RATING[payload.rating]) {
    return false;
  }

  return true;
}

export function parseMiniGameSettlement(raw: string): MiniGameSettlement {
  const parsed: unknown = JSON.parse(raw);
  if (!isMiniGameSettlement(parsed)) {
    throw new Error('Invalid mini-game settlement payload');
  }
  return parsed;
}

export function parseMiniGameBridgeEvent(event: { detail: string }): MiniGameSettlement {
  return parseMiniGameSettlement(event.detail);
}
