#!/usr/bin/env node
/**
 * update-game-shell.js
 *
 * Uses Gemini 3.1 Pro to apply the Figma Part1+Part2 shell design
 * to one or all 12 attribute-archetypes game templates.
 *
 * Usage:
 *   ZENMUX_API_KEY=sk-... node scripts/update-game-shell.js
 *   ZENMUX_API_KEY=sk-... node scripts/update-game-shell.js --game qte-boss-parry
 *   ZENMUX_API_KEY=sk-... node scripts/update-game-shell.js --game qte-boss-parry --dry-run
 *
 * Options:
 *   --game <id>   Only process one game (folder name under packs/attribute-archetypes/games/)
 *   --dry-run     Print prompt without calling API
 *   --concurrency N  Parallel requests (default: 2, max: 4)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..');
const GAMES_DIR   = path.join(ROOT, 'packs', 'attribute-archetypes', 'games');
const DS_DIR      = path.join(ROOT, 'packs', 'attribute-archetypes', 'design-system');
const MODEL       = 'google/gemini-3.1-pro-preview';
const MAX_TOKENS  = 32000;
const TIMEOUT_MS  = 600000; // 10 min per game

const args        = process.argv.slice(2);
const gameArg     = args.includes('--game') ? args[args.indexOf('--game') + 1] : null;
const DRY_RUN     = args.includes('--dry-run');
const concArg     = args.includes('--concurrency') ? parseInt(args[args.indexOf('--concurrency') + 1], 10) : 2;
const CONCURRENCY = Math.min(Math.max(concArg, 1), 4);
const API_KEY     = process.env.ZENMUX_API_KEY;

const ALL_GAMES = [
  'qte-boss-parry',
  'qte-hold-release',
  'will-surge',
  'red-light-green-light',
  'lane-dash',
  'cannon-aim',
  'parking-rush',
  'maze-escape',
  'conveyor-sort',
  'color-match',
  'spotlight-seek',
  'stardew-fishing',
];

// ─── Load design-system docs (trimmed — only components.md code snippets) ─────

function loadDesignSystem() {
  // Only send the components.md — it has the actual helper function code.
  // Typography, color-strategy, svg-decorations, interaction are already
  // summarized in the system prompt itself.
  const compPath = path.join(DS_DIR, 'components.md');
  if (!fs.existsSync(compPath)) return '';
  return fs.readFileSync(compPath, 'utf8');
}

// ─── Trim game HTML to reduce token count ─────────────────────────────────────

function trimGameHtml(html) {
  // Replace the large MoonAudio class body with a placeholder — it never changes.
  // Same for shared helpers (hexToRgb, blendHex, drawRRect, etc.)
  let trimmed = html;

  // Collapse MoonAudio class (typically lines 147–292 → ~150 lines)
  trimmed = trimmed.replace(
    /(class MoonAudio \{[\s\S]*?stopAll\(\)\s*\{[^}]*\}\s*\})/,
    '/* === MoonAudio class (KEEP UNCHANGED — ~150 lines omitted) === */'
  );

  // Collapse shared helpers block (hexToRgb through drawDotPattern)
  trimmed = trimmed.replace(
    /(function hexToRgb[\s\S]*?function drawDotPattern[\s\S]*?\n\})/,
    '/* === Shared helpers (hexToRgb, blendHex, drawRRect, drawCandyCard, drawGoldCorners, makeButton, createHealthBar, createTimerBar, spawnParticles, showToast, damageFlash, screenShake, drawDotPattern — KEEP ALL UNCHANGED) === */'
  );

  console.log(`[TRIM] ${Math.round(html.length/1024)} KB → ${Math.round(trimmed.length/1024)} KB`);
  return trimmed;
}

// ─── ZenMux streaming request ─────────────────────────────────────────────────

function zenmuxStream(apiKey, body, timeoutMs) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(Object.assign({}, body, { stream: true }));
    const options = {
      hostname: 'zenmux.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    let resolved = false;
    const done = (val) => { if (!resolved) { resolved = true; resolve(val); } };

    const req = https.request(options, (res) => {
      let fullContent = '', buf = '', timer = null;
      timer = setInterval(() => process.stdout.write('.'), 5000);

      res.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            fullContent += parsed.choices?.[0]?.delta?.content || '';
          } catch {}
        }
      });

      res.on('end', () => { clearInterval(timer); process.stdout.write('\n'); done(fullContent.trim() || null); });
      res.on('error', (err) => { clearInterval(timer); console.warn(`\n[WARN] ${err.message}`); done(null); });
    });

    req.setTimeout(timeoutMs, () => { console.warn(`\n[WARN] Request timed out after ${timeoutMs / 1000}s`); req.destroy(); });
    req.on('error', (err) => { console.warn(`[WARN] ${err.message}`); done(null); });
    req.write(payload);
    req.end();
  });
}

