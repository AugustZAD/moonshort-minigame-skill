#!/usr/bin/env node
/**
 * build-episode-game.js
 *
 * Pre-production episode content pipeline.
 * Given an episode JSON config, this script:
 *   1. Reads the episode config and validates required fields.
 *   2. Selects the best-fit mini-game (LLM → static fallback → direct override).
 *   3. Generates localized UI copy for the selected game (LLM, if meta.copyFields defined).
 *   4. Reads the selected game's index.html.
 *   5. Injects window.__EPISODE_CTX__ (with copy) as the first <script> block.
 *   6. Writes the output to games/<episodeId>_<sceneId>/index.html.
 *
 * Usage:
 *   ZENMUX_API_KEY=sk-ss-v1-... node scripts/build-episode-game.js episodes/example-ep01-scene02.json
 *   node scripts/build-episode-game.js episodes/my-ep.json --out dist/
 *
 * Options:
 *   --out <dir>       Output directory (default: games/)
 *   --no-llm          Skip LLM selection, use static fallback only
 *   --generate        Use Gemini 3.1 Pro to generate a brand-new game HTML
 *   --dry-run         Print resolved config without writing output
 *
 * Environment:
 *   ZENMUX_API_KEY    Required for LLM game selection (unless --no-llm or gameId provided)
 *                     Routes through ZenMux gateway → deepseek/deepseek-chat
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const configPath = args.find(a => !a.startsWith('--'));
const outFlag = args.indexOf('--out');
const NO_LLM = args.includes('--no-llm');
const DRY_RUN = args.includes('--dry-run');
const OUT_DIR_OVERRIDE = outFlag !== -1 ? args[outFlag + 1] : null;
const GENERATE = args.includes('--generate');

if (!configPath) {
  console.error('Usage: node scripts/build-episode-game.js <episode-config.json> [--out <dir>] [--no-llm] [--dry-run]');
  process.exit(1);
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const SELECTOR_PATH = path.join(ROOT, 'episodes', 'game-selector.json');
const OUT_BASE = OUT_DIR_OVERRIDE ? path.resolve(OUT_DIR_OVERRIDE) : GAMES_DIR;

// ─── Load episode config ───────────────────────────────────────────────────────

function loadConfig(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`[ERROR] Config not found: ${abs}`);
    process.exit(1);
  }
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    console.error(`[ERROR] Invalid JSON in ${abs}: ${err.message}`);
    process.exit(1);
  }

  // Validate required fields
  for (const field of ['episodeId', 'sceneId', 'attribute', 'primaryColor']) {
    if (!cfg[field]) {
      console.error(`[ERROR] Missing required field "${field}" in config.`);
      process.exit(1);
    }
  }
  if (!cfg.gameId && !cfg.sceneContext) {
    console.error('[ERROR] Either "gameId" or "sceneContext" must be present in config.');
    process.exit(1);
  }
  return cfg;
}

// ─── Static fallback game selection ───────────────────────────────────────────

function loadSelector() {
  if (!fs.existsSync(SELECTOR_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SELECTOR_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function pickFromSelector(selector, sceneType, difficulty) {
  const diff = difficulty || 'moderate';
  const pool =
    (sceneType && selector[sceneType] && selector[sceneType][diff]) ||
    (sceneType && selector[sceneType] && selector[sceneType]['moderate']) ||
    selector['action']?.['moderate'] ||
    [];
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── LLM helpers ──────────────────────────────────────────────────────────────

/** Read meta.json for a game directory; returns null if missing/invalid. */
function loadGameMeta(gameId) {
  const metaPath = path.join(GAMES_DIR, gameId, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  try { return JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { return null; }
}

/**
 * Returns an array of { id, meta? } for every game that has an index.html.
 * meta is the parsed meta.json content (or null if the file doesn't exist).
 */
function listAvailableGames() {
  if (!fs.existsSync(GAMES_DIR)) return [];
  return fs.readdirSync(GAMES_DIR)
    .filter(d => fs.existsSync(path.join(GAMES_DIR, d, 'index.html')))
    .map(d => ({ id: d, meta: loadGameMeta(d) }));
}

/** Format the game list for the LLM prompt: include description when available. */
function formatGameList(games) {
  return games.map(({ id, meta }) => {
    if (!meta) return id;
    const tags = [
      meta.sceneTypes?.join('/'),
      meta.mechanic,
      meta.mood?.slice(0, 3).join(', '),
    ].filter(Boolean).join(' | ');
    return `${id}: ${meta.description}  [${tags}]`;
  }).join('\n');
}

/** Generic ZenMux/DeepSeek request helper. Resolves with the response text or null. */
function zenmuxRequest(apiKey, body, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: 'zenmux.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.warn(`[WARN] ZenMux error: ${parsed.error.message}`);
            resolve(null); return;
          }
          resolve((parsed.choices?.[0]?.message?.content || '').trim());
        } catch (err) {
          console.warn(`[WARN] ZenMux parse error: ${err.message}`);
          resolve(null);
        }
      });
    });
    req.on('error', err => { console.warn(`[WARN] ZenMux request error: ${err.message}`); resolve(null); });
    req.setTimeout(timeoutMs, () => { console.warn('[WARN] ZenMux timeout.'); req.destroy(); resolve(null); });
    req.write(bodyStr);
    req.end();
  });
}


