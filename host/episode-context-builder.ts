/**
 * episode-context-builder.ts
 *
 * Cocos-side helper for assembling window.__EPISODE_CTX__ and injecting it
 * into a WebView before the mini-game HTML loads.
 *
 * Typical usage in a Cocos scene:
 *
 *   import { buildEpisodeCtx, injectCtxScript } from './episode-context-builder';
 *
 *   const ctx = buildEpisodeCtx({
 *     episodeId: 'ep01',
 *     sceneId:   'scene02',
 *     gameId:    'qte-boss-parry',
 *     attribute: 'Courage',
 *     primaryColor: '#E05C5C',
 *     character: { name: 'Aria', portraitUrl: 'https://cdn.example.com/aria.png' },
 *     background: { url: 'https://cdn.example.com/bg-alley.jpg' },
 *     narrative: [
 *       'The alley falls silent.',
 *       'Aria steps forward, eyes sharp.',
 *       'One wrong move and it\'s over.',
 *     ],
 *     difficulty: 'hard',
 *   });
 *
 *   // Inject before the WebView navigates to the game URL:
 *   const script = injectCtxScript(ctx);
 *   webView.evaluateJS(script);
 *
 *   // Or append params to the URL (attribute + primaryColor only):
 *   const gameUrl = appendCtxToUrl('https://...', ctx);
 *   webView.loadURL(gameUrl);
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CharacterCtx {
  /** Display name shown in the narrative overlay header */
  name?: string;
  /** Full URL to the character portrait image (square recommended, min 92×92 px) */
  portraitUrl?: string;
}

export interface BackgroundCtx {
  /** Full URL to a background image for the narrative overlay (recommended ≥ 393×736 px) */
  url: string;
}

/**
 * A single line of pre-game narrative dialogue.
 * When used in `EpisodeCtx.narrative`, the overlay will update the speaker name
 * and portrait for each line, enabling multi-character conversations.
 */
export interface NarrativeLine {
  /** Character name displayed above the dialogue box */
  speaker: string;
  /** Dialogue text shown in the dialogue box */
  text: string;
  /**
   * Portrait URL override for this specific line.
   * If omitted, falls back to `EpisodeCtx.characters[speaker]`.
   */
  portraitUrl?: string;
}

export interface EpisodeCtx {
  episodeId: string;
  sceneId: string;
  gameId: string;
  attribute: string;
  primaryColor: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  /**
   * Primary character — shown as the initial portrait/name in the overlay.
   * For multi-character narratives, individual `NarrativeLine` items take precedence.
   */
  character?: CharacterCtx;
  background?: BackgroundCtx;
  /**
   * Pre-game narrative lines.
   * Items may be plain strings (no speaker change) or NarrativeLine objects
   * (speaker name + portrait updated per line).
   */
  narrative?: Array<string | NarrativeLine>;
  /**
   * Multi-character portrait map for the narrative overlay.
   * Keys are character display names; values are portrait image URLs.
   * Used as fallback when a NarrativeLine does not carry its own portraitUrl.
   *
   * @example { "Avery": "https://cdn/avery.png", "Aiden": "https://cdn/aiden.png" }
   */
  characters?: Record<string, string>;
}

/**
 * Input to buildEpisodeCtx — same as EpisodeCtx but gameId is required at this point.
 * All other optional fields from the episode config are preserved as-is.
 */
export type EpisodeCtxInput = Omit<EpisodeCtx, 'gameId'> & { gameId: string };

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Validates and assembles a well-typed EpisodeCtx object.
 * Throws if required fields are missing or malformed.
 *
 * @param input - The episode scene parameters.
 * @returns A frozen, validated EpisodeCtx ready for serialization.
 */