// ─── Build prompt ─────────────────────────────────────────────────────────────

function buildPrompt(gameId, existingHtml, designSystem) {
  const systemPrompt = `You are an expert Phaser 3 HTML5 game developer.
You will receive an existing mini-game HTML file and a design system specification.
Your task: update the HTML to apply the new Figma shell design, WITHOUT changing game mechanics.

## New Shell Design (from Figma Part 1 & Part 2)

Layout zones (canvas 393×736):
  y=0–88:    Episode title bar (pink, wavy scallop bottom)
  y=88–196:  VS header (white card, two portrait circles, names, HP bars)
  y=196–268: Dialogue bubble (white rounded rect, narrative text)
  y=268–590: Game content (existing mechanics, shift Y values +100 if previously started at y≈170)
  y=590–610: Score display (below game area)
  y=610–736: Action buttons

## Shell Constants to Add

Add after existing PALETTE block:
\`\`\`javascript
const SHELL = {
  primary:     0xFF6B9D,  primaryHex:  '#FF6B9D',
  primaryDark: 0xD44E7A,  primaryLight: 0xFFB5C5,
  white:       0xFFFFFF,
};
\`\`\`

## New CTX Fields to Add

Add after existing CTX block:
\`\`\`javascript
const EPISODE_LABEL     = CTX.episodeLabel     || params.get('episodeLabel')     || 'EPISODE 1';
const EPISODE_TITLE     = CTX.episodeTitle     || params.get('episodeTitle')     || 'The Challenge';
const PLAYER_NAME       = CTX.playerName       || params.get('playerName')       || (CTX.character?.name) || 'You';
const PLAYER_PORTRAIT   = CTX.playerPortrait   || params.get('playerPortrait')   || null;
const OPPONENT_NAME     = CTX.opponentName     || params.get('opponentName')     || 'Boss';
const OPPONENT_PORTRAIT = CTX.opponentPortrait || params.get('opponentPortrait') || null;
const DIALOGUE_TEXT     = CTX.dialogueText     || params.get('dialogueText')     || '';
const UNLOCK_S_COST     = parseInt(CTX.unlockSTierCost || params.get('unlockSTierCost') || '50', 10);
const REPLAY_COST       = parseInt(CTX.replayCost      || params.get('replayCost')      || '20', 10);
const CONTENT_TOP       = 268;
\`\`\`

## New Helper Functions to Add (after existing helpers)

\`\`\`javascript
function drawEpisodeTitleBar(scene) {
  const g = scene.add.graphics().setDepth(30);
  g.fillStyle(SHELL.primary, 1);
  g.fillRect(0, 0, W, 72);
  const bumps = 6, bumpW = W / bumps;
  g.beginPath(); g.moveTo(0, 72);
  for (let i = 0; i < bumps; i++) g.arc(i * bumpW + bumpW / 2, 72, bumpW / 2, Math.PI, 0, false);
  g.lineTo(W, 0); g.lineTo(0, 0); g.closePath(); g.fillPath();
  scene.add.text(16, 15, (EPISODE_LABEL).toUpperCase(), {
    fontFamily: 'Nunito', fontSize: '13px', fontStyle: '700', color: 'rgba(255,255,255,0.75)'
  }).setDepth(31);
  scene.add.text(W / 2, 44, EPISODE_TITLE, {
    fontFamily: 'Nunito', fontSize: '20px', fontStyle: '900',
    color: '#ffffff', stroke: 'rgba(0,0,0,0.2)', strokeThickness: 2
  }).setOrigin(0.5).setDepth(31);
}

function drawVSHeader(scene) {
  const g = scene.add.graphics().setDepth(29);
  g.fillStyle(SHELL.white, 0.95); g.fillRect(0, 88, W, 108);
  g.lineStyle(1, SHELL.primary, 0.18); g.beginPath(); g.moveTo(0,196); g.lineTo(W,196); g.strokePath();
  scene.add.text(W/2, 138, 'VS', {
    fontFamily:'Nunito', fontSize:'28px', fontStyle:'900', color:'#E53E3E', stroke:'#ffffff', strokeThickness:3
  }).setOrigin(0.5).setDepth(31).setAngle(-5);
  // Player left
  g.fillStyle(SHELL.primary,1); g.fillCircle(64,132,34);
  g.lineStyle(3,SHELL.primaryDark,1); g.strokeCircle(64,132,34);
  if (scene.textures.exists('playerPortrait')) {
    const mg=scene.add.graphics().setDepth(30); mg.fillCircle(64,132,32);
    scene.add.image(64,132,'playerPortrait').setDisplaySize(64,64).setDepth(30).setMask(mg.createGeometryMask());
  } else {
    scene.add.text(64,132,(PLAYER_NAME||'P')[0],{fontFamily:'Nunito',fontSize:'22px',fontStyle:'900',color:'#fff'}).setOrigin(0.5).setDepth(31);
  }
  scene.add.text(64,172,PLAYER_NAME,{fontFamily:'Nunito',fontSize:'13px',fontStyle:'700',color:'#1A1A2E'}).setOrigin(0.5).setDepth(31);
  g.fillStyle(0xE8D5C4,1); g.fillRoundedRect(104,181,86,10,5);
  g.fillStyle(SHELL.primary,1); g.fillRoundedRect(104,181,86,10,5);
  // Opponent right
  g.fillStyle(0x9B7DB8,1); g.fillCircle(W-64,132,34);
  g.lineStyle(3,0x6E4F8A,1); g.strokeCircle(W-64,132,34);
  if (scene.textures.exists('opponentPortrait')) {
    const mg2=scene.add.graphics().setDepth(30); mg2.fillCircle(W-64,132,32);
    scene.add.image(W-64,132,'opponentPortrait').setDisplaySize(64,64).setDepth(30).setMask(mg2.createGeometryMask());
  } else {
    scene.add.text(W-64,132,(OPPONENT_NAME||'B')[0],{fontFamily:'Nunito',fontSize:'22px',fontStyle:'900',color:'#fff'}).setOrigin(0.5).setDepth(31);
  }
  scene.add.text(W-64,172,OPPONENT_NAME,{fontFamily:'Nunito',fontSize:'13px',fontStyle:'700',color:'#1A1A2E'}).setOrigin(0.5).setDepth(31);
  g.fillStyle(0xE8D5C4,1); g.fillRoundedRect(W-190,181,86,10,5);
  g.fillStyle(0x9B7DB8,1); g.fillRoundedRect(W-190,181,86,10,5);
}

function drawDialogueBubble(scene, text) {
  const g = scene.add.graphics().setDepth(29);
  g.fillStyle(SHELL.white,1); g.fillRoundedRect(12,200,369,64,12);
  g.lineStyle(1.5,SHELL.primary,0.35); g.strokeRoundedRect(12,200,369,64,12);
  const t = scene.add.text(W/2,232,text||'',{
    fontFamily:'Patrick Hand',fontSize:'15px',color:'#1A1A2E',align:'center',wordWrap:{width:330}
  }).setOrigin(0.5).setDepth(30);
  return t;
}

function makeGhostButton(scene, { x, y, w, h, label, onTap }) {
  const bh=h||54, r=bh/2;
  const c=scene.add.container(x,y).setDepth(20);
  const bg=scene.add.graphics();
  bg.fillStyle(SHELL.white,1); bg.fillRoundedRect(-w/2,-bh/2,w,bh,r);
  bg.lineStyle(2,SHELL.primary,1); bg.strokeRoundedRect(-w/2,-bh/2,w,bh,r);
  c.add(bg);
  c.add(scene.add.text(0,0,label,{fontFamily:'Nunito',fontSize:'17px',fontStyle:'900',color:SHELL.primaryHex,letterSpacing:1}).setOrigin(0.5));
  const hit=scene.add.rectangle(0,0,w,bh).setOrigin(0.5).setInteractive({useHandCursor:true}).setAlpha(0.001);
  c.add(hit);
  hit.on('pointerdown',()=>{c.setScale(0.96);audio.tap();});
  hit.on('pointerup',()=>{c.setScale(1);if(onTap)onTap();});
  hit.on('pointerout',()=>{c.setScale(1);});
  return c;
}

function drawStarRow(scene, cx, y, filledCount, depth) {
  const g=scene.add.graphics().setDepth(depth||20);
  for(let i=0;i<5;i++){
    const x=cx+(i-2)*30, fill=i<filledCount;
    g.fillStyle(fill?0xF5C842:0xDDD5CC,1); g.fillCircle(x,y,11);
    if(fill){g.lineStyle(2,0xD4A520,1);g.strokeCircle(x,y,11);}
  }
}
\`\`\`

## Changes Required

### BootScene
REPLACE the entire BootScene.create() with:
1. Add preload() to load portrait textures (PLAYER_PORTRAIT / OPPONENT_PORTRAIT URLs)
2. In create(): call drawEpisodeTitleBar, drawVSHeader, drawDialogueBubble(DIALOGUE_TEXT)
3. Draw a cue circle at center (y≈424) showing "NEXT ACTION ???"
4. Keep existing audio.unlock() + scene.start('GameScene') logic
5. START button at y=628
6. UNLOCK S TIER ghost button at y=696: notifyGameComplete({ intent:'unlockSTier', cost:UNLOCK_S_COST, attribute:ATTRIBUTE })

### GameScene
1. Call drawEpisodeTitleBar, drawVSHeader, drawDialogueBubble at start of create()
2. Remove old VS header code (simple letter circles at y≈40, HP bars at y≈78, score pills, timer pills, title texts)
3. Remove or relocate timer bar: if timer bar was at y=0, move to y=CONTENT_TOP (268)
4. Shift all remaining game content Y values by approximately +100px (since old header was ~170px, new header is 268px, delta ≈ +100)
5. Keep ALL game mechanics (update loop, scoring, timing, attacks, etc.) unchanged
6. Score display: place "SCORE" label + value text below the cue circle

### ResultScene
REPLACE the entire ResultScene.create() with:
1. drawDotPattern, drawEpisodeTitleBar, drawVSHeader (no dialogue bubble on result)
2. Grade circle at y=400, r=100: track fill + ring stroke + "YOUR GRADE" label + rating letter
3. Grade letter color: S=#F5C842, A=PALETTE.primary, B=PALETTE.secondary, C=PALETTE.textMuted
4. Grade letter reveals with scale tween 0.5→1.0, Back.easeOut, 400ms
5. drawStarRow at y=510: STAR_COUNT={S:5,A:4,B:3,C:2}
6. Score text at y=542
7. CONTINUE button at y=626: fires notifyGameComplete with rating/score/attribute/modifier
8. REPLAY ghost button at y=696: notifyGameComplete({ intent:'replay', cost:REPLAY_COST, attribute:ATTRIBUTE })

## Critical Rules
- Do NOT change game mechanics (update(), scoring, attack patterns, timing windows, etc.)
- Do NOT remove MoonAudio, PALETTE, CANDY, makeButton, drawRRect, spawnParticles, showToast, etc.
- Do NOT add new game mechanics or features
- Keep W=393, H=736
- All shell graphics must have depth ≥ 28
- Game content graphics must have depth ≤ 27
- Output ONLY the complete HTML file. No markdown, no explanation.
- Where you see /* === ... KEEP UNCHANGED === */ placeholders, you MUST restore the full original code from the existing HTML in that location. Those placeholders were only for brevity in this prompt.

## Components Reference (code snippets)
${designSystem}
`;

  const userMessage = `Game: ${gameId}

Existing HTML (trimmed — restore sections marked KEEP UNCHANGED from the original):
${existingHtml}

Apply the shell design. Return the complete updated HTML (with all KEEP UNCHANGED sections fully restored).`;

  return { systemPrompt, userMessage };
}