/** Streaming version — collects all SSE chunks into a single string.
 *  Needed for thinking models (Gemini 3.1 Pro Preview) that take >20s.
 *  Returns the fully assembled content string, or null on error/timeout.
 */
function zenmuxStreamRequest(apiKey, body, timeoutMs = 300000) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(Object.assign({}, body, { stream: true }));
    const options = {
      hostname: 'zenmux.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    let resolved = false;
    const done = (val) => { if (!resolved) { resolved = true; resolve(val); } };

    const req = https.request(options, (res) => {
      let fullContent = '';
      let buf = '';
      let dotTimer = null;

      // Progress dots so the console doesn't look frozen
      dotTimer = setInterval(() => process.stdout.write('.'), 3000);

      res.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        const lines = buf.split('\n');
        buf = lines.pop();            // keep incomplete line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) {
              console.warn(`\n[WARN] ZenMux stream error: ${parsed.error.message}`);
              continue;
            }
            fullContent += parsed.choices?.[0]?.delta?.content || '';
          } catch {}
        }
      });

      res.on('end', () => {
        clearInterval(dotTimer);
        process.stdout.write('\n');
        done(fullContent.trim() || null);
      });

      res.on('error', (err) => {
        clearInterval(dotTimer);
        process.stdout.write('\n');
        console.warn(`[WARN] Stream response error: ${err.message}`);
        done(null);
      });
    });

    req.on('error', (err) => {
      console.warn(`[WARN] Stream request error: ${err.message}`);
      done(null);
    });

    req.setTimeout(timeoutMs, () => {
      console.warn(`\n[WARN] Stream timeout after ${timeoutMs / 1000}s`);
      req.destroy();
      done(null);
    });

    req.write(payload);
    req.end();
  });
}

// ─── Step 1: LLM game selection ───────────────────────────────────────────────

