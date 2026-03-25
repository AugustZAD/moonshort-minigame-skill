/**
 * dramatizer-adapter.ts
 *
 * Converts a Dramatizer-format episode JSON (from the story authoring tool)
 * into an EpisodeCtxInput compatible with `buildEpisodeCtx()` and the
 * `build-episode-game.js` pipeline.
 *
 * Dramatizer format → EpisodeCtx mapping:
 *   episode_id            → episodeId   (normalized to kebab-case)
 *   choice_node.options[check] → attribute (e.g. "WIL（意志）12" → "意志")
 *   choice_node.options[check] → difficulty (threshold ≤8=easy, ≤10=moderate, >10=hard)
 *   choice_node.type      → sceneType  (e.g. "成长型" → "tension")
 *   pre_choice_script     → narrative[] (last N dialogue lines extracted)
 *   characters[protagonist] + characterPortraits → character + characters map
 *   _enrichment fields    → primaryColor, background, gameId, sceneId, etc.
 *
 * Usage (Cocos scene):
 *
 *   import { adaptDramatizerEpisode } from './dramatizer-adapter';
 *   import { buildEpisodeCtx, injectCtxScript } from './episode-context-builder';
 *
 *   const ctxInput = adaptDramatizerEpisode(episodeJson, {
 *     sceneId:    'scene01',
 *     protagonist: 'Avery',
 *     primaryColor: '#8B2FC9',
 *     backgroundUrl: 'https://cdn.example.com/party-bg.jpg',
 *     characterPortraits: {
 *       Avery: 'https://cdn.example.com/avery-scared.png',
 *       Aiden: 'https://cdn.example.com/aiden-angry.png',
 *     },
 *   });
 *
 *   // Resolve gameId via build pipeline then:
 *   const ctx = buildEpisodeCtx({ ...ctxInput, gameId: 'qte-boss-parry' });
 *   webView.evaluateJS(injectCtxScript(ctx));
 *
 * Usage (build-episode-game.js CLI — generate a standard episode JSON):
 *
 *   const { toEpisodeConfigJson } = require('./dramatizer-adapter');
 *   const config = toEpisodeConfigJson(episodeJson, enrichment);
 *   fs.writeFileSync('episodes/ep05-scene01.json', JSON.stringify(config, null, 2));
 *   // Then: node scripts/build-episode-game.js episodes/ep05-scene01.json
 */

import type { NarrativeLine, EpisodeCtx } from './episode-context-builder';

// ─── Dramatizer input types ───────────────────────────────────────────────────

export interface DramatizerChoiceOption {
  id: string;
  content: string;
  description: string;
  /**
   * Check requirement string.
   * Format: `STAT_CODE（属性名）threshold` e.g. "WIL（意志）12"
   * Or: "无需检定" for unconditional options.
   */
  check: string;
}

export interface DramatizerOutcome {
  reaction_id: string;
  trigger_condition: string;
  story_content: string;
  butterfly_effect: string;
}

export interface DramatizerEpisode {
  episode_id: string;
  episode_title: string;
  characters: string[];
  character_outfits: Record<string, string>;
  pre_choice_script: string;
  choice_node: {
    type: string;
    options: DramatizerChoiceOption[];
  };
  post_choice_outcomes: DramatizerOutcome[];
}

// ─── Enrichment (caller-provided) ────────────────────────────────────────────

export interface DramatizerEnrichment {
  /**
   * Scene identifier within the episode, e.g. "scene01".
   * Must match kebab-case pattern: ^[a-z0-9]+(-[a-z0-9]+)*$
   */
  sceneId: string;

  /**
   * Hex theme color for the mini-game UI, e.g. "#8B2FC9".
   * Must be a 6-digit hex color.
   */
  primaryColor: string;

  /**
   * Which character is the protagonist (playable character).
   * Defaults to the first entry in DramatizerEpisode.characters.
   */
  protagonist?: string;

  /**
   * Background image URL for the narrative overlay.
   * Recommended size: ≥ 393×736 px.
   */
  backgroundUrl?: string;