// ─── Extract clean HTML from response ─────────────────────────────────────────

function extractHtml(raw) {
  if (!raw) return null;
  let html = raw.trim();
  // Strip markdown fences
  html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
  const start = html.indexOf('<!DOCTYPE');
  if (start > 0) html = html.slice(start);
  if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) return null;
  return html;
}

// ─── Restore omitted sections from original HTML ─────────────────────────────

function restoreOmittedSections(generatedHtml, originalHtml) {
  let result = generatedHtml;

  // Restore MoonAudio class if placeholder left
  const moonPlaceholder = /\/\*\s*===\s*MoonAudio class.*?===\s*\*\//;
  if (moonPlaceholder.test(result)) {
    const moonMatch = originalHtml.match(/(class MoonAudio \{[\s\S]*?stopAll\(\)\s*\{[^}]*\}\s*\})/);
    if (moonMatch) {
      result = result.replace(moonPlaceholder, moonMatch[1]);
      console.log('[RESTORE] MoonAudio class restored');
    }
  }

  // Restore shared helpers if placeholder left
  const helpersPlaceholder = /\/\*\s*===\s*Shared helpers.*?===\s*\*\//;
  if (helpersPlaceholder.test(result)) {
    const helpersMatch = originalHtml.match(/(function hexToRgb[\s\S]*?function drawDotPattern[\s\S]*?\n\})/);
    if (helpersMatch) {
      result = result.replace(helpersPlaceholder, helpersMatch[1]);
      console.log('[RESTORE] Shared helpers restored');
    }
  }

  return result;
}