async function selectGameWithLLM(sceneContext, sceneType, difficulty) {
  const apiKey = process.env.ZENMUX_API_KEY;
  if (!apiKey) {
    console.warn('[WARN] ZENMUX_API_KEY not set — falling back to static selector.');
    console.warn('       Set it with: export ZENMUX_API_KEY=sk-ss-v1-...');
    return null;
  }

  const availableGames = listAvailableGames();
  if (availableGames.length === 0) {
    console.warn('[WARN] No games found under games/ — falling back to static selector.');
    return null;
  }

  const systemPrompt = `You are a mini-game selector for a mobile narrative romance game (Episodes-style).
Pick the single best mini-game from the list below that fits the scene.

Rules:
- Return ONLY the game ID (kebab-case), nothing else — no explanation, no punctuation.
- The game must feel thematically natural — not jarring or irrelevant.
- Each entry is formatted as:  id: description  [sceneTypes | mechanic | mood]
- Difficulty hint: ${difficulty || 'moderate'}.
- Scene type hint: ${sceneType || 'not specified'}.

Available games:
${formatGameList(availableGames)}`;

  const userMessage = `Scene context:\n${sceneContext}`;

  const rawText = await zenmuxRequest(apiKey, {
    model: 'google/gemini-3.1-pro-preview',
    max_tokens: 64,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  }, 40000);

  if (!rawText) return null;

  console.log(`[LLM]  Raw response: "${rawText.slice(0, 120)}"`);

  // Extract the first token that looks like a kebab-case game id
  const tokenMatch = rawText.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/);
  const token = tokenMatch ? tokenMatch[0] : null;
  if (!token) {
    console.warn(`[WARN] LLM returned unparseable value "${rawText}" — falling back.`);
    return null;
  }

  const knownIds = availableGames.map(g => g.id);

  // 1. Exact match
  let gameId = knownIds.includes(token) ? token : null;

  // 2. Prefix match — e.g. "will" → "will-surge" (only if unambiguous)
  if (!gameId) {
    const prefixMatches = knownIds.filter(id => id.startsWith(token + '-') || id === token);
    if (prefixMatches.length === 1) {
      gameId = prefixMatches[0];
      console.log(`[LLM]  Prefix-matched "${token}" → "${gameId}"`);
    } else if (prefixMatches.length > 1) {
      console.warn(`[WARN] Ambiguous prefix "${token}" matches ${prefixMatches.join(', ')} — falling back.`);
      return null;
    }
  }

  if (!gameId) {
    console.warn(`[WARN] LLM returned unknown game "${token}" — falling back.`);
    return null;
  }
  if (!fs.existsSync(path.join(GAMES_DIR, gameId, 'index.html'))) {
    console.warn(`[WARN] Resolved game "${gameId}" has no index.html — falling back.`);
    return null;
  }
  console.log(`[LLM]  ZenMux/Gemini selected game: ${gameId}`);
  return gameId;
}

// ─── Step 2: LLM game copy generation ────────────────────────────────────────
//
// Generates localized/contextualized UI copy for games that declare copyFields
// in their meta.json. Injected into CTX.copy — games read it at runtime.
//
// copyFields supported by will-surge (and future games):
//   gameTitle, hint, buttonLabel, threatLabel, willLabel, rescueLabel,
//   statusHolding, statusNeutral, statusLosing, surgeWarning, surgeDefeated

async function generateGameCopy(cfg, gameId) {
  const apiKey = process.env.ZENMUX_API_KEY;
  if (!apiKey) return null;

  const meta = loadGameMeta(gameId);
  if (!meta?.copyFields || meta.copyFields.length === 0) return null;

  // Build a compact scene summary for the prompt
  const narrativeSummary = cfg.narrative
    ? cfg.narrative.slice(0, 4).map(line =>
        typeof line === 'string' ? line : `${line.speaker}: ${line.text}`
      ).join('\n')
    : '';

  const characterName = cfg.character?.name || cfg.characters
    ? Object.keys(cfg.characters || {}).join(', ')
    : '';

  const systemPrompt = `You are a mobile game UI copywriter for a Chinese narrative romance game (Episodes-style).
Generate localized, emotionally resonant UI text for a mini-game, based on the scene context.

Game: "${meta.title}" — ${meta.description}
Scene type: ${cfg.sceneType || 'tension'}
Attribute being tested: ${cfg.attribute}
${characterName ? `Characters: ${characterName}` : ''}

Rules:
- Write in Chinese (Simplified). Be vivid and match the emotional tone of the scene.
- Keep each string SHORT — under 12 characters for labels, under 20 for hints/status.
- Return a single valid JSON object. No markdown, no code fences, no explanation.
- Keys must be exactly: ${meta.copyFields.join(', ')}`;

  const userMessage = narrativeSummary
    ? `Scene dialogue:\n${narrativeSummary}`
    : `Scene context: ${cfg.sceneContext || ''}`;

  console.log('[LLM]  Generating game copy…');
  const rawText = await zenmuxRequest(apiKey, {
    model: 'google/gemini-2.5-flash',   // structured JSON — use instruction-following model
    max_tokens: 700,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  }, 25000);

  if (!rawText) return null;

  console.log('[LLM]  Copy raw response (' + rawText.length + ' chars):', rawText.slice(0, 800));

  // Extract JSON object — handles markdown fences and leading prose from some models
  let jsonStr = rawText;
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  } else {
    // Find the first { ... } block (Gemini sometimes prepends prose)
    const objMatch = rawText.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];
  }
  const cleaned = jsonStr.trim();
  try {
    const copy = JSON.parse(cleaned);
    // Keep only declared copyFields
    const filtered = {};
    for (const k of meta.copyFields) {
      if (copy[k] !== undefined) filtered[k] = copy[k];
    }
    console.log('[LLM]  Game copy generated:', JSON.stringify(filtered));
    return Object.keys(filtered).length > 0 ? filtered : null;
  } catch (err) {
    console.warn(`[WARN] Failed to parse copy JSON: ${err.message} — skipping copy.`);
    return null;
  }
}