  /**
   * Portrait URLs keyed by character display name.
   * Used in the narrative overlay per-line character switching.
   * @example { "Avery": "https://cdn/avery.png", "Aiden": "https://cdn/aiden.png" }
   */
  characterPortraits?: Record<string, string>;

  /**
   * Direct game ID override. When provided, skips LLM selection.
   */
  gameId?: string;

  /**
   * Maximum number of dialogue lines to extract from pre_choice_script.
   * Takes the last N lines (most tension-building, leading into the game).
   * Defaults to 5.
   */
  narrativeMaxLines?: number;

  /**
   * Explicit narrative lines override — skips pre_choice_script parsing entirely.
   * Use this when you want hand-curated lines rather than auto-extracted ones.
   */
  narrativeOverride?: NarrativeLine[];
}

// ─── Stat / check meta ────────────────────────────────────────────────────────

export type SceneType =
  | 'action'
  | 'tension'
  | 'romantic'
  | 'comedic'
  | 'mystery'
  | 'competitive'
  | 'reflective';

/** Maps Dramatizer stat codes to mini-game scene types */
const STAT_TO_SCENE_TYPE: Record<string, SceneType> = {
  WIL: 'tension',      // 意志 — resistance / emotional resolve
  STR: 'action',       // 力量 — physical action
  DEX: 'action',       // 敏捷 — agility
  AGI: 'action',       // 敏捷 (alt)
  CHA: 'romantic',     // 魅力 — charm / charisma
  INT: 'mystery',      // 智慧 / 智力 — intellect
  PER: 'mystery',      // 感知 — perception
  END: 'competitive',  // 耐力 — endurance
  LCK: 'competitive',  // 幸运 — luck
  EMP: 'romantic',     // 共情 — empathy
};

/** Maps Dramatizer choice node types to scene types */
const CHOICE_TYPE_TO_SCENE: Record<string, SceneType> = {
  '成长型':   'tension',
  '行动型':   'action',
  '浪漫型':   'romantic',
  '搞笑型':   'comedic',
  '悬疑型':   'mystery',
  '竞技型':   'competitive',
  '反思型':   'reflective',
};

// ─── Internal parsed check ────────────────────────────────────────────────────