// ─── Process one game ─────────────────────────────────────────────────────────

async function processGame(gameId, designSystem) {
  const htmlPath = path.join(GAMES_DIR, gameId, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`[SKIP] ${gameId}: index.html not found at ${htmlPath}`);
    return false;
  }

  const existingHtml = fs.readFileSync(htmlPath, 'utf8');
  const trimmedHtml  = trimGameHtml(existingHtml);
  console.log(`\n[${gameId}] HTML size: ${Math.round(existingHtml.length / 1024)} KB (trimmed: ${Math.round(trimmedHtml.length / 1024)} KB)`);

  const { systemPrompt, userMessage } = buildPrompt(gameId, trimmedHtml, designSystem);

  if (DRY_RUN) {
    const totalChars = systemPrompt.length + userMessage.length;
    const estTokens  = Math.round(totalChars / 3.5);
    console.log(`\n[DRY RUN] ${gameId}`);
    console.log(`  System prompt: ${Math.round(systemPrompt.length/1024)} KB`);
    console.log(`  User message:  ${Math.round(userMessage.length/1024)} KB`);
    console.log(`  Total chars:   ${totalChars} (~${estTokens} tokens)`);
    return true;
  }

  console.log(`[${gameId}] Calling Gemini 3.1 Pro (timeout: ${TIMEOUT_MS/60000} min)...`);

  const rawText = await zenmuxStream(API_KEY, {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.3,   // low temp — we want precise code edits, not creativity
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
  }, TIMEOUT_MS);

  let html = extractHtml(rawText);

  // Restore omitted sections if Gemini left placeholders
  if (html) {
    html = restoreOmittedSections(html, existingHtml);
  }

  if (!html) {
    console.error(`[${gameId}] ERROR: Response was not valid HTML. Raw (first 300 chars):`);
    console.error((rawText || '(empty)').slice(0, 300));
    // Save raw for debugging
    const debugPath = path.join(GAMES_DIR, gameId, 'index.html.debug');
    if (rawText) fs.writeFileSync(debugPath, rawText, 'utf8');
    return false;
  }

  // Backup original
  const backupPath = path.join(GAMES_DIR, gameId, 'index.html.bak');
  fs.writeFileSync(backupPath, existingHtml, 'utf8');

  // Write updated HTML
  fs.writeFileSync(htmlPath, html, 'utf8');

  console.log(`[${gameId}] ✓ Updated (${Math.round(html.length/1024)} KB). Backup at index.html.bak`);
  return true;
}