// ─── CTX injection ────────────────────────────────────────────────────────────

// ─── Narrative overlay (P0 + P1) ──────────────────────────────────────────────
//
// Injected into <body> when cfg.narrative has at least one line.
// Reads window.__EPISODE_CTX__ at runtime — no hard-coded data in the markup.
// Handles: background image, character portrait + name, tap-to-advance dialogue.
// Disappears with a fade after the last line; Phaser canvas is already loaded
// underneath and becomes interactive immediately after the overlay fades out.

function buildOverlayBlock(cfg) {
  if (!cfg.narrative || cfg.narrative.length === 0) return null;

  return `<div id="ep-ol" style="position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:60px;touch-action:manipulation;">
<div id="ep-bg" style="position:absolute;inset:0;background-size:cover;background-position:center;"></div>
<div style="position:absolute;inset:0;background:rgba(0,0,0,0.72);"></div>
<div id="ep-box" style="position:relative;width:340px;background:rgba(12,14,28,0.93);border:1.5px solid rgba(255,255,255,0.14);border-radius:18px;padding:18px 22px 14px;">
  <div style="display:flex;align-items:center;gap:11px;margin-bottom:11px;">
    <img id="ep-port" style="width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);object-fit:cover;display:none;" alt="">
    <span id="ep-name" style="color:#fff;font-family:Nunito,sans-serif;font-size:15px;font-weight:700;"></span>
  </div>
  <p id="ep-txt" style="color:#e5e7eb;font-family:'Patrick Hand',sans-serif;font-size:17px;line-height:1.65;min-height:52px;margin:0;"></p>
  <div style="text-align:right;margin-top:9px;color:rgba(255,255,255,0.3);font-family:Nunito,sans-serif;font-size:12px;">tap to continue \u25b6</div>
</div>
<div id="ep-dots" style="position:relative;display:flex;gap:6px;margin-top:13px;"></div>
</div>
<script>
(function(){
  var CTX=window.__EPISODE_CTX__||{};
  var lines=CTX.narrative||[];
  var ol=document.getElementById('ep-ol');
  if(!ol||lines.length===0){if(ol)ol.style.display='none';return;}

  // Background
  var bg=document.getElementById('ep-bg');
  if(CTX.background&&CTX.background.url){
    bg.style.backgroundImage='url('+JSON.stringify(CTX.background.url)+')';
  }

  var port=document.getElementById('ep-port');
  var nameEl=document.getElementById('ep-name');

  // Build portrait map: CTX.characters (multi-char map) + CTX.character (single default)
  var charMap={};
  if(CTX.characters&&typeof CTX.characters==='object'){
    Object.keys(CTX.characters).forEach(function(k){charMap[k]=CTX.characters[k];});
  }
  if(CTX.character&&CTX.character.name){
    if(!charMap[CTX.character.name])charMap[CTX.character.name]=CTX.character.portraitUrl||'';
  }

  // Set initial character from CTX.character
  if(CTX.character){
    if(CTX.character.portraitUrl){port.src=CTX.character.portraitUrl;port.style.display='block';}
    if(CTX.character.name)nameEl.textContent=CTX.character.name;
  }

  function setChar(speaker,portraitUrl){
    if(speaker)nameEl.textContent=speaker;
    var url=portraitUrl||(speaker&&charMap[speaker])||'';
    if(url){port.src=url;port.style.display='block';}
    else{port.style.display='none';}
  }

  // Progress dots
  var dotsEl=document.getElementById('ep-dots');
  lines.forEach(function(_,i){
    var d=document.createElement('div');
    d.style.cssText='width:7px;height:7px;border-radius:50%;transition:background 0.25s;background:rgba(255,255,255,'+(i===0?'0.9':'0.25')+')';
    dotsEl.appendChild(d);
  });

  var idx=0;
  var txt=document.getElementById('ep-txt');

  function show(i){
    var item=lines[i];
    // NarrativeLine object {speaker, text, portraitUrl?} or plain string
    if(item&&typeof item==='object'){
      txt.textContent=item.text||'';
      setChar(item.speaker||null,item.portraitUrl||null);
    }else{
      txt.textContent=String(item||'');
    }
    var ds=dotsEl.querySelectorAll('div');
    ds.forEach(function(d,j){d.style.background='rgba(255,255,255,'+(j===i?'0.9':'0.25')+')';});
  }

  show(0);
  ol.addEventListener('click',function(){
    idx++;
    if(idx>=lines.length){
      ol.style.transition='opacity 0.35s';
      ol.style.opacity='0';
      setTimeout(function(){ol.style.display='none';},380);
    }else{show(idx);}
  });
})();
<\/script>`;
}