export function buildEpisodeCtx(input: EpisodeCtxInput): EpisodeCtx {
  if (!input.episodeId || typeof input.episodeId !== 'string') {
    throw new Error('EpisodeContextBuilder: episodeId is required and must be a string.');
  }
  if (!input.sceneId || typeof input.sceneId !== 'string') {
    throw new Error('EpisodeContextBuilder: sceneId is required and must be a string.');
  }
  if (!input.gameId || typeof input.gameId !== 'string') {
    throw new Error('EpisodeContextBuilder: gameId is required and must be a string.');
  }
  if (!input.attribute || typeof input.attribute !== 'string') {
    throw new Error('EpisodeContextBuilder: attribute is required and must be a string.');
  }
  if (!input.primaryColor || !/^#[0-9a-fA-F]{6}$/.test(input.primaryColor)) {
    throw new Error('EpisodeContextBuilder: primaryColor must be a 6-digit hex color (e.g. "#E05C5C").');
  }

  const ctx: EpisodeCtx = {
    episodeId:    input.episodeId,
    sceneId:      input.sceneId,
    gameId:       input.gameId,
    attribute:    input.attribute,
    primaryColor: input.primaryColor,
  };

  if (input.difficulty) ctx.difficulty = input.difficulty;
  if (input.character)  ctx.character  = { ...input.character };
  if (input.background) ctx.background = { ...input.background };
  if (input.narrative && input.narrative.length > 0) {
    // Deep-copy: plain strings pass through; NarrativeLine objects are shallow-copied
    ctx.narrative = input.narrative.map(item =>
      typeof item === 'string' ? item : { ...item },
    );
  }
  if (input.characters && Object.keys(input.characters).length > 0) {
    ctx.characters = { ...input.characters };
  }

  return Object.freeze(ctx) as EpisodeCtx;
}

// ─── WebView helpers ──────────────────────────────────────────────────────────

/**
 * Serializes an EpisodeCtx into a JavaScript snippet that sets
 * `window.__EPISODE_CTX__`.
 *
 * Pass the returned string to `WebView.evaluateJS()` **before** the game page
 * finishes loading (i.e. on `onLoadStart` or before `loadURL`).
 *
 * @param ctx - A validated EpisodeCtx produced by buildEpisodeCtx().
 * @returns A self-contained JS snippet string.
 *
 * @example
 *   webView.evaluateJS(injectCtxScript(ctx));
 */
export function injectCtxScript(ctx: EpisodeCtx): string {
  return `window.__EPISODE_CTX__ = ${JSON.stringify(ctx)};`;
}

/**
 * Appends `attribute` and `primaryColor` as URL query parameters.
 * This is a lightweight alternative to evaluateJS when the WebView does not
 * support pre-load script injection (e.g. some Android WebViews).
 *
 * Note: `character`, `background`, and `narrative` fields are NOT included in
 * the URL — use `injectCtxScript` for those.
 *
 * @param baseUrl  - The mini-game URL (with or without existing query params).
 * @param ctx      - The episode context.
 * @returns The URL with `attribute` and `primaryColor` appended.
 */
export function appendCtxToUrl(baseUrl: string, ctx: EpisodeCtx): string {
  const url = new URL(baseUrl);
  url.searchParams.set('attribute',    ctx.attribute);
  url.searchParams.set('primaryColor', ctx.primaryColor);
  return url.toString();
}

/**
 * Returns a JavaScript snippet that reads the active CTX back from
 * `window.__EPISODE_CTX__` with URL param fallback.
 *
 * This is the canonical 4-line snippet embedded in every game file.
 * Useful for generating inline script content or for documentation.
 *
 * @param defaultAttribute   - Fallback attribute name (default: 'Charm').
 * @param defaultPrimaryColor - Fallback hex color (default: '#ff6b9d').
 * @returns The canonical CTX reader snippet as a string.
 */
export function readCtxSnippet(
  defaultAttribute   = 'Charm',
  defaultPrimaryColor = '#ff6b9d',
): string {
  return [
    `const CTX = window.__EPISODE_CTX__ || {};`,
    `const params = new URLSearchParams(window.location.search);`,
    `const ATTRIBUTE = CTX.attribute || params.get('attribute') || '${defaultAttribute}';`,
    `const PRIMARY_COLOR = CTX.primaryColor || params.get('primaryColor') || '${defaultPrimaryColor}';`,
  ].join('\n');
}

// ─── Type guards ──────────────────────────────────────────────────────────────

/**
 * Checks whether an unknown value is a valid EpisodeCtx.
 * Useful for validating objects received from external sources.
 */
export function isEpisodeCtx(value: unknown): value is EpisodeCtx {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.episodeId    === 'string' && v.episodeId.length > 0 &&
    typeof v.sceneId      === 'string' && v.sceneId.length > 0   &&
    typeof v.gameId       === 'string' && v.gameId.length > 0    &&
    typeof v.attribute    === 'string' && v.attribute.length > 0  &&
    typeof v.primaryColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.primaryColor as string)
  );
}