interface CheckInfo {
  /** Stat code, e.g. "WIL" */
  code: string;
  /** Localized attribute name, e.g. "意志" */
  attribute: string;
  /** Numeric difficulty threshold */
  threshold: number;
  sceneType: SceneType;
  difficulty: 'easy' | 'moderate' | 'hard';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalizes a Dramatizer episode_id to a valid kebab-case identifier.
 * "EP 5" → "ep-5", "Episode_03" → "episode-03", "第三章" → "ep" (fallback)
 */
function normalizeEpisodeId(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : 'ep';
}

/**
 * Parses a Dramatizer check string into structured check info.
 * Returns null for "无需检定" or unrecognized formats.
 *
 * @example parseCheck("WIL（意志）12") → { code: "WIL", attribute: "意志", threshold: 12, ... }
 * @example parseCheck("无需检定") → null
 */
function parseCheck(checkStr: string): CheckInfo | null {
  if (!checkStr || checkStr === '无需检定') return null;

  // Format: CODE（属性名）threshold
  const m = checkStr.match(/^([A-Z]+)（([^）]+)）(\d+)$/);
  if (!m) {
    // Try English format: "WIL 12" or "WIL:12"
    const en = checkStr.match(/^([A-Z]+)[\s:]+(\d+)$/);
    if (!en) return null;
    const code = en[1];
    const threshold = parseInt(en[2], 10);
    return {
      code,
      attribute: code,
      threshold,
      sceneType: STAT_TO_SCENE_TYPE[code] ?? 'tension',
      difficulty: threshold <= 8 ? 'easy' : threshold <= 10 ? 'moderate' : 'hard',
    };
  }

  const code = m[1];
  const attribute = m[2];
  const threshold = parseInt(m[3], 10);

  return {
    code,
    attribute,
    threshold,
    sceneType: STAT_TO_SCENE_TYPE[code] ?? 'tension',
    difficulty: threshold <= 8 ? 'easy' : threshold <= 10 ? 'moderate' : 'hard',
  };
}

/**
 * Extracts dialogue lines from a Dramatizer-format script string.
 *
 * Matches lines in these forms:
 *   CharacterName（stage direction）：dialogue text
 *   CharacterName（stage direction）:dialogue text
 *   CharacterName：dialogue text
 *
 * Stage directions (lines entirely in 「（...）」) are skipped.
 * Returns the last `maxLines` dialogue exchanges (most tension-building).
 *
 * @param script     - Raw pre_choice_script string
 * @param portraitMap - Character name → portrait URL lookup
 * @param maxLines   - Maximum number of lines to return
 */
function extractNarrativeLines(
  script: string,
  portraitMap: Record<string, string>,
  maxLines: number,
): NarrativeLine[] {
  const results: NarrativeLine[] = [];

  // Match: Name（...）：text  OR  Name：text  (CJK or ASCII names)
  const dialogueRe =
    /^([A-Za-z\u4e00-\u9fff]{1,20})(?:（[^）]*）)?[：:]\s*(.+)$/gm;

  let match: RegExpExecArray | null;
  while ((match = dialogueRe.exec(script)) !== null) {
    const speaker = match[1].trim();
    const text = match[2].trim();
    const line: NarrativeLine = { speaker, text };
    if (portraitMap[speaker]) {
      line.portraitUrl = portraitMap[speaker];
    }
    results.push(line);
  }

  // Return the last N lines — these capture the climax moment before the game
  return results.slice(-maxLines);
}

/**
 * Derives a concise scene context string for LLM game selection.
 * Combines episode title, protagonist, check attribute, and choice type.
 */
function buildSceneContext(
  ep: DramatizerEpisode,
  protagonist: string,
  checkInfo: CheckInfo | null,
): string {
  const parts: string[] = [];
  parts.push(`『${ep.episode_title}』`);
  parts.push(`主角：${protagonist}`);
  if (checkInfo) {
    parts.push(`属性检定：${checkInfo.attribute}（难度${checkInfo.threshold}）`);
  }
  parts.push(`选择类型：${ep.choice_node.type}`);
  // Add option descriptions for richer LLM context
  ep.choice_node.options.forEach(o => {
    parts.push(`选项${o.id}：${o.content}`);
  });
  return parts.join('。');
}

// ─── Public result type ───────────────────────────────────────────────────────

/**
 * The normalized episode config produced by `adaptDramatizerEpisode`.
 * Compatible with both `buildEpisodeCtx()` (TypeScript) and the
 * `build-episode-game.js` CLI (JSON serialization).
 */
export interface DramatizerAdaptedConfig {
  // Standard EpisodeCtxInput fields
  episodeId: string;
  sceneId: string;
  attribute: string;
  primaryColor: string;
  sceneType?: SceneType;
  sceneContext?: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  gameId?: string;
  character?: { name: string; portraitUrl?: string };
  background?: { url: string };
  narrative?: NarrativeLine[];
  characters?: Record<string, string>;