function injectOverlay(html, overlayBlock) {
  if (!overlayBlock) return html;
  const bodyTag = html.indexOf('<body>');
  if (bodyTag === -1) return html;
  const insertAt = bodyTag + '<body>'.length;
  return html.slice(0, insertAt) + '\r\n' + overlayBlock + '\r\n' + html.slice(insertAt);
}

function buildCtxScript(cfg, gameId, copy) {
  const ctx = {
    episodeId: cfg.episodeId,
    sceneId: cfg.sceneId,
    gameId,
    attribute: cfg.attribute,
    primaryColor: cfg.primaryColor,
  };
  if (cfg.character)   ctx.character   = cfg.character;
  if (cfg.background)  ctx.background  = cfg.background;
  if (cfg.narrative)   ctx.narrative   = cfg.narrative;
  if (cfg.difficulty)  ctx.difficulty  = cfg.difficulty;
  if (cfg.characters)  ctx.characters  = cfg.characters;
  if (copy)            ctx.copy        = copy;

  return `<script>\nwindow.__EPISODE_CTX__ = ${JSON.stringify(ctx, null, 2)};\n</script>`;
}

function injectCtx(html, ctxScript) {
  // Insert right before <script src="...phaser..."> so CTX is available before game code
  const phaserSrcTag = html.indexOf('<script src="https://cdn.jsdelivr.net/npm/phaser');
  if (phaserSrcTag !== -1) {
    return html.slice(0, phaserSrcTag) + ctxScript + '\r\n' + html.slice(phaserSrcTag);
  }
  // Fallback: inject right before first <script> tag in <body>
  const bodyScript = html.indexOf('<script>', html.indexOf('<body>'));
  if (bodyScript !== -1) {
    return html.slice(0, bodyScript) + ctxScript + '\r\n' + html.slice(bodyScript);
  }
  // Last resort: prepend
  return ctxScript + '\r\n' + html;
}


// --- Step AI: Generate full game with Gemini 3.1 Pro Preview -----------------
//
// When --generate flag is set, skips template selection and asks Gemini 3.1 Pro
// Preview to write a complete Phaser 3 H5 mini-game from scratch.