// ─── Concurrency pool ─────────────────────────────────────────────────────────

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let i = 0;

  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: limit }, worker);
  await Promise.all(workers);
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!DRY_RUN && !API_KEY) {
    console.error('[ERROR] ZENMUX_API_KEY not set. Export it first:');
    console.error('  export ZENMUX_API_KEY=sk-...');
    process.exit(1);
  }

  const games = gameArg ? [gameArg] : ALL_GAMES;

  // Validate game IDs
  for (const g of games) {
    if (!fs.existsSync(path.join(GAMES_DIR, g))) {
      console.error(`[ERROR] Game not found: ${g}`);
      console.error(`Available: ${ALL_GAMES.join(', ')}`);
      process.exit(1);
    }
  }

  console.log('='.repeat(60));
  console.log('  Attribute Archetypes Shell Updater — Gemini 3.1 Pro');
  console.log('='.repeat(60));
  console.log(`Games     : ${games.join(', ')}`);
  console.log(`Model     : ${MODEL}`);
  console.log(`Max tokens: ${MAX_TOKENS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Dry run   : ${DRY_RUN}`);
  console.log('');

  const designSystem = loadDesignSystem();
  console.log(`Design system loaded: ${Math.round(designSystem.length / 1024)} KB`);

  const tasks = games.map(gameId => () => processGame(gameId, designSystem));

  const results = await runWithConcurrency(tasks, CONCURRENCY);

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  console.log('\n' + '='.repeat(60));
  console.log(`Done: ${passed} updated, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
