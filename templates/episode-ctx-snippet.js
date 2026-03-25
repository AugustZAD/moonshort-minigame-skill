/**
 * episode-ctx-snippet.js
 * Canonical CTX reader snippet — copy this block to the TOP of any game's
 * <script> section to make it episode-pipeline-aware.
 *
 * Priority chain:
 *   window.__EPISODE_CTX__  (injected by build-episode-game.js)
 *   →  URL query params     (direct host launch or local dev)
 *   →  hardcoded default    (standalone demo / fallback)
 *
 * The build script replaces the first 3 lines of each game's param block with
 * this 4-line version. The original default values are preserved per-file.
 */
const CTX = window.__EPISODE_CTX__ || {};
const params = new URLSearchParams(window.location.search);
const ATTRIBUTE = CTX.attribute || params.get('attribute') || 'Charm';
const PRIMARY_COLOR = CTX.primaryColor || params.get('primaryColor') || '#ff6b9d';