async function generateGameWithLLM(cfg) {
  const apiKey = process.env.ZENMUX_API_KEY;
  if (!apiKey) { console.error('[ERROR] ZENMUX_API_KEY not set.'); return null; }

  const narrativeLines = (cfg.narrative || []).map(line =>
    typeof line === 'string' ? line : `${line.speaker}: ${line.text}`
  ).join('\n');

  const characterName = (cfg.character && cfg.character.name) || '\u4e3b\u89d2';
  const sceneType   = cfg.sceneType   || 'tension';
  const difficulty  = cfg.difficulty  || 'moderate';
  const attribute   = cfg.attribute;
  const primaryHex  = cfg.primaryColor || '#8B2FC9';
  const sceneCtx    = cfg.sceneContext || '';

  const systemPrompt = [
    'You are an expert HTML5 game developer for mobile narrative mini-games (Episodes-style).',
    'Write a COMPLETE, self-contained Phaser 3 mini-game as a SINGLE HTML file.',
    '',
    'TECHNICAL REQUIREMENTS:',
    '- Phaser 3.60 CDN: https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
    '- Canvas: 393x736, portrait, Scale.FIT + CENTER_BOTH',
    '- Read window.__EPISODE_CTX__ (already injected): const CTX = window.__EPISODE_CTX__ || {};',
    '- Use CTX.attribute, CTX.primaryColor, CTX.character (optional)',
    '- On game end: call notifyGameComplete({ rating, score, attribute:CTX.attribute, modifier, gameId:"ai-generated" })',
    '- notifyGameComplete: try webkit.messageHandlers.jsBridge, then window.jsBridge.postMessage, then window.parent.postMessage',
    '',
    'DESIGN REQUIREMENTS:',
    `- Primary color: ${primaryHex} (player elements, buttons, highlights)`,
    '- Dark near-black background, minimal UI, emotionally resonant',
    '- Chinese labels OK — match emotional tone of scene',
    '- Duration: 15-25 seconds of gameplay',
    '- Include a ResultScene: rating letter (S/A/B/C), score, attribute modifier (+3/+1/0/-1), Continue button',
    '- NO external assets — Phaser Graphics, shapes, text, tweens only',
    '- Google Fonts in <head>: Nunito 700/900, Patrick Hand',
    '',
    'SCENE CONTEXT:',
    `Episode: ${cfg.episodeId} / ${cfg.sceneId}`,
    `Scene type: ${sceneType} | Difficulty: ${difficulty}`,
    `Attribute tested: ${attribute}`,
    `Character: ${characterName}`,
    sceneCtx ? `Scene: ${sceneCtx}` : '',
    narrativeLines ? `Dialogue:\n${narrativeLines}` : '',
    '',
    'OUTPUT: Return ONLY the complete HTML. No explanation, no markdown fences.',
    'Start with <!DOCTYPE html> and end with </html>.',
  ].filter(Boolean).join('\n');

  const userMessage = `Generate a ${sceneType} mini-game. Mechanic must reflect "${attribute}". Make it emotionally resonant.`;

  console.log('[GEN]  Calling Gemini 3.1 Pro Preview (streaming)...');
  console.log('[GEN]  Timeout: 5 min. Progress dots every 3s: ');

  const rawText = await zenmuxStreamRequest(apiKey, {
    model: 'google/gemini-3.1-pro-preview',
    max_tokens: 16000,
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
  }, 300000);  // 5-minute timeout

  if (!rawText) { console.error('[ERROR] Gemini returned no content.'); return null; }

  // Strip markdown fences if present
  let html = rawText.trim();
  const fenceStart = html.indexOf('<!DOCTYPE');
  const htStart    = html.indexOf('<html');
  const startIdx   = fenceStart !== -1 ? fenceStart : htStart !== -1 ? htStart : -1;
  if (startIdx > 0) html = html.slice(startIdx);

  if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
    console.error('[ERROR] Response does not look like HTML. First 200 chars:');
    console.error(html.slice(0, 200));
    return null;
  }

  console.log(`[GEN]  Generated ${Math.round(html.length / 1024)} KB of HTML`);
  return html;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nEpisode Game Builder');
  console.log('─'.repeat(60));

  const cfg = loadConfig(configPath);
  console.log(`\nEpisode : ${cfg.episodeId} / ${cfg.sceneId}`);
  console.log(`Attribute: ${cfg.attribute}  Color: ${cfg.primaryColor}`);

  // -- GENERATE mode: Gemini 3.1 Pro writes a brand-new game from scratch ------
  if (GENERATE) {
    const generatedHtml = await generateGameWithLLM(cfg);
    if (!generatedHtml) process.exit(1);

    const overlayBlock = buildOverlayBlock(cfg);
    const ctxScript    = buildCtxScript(cfg, 'ai-generated', null);
    const outputHtml   = injectOverlay(injectCtx(generatedHtml, ctxScript), overlayBlock);

    const outputDir  = path.join(OUT_BASE, `${cfg.episodeId}_${cfg.sceneId}`);
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(outputPath, outputHtml, 'utf8');

    console.log(`
[GEN DONE]  Written to: ${path.relative(ROOT, outputPath)}`);
    console.log(`  Mode   : AI-generated (Gemini 3.1 Pro Preview)`);
    console.log(`  Overlay: ${overlayBlock ? cfg.narrative.length + ' line(s)' : 'none'}`);
    console.log(`  Size   : ${Math.round(outputHtml.length / 1024)} KB`);
    return;
  }

  // -- TEMPLATE mode: select from existing game library -----------------------

  // Step 1: Resolve gameId
  let gameId = cfg.gameId || null;

  if (gameId) {
    console.log(`[OVERRIDE] Using gameId from config: ${gameId}`);
  } else if (!NO_LLM) {
    console.log('[LLM]  Calling Gemini API for game selection…');
    gameId = await selectGameWithLLM(cfg.sceneContext, cfg.sceneType, cfg.difficulty);
  }

  if (!gameId) {
    const selector = loadSelector();
    gameId = pickFromSelector(selector, cfg.sceneType, cfg.difficulty);
    if (gameId) {
      console.log(`[FALLBACK] Static selector picked: ${gameId}`);
    } else {
      console.error('[ERROR] Could not resolve a gameId. Check game-selector.json and config.');
      process.exit(1);
    }
  }

  // Step 2: Verify game exists
  const gameSrcPath = path.join(GAMES_DIR, gameId, 'index.html');
  if (!fs.existsSync(gameSrcPath)) {
    console.error(`[ERROR] Game not found: ${gameSrcPath}`);
    process.exit(1);
  }

  // Step 3: Generate game-specific UI copy (LLM, only for games with meta.copyFields)
  let copy = null;
  if (!NO_LLM) {
    copy = await generateGameCopy(cfg, gameId);
  }

  // Step 4: Build CTX + overlay injection blocks
  const ctxScript = buildCtxScript(cfg, gameId, copy);
  const overlayBlock = buildOverlayBlock(cfg);

  // Step 5: Dry run
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Resolved config:');
    console.log(`  Game   : ${gameId}`);
    console.log(`  Source : ${path.relative(ROOT, gameSrcPath)}`);
    console.log(`  Output : games/${cfg.episodeId}_${cfg.sceneId}/index.html`);
    console.log(`  Overlay: ${overlayBlock ? `yes (${cfg.narrative.length} narrative line(s))` : 'none'}`);
    console.log(`  Copy   : ${copy ? JSON.stringify(copy) : 'none'}`);
    console.log('\n[DRY RUN] CTX block to inject:');
    console.log(ctxScript);
    return;
  }

  // Step 6: Read source, inject CTX + overlay, write output
  const srcHtml = fs.readFileSync(gameSrcPath, 'utf8');
  const outputHtml = injectOverlay(injectCtx(srcHtml, ctxScript), overlayBlock);

  const outputDir = path.join(OUT_BASE, `${cfg.episodeId}_${cfg.sceneId}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, outputHtml, 'utf8');

  console.log(`\n[DONE]  Output written to: ${path.relative(ROOT, outputPath)}`);
  console.log(`  Game   : ${gameId}`);
  console.log(`  Overlay: ${overlayBlock ? `${cfg.narrative.length} narrative line(s)` : 'none'}`);
  console.log(`  Copy   : ${copy ? `${Object.keys(copy).length} field(s) customized` : 'none (game not copy-enabled)'}`);
  console.log(`  Size   : ${Math.round(outputHtml.length / 1024)} KB`);
}

main().catch(err => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