  // Dramatizer-specific metadata (not injected into CTX, build-pipeline only)
  _dramatizer?: {
    episodeTitle: string;
    checkInfo: CheckInfo | null;
    choiceOptions: DramatizerChoiceOption[];
    outcomes: DramatizerOutcome[];
  };
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

/**
 * Converts a Dramatizer episode + enrichment into a normalized episode config.
 *
 * @param ep         - The raw Dramatizer episode JSON object.
 * @param enrichment - Caller-provided fields not present in the Dramatizer format
 *                     (sceneId, primaryColor, portrait URLs, background, etc.).
 * @returns A `DramatizerAdaptedConfig` ready to pass to `buildEpisodeCtx()` or
 *          serialize as an episode JSON for `build-episode-game.js`.
 *
 * @throws if `enrichment.sceneId` or `enrichment.primaryColor` is missing.
 */
export function adaptDramatizerEpisode(
  ep: DramatizerEpisode,
  enrichment: DramatizerEnrichment,
): DramatizerAdaptedConfig {
  // ── Validate enrichment ───────────────────────────────────────────────────
  if (!enrichment.sceneId) {
    throw new Error('DramatizerAdapter: enrichment.sceneId is required.');
  }
  if (!enrichment.primaryColor || !/^#[0-9a-fA-F]{6}$/.test(enrichment.primaryColor)) {
    throw new Error('DramatizerAdapter: enrichment.primaryColor must be a 6-digit hex color.');
  }

  // ── Normalize IDs ─────────────────────────────────────────────────────────
  const episodeId = normalizeEpisodeId(ep.episode_id);
  const sceneId = enrichment.sceneId;

  // ── Protagonist ───────────────────────────────────────────────────────────
  const protagonist = enrichment.protagonist ?? ep.characters[0] ?? 'Player';

  // ── Portrait map ──────────────────────────────────────────────────────────
  const portraitMap: Record<string, string> = { ...(enrichment.characterPortraits ?? {}) };

  // ── Parse check (first non-trivial option) ────────────────────────────────
  const checkOption = ep.choice_node.options.find(o => o.check !== '无需检定');
  const checkInfo = checkOption ? parseCheck(checkOption.check) : null;

  const attribute = checkInfo?.attribute ?? ep.choice_node.type ?? '勇气';
  const difficulty = checkInfo?.difficulty ?? 'moderate';

  // Scene type: prefer check-derived type, fall back to choice_node.type mapping
  const sceneType: SceneType =
    checkInfo?.sceneType ??
    CHOICE_TYPE_TO_SCENE[ep.choice_node.type] ??
    'tension';

  // ── Narrative lines ───────────────────────────────────────────────────────
  const maxLines = enrichment.narrativeMaxLines ?? 5;
  const narrative: NarrativeLine[] =
    enrichment.narrativeOverride ??
    extractNarrativeLines(ep.pre_choice_script, portraitMap, maxLines);

  // ── Scene context for LLM ─────────────────────────────────────────────────
  const sceneContext = buildSceneContext(ep, protagonist, checkInfo);

  // ── Assemble config ───────────────────────────────────────────────────────
  const config: DramatizerAdaptedConfig = {
    episodeId,
    sceneId,
    attribute,
    primaryColor: enrichment.primaryColor,
    sceneType,
    sceneContext,
    difficulty,
    narrative: narrative.length > 0 ? narrative : undefined,
    characters: Object.keys(portraitMap).length > 0 ? portraitMap : undefined,
    _dramatizer: {
      episodeTitle:  ep.episode_title,
      checkInfo,
      choiceOptions: ep.choice_node.options,
      outcomes:      ep.post_choice_outcomes,
    },
  };

  if (enrichment.gameId) {
    config.gameId = enrichment.gameId;
  }

  if (protagonist) {
    config.character = {
      name:       protagonist,
      portraitUrl: portraitMap[protagonist],
    };
  }

  if (enrichment.backgroundUrl) {
    config.background = { url: enrichment.backgroundUrl };
  }

  return config;
}

/**
 * Serializes a `DramatizerAdaptedConfig` to a plain JSON object compatible
 * with the `build-episode-game.js` CLI (strips `_dramatizer` metadata).
 *
 * @example
 *   const cfg = adaptDramatizerEpisode(ep, enrichment);
 *   fs.writeFileSync('episodes/ep05-scene01.json',
 *     JSON.stringify(toEpisodeConfigJson(cfg), null, 2));
 */
export function toEpisodeConfigJson(
  cfg: DramatizerAdaptedConfig,
): Omit<DramatizerAdaptedConfig, '_dramatizer'> {
  const { _dramatizer, ...rest } = cfg;
  void _dramatizer; // strip metadata
  return rest;
}
