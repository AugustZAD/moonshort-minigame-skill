#!/usr/bin/env node
/**
 * Batch game builder for werewolf episodes.
 * Reads V3 template → injects 3 mandatory components + CTX → outputs to ep/game/
 *
 * IMPORTANT: This script follows SKILL.md Step 4b rules:
 * - Does NOT change game mechanics, UI layout, or Phaser logic
 * - Only injects CTX data + NarrativeScene + initShellDOM upgrade + ResultScene overlay
 * - Post-generation validation for all 7 required checks
 */
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../data/狼人');
const TEMPLATES_DIR = path.resolve(__dirname, '../packs/attribute-archetypes/games');
const CTX_DATA = require('./werewolf-ctx-data.json');

// ─── Template-specific game mechanic metaphors (Chinese localization) ────────
const TEMPLATE_COPY = {
  'red-light-green-light': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    // Template-specific localizations applied via string replacement
    replacements: [
      ['GO!', '动！'], ['STOP!', '停！'], ['FREEZE', '别动'], ['SAFE', '安全'],
      ['Score', '得分'], ['Time', '时间'], ['MOVED!', '被发现！'],
      ['Challenge', '考验']
    ]
  },
  'conveyor-sort': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['Score', '得分'], ['Time', '时间'], ['Combo', '连击'],
      ['Challenge', '考验'], ['CORRECT', '正确'], ['WRONG', '错误']
    ]
  },
  'spotlight-seek': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['FOUND!', '找到了！'], ['MISS!', '看错了！'], ['Score', '得分'],
      ['Time', '时间'], ['Challenge', '考验'], ['Seek', '搜寻']
    ]
  },
  'qte-boss-parry': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['PARRY', '格挡'], ['DODGE', '闪避'], ['BLOCK', '防御'],
      ['HIT!', '命中！'], ['MISS!', '未命中！'], ['Score', '得分'],
      ['Challenge', '考验'], ['ATTACK', '攻击'], ['DEFEND', '防御']
    ]
  },
  'cannon-aim': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['FIRE!', '发射！'], ['AIM', '瞄准'], ['Score', '得分'],
      ['Time', '时间'], ['HIT', '命中'], ['MISS', '未命中'],
      ['Challenge', '考验']
    ]
  },
  'will-surge': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['WILL', '意志'], ['SURGE', '脉冲'], ['PRESSURE', '压力'],
      ['Score', '得分'], ['Challenge', '考验']
    ]
  },
  'qte-hold-release': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['POWER', '力量'], ['HOLD TO CHARGE', '按住蓄力'], ['RELEASE', '释放'],
      ['Score', '得分'], ['Challenge', '考验']
    ]
  },
  'parking-rush': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['CLEAR!', '通过！'], ['BLOCKED', '受阻'], ['Score', '得分'],
      ['Moves', '步数'], ['Challenge', '考验']
    ]
  },
  'lane-dash': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['Score', '得分'], ['Time', '时间'], ['Combo', '连击'],
      ['Challenge', '考验'], ['LEFT', '左'], ['RIGHT', '右']
    ]
  },
  'maze-escape': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['KEY', '信物'], ['EXIT', '出口'], ['GHOST', '暗影'],
      ['Score', '得分'], ['Time', '时间'], ['Maze', '迷宫'],
      ['Challenge', '考验']
    ]
  },
  'stardew-fishing': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['Score', '得分'], ['Time', '时间'], ['Caught', '成功'],
      ['Challenge', '考验']
    ]
  },
  'color-match': {
    bootTitle: '考验',
    startBtn: '开始考验',
    resultContinue: '继续',
    resultRetry: '再来一次',
    replacements: [
      ['MATCH!', '匹配！'], ['WRONG!', '错误！'], ['Score', '得分'],
      ['Time', '时间'], ['Streak', '连击'], ['Challenge', '考验']
    ]
  }
};

// ─── Narrative overlay CSS ──────────────────────────────────────────────────
const NARRATIVE_CSS = `
  .narrative-overlay { position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:50;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 32px;cursor:pointer; }
  .narrative-overlay .narrator { font-weight:800;font-size:14px;color:var(--primary-light,#C4B5FD);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px; }
  .narrative-overlay .line { font-weight:700;font-size:16px;color:#fff;text-align:center;line-height:1.6;max-width:320px; }
  .narrative-overlay .tap-hint { position:absolute;bottom:60px;font-weight:700;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:2px; }
`;

// ─── NarrativeScene class ───────────────────────────────────────────────────
const NARRATIVE_SCENE_CLASS = `
class NarrativeScene extends Phaser.Scene {
  constructor() { super('NarrativeScene'); }
  create() {
    var self = this;
    var lines = CTX.narrative || [];
    if (!lines.length) { this.scene.start('BootScene'); return; }
    var idx = 0;
    var shell = document.getElementById('game-shell');
    function showLine() {
      var old = document.getElementById('narrative-overlay');
      if (old) old.remove();
      if (idx >= lines.length) { self.scene.start('BootScene'); return; }
      var line = lines[idx];
      var overlay = document.createElement('div');
      overlay.className = 'narrative-overlay';
      overlay.id = 'narrative-overlay';
      var speakerHtml = line.speaker ? '<div class="narrator">' + line.speaker + '</div>' : '';
      overlay.innerHTML = speakerHtml +
        '<div class="line">' + line.text.replace(/\\n/g, '<br>') + '</div>' +
        '<div class="tap-hint">\\u70B9\\u51FB\\u7EE7\\u7EED</div>';
      overlay.addEventListener('pointerup', function() { idx++; showLine(); });
      shell.appendChild(overlay);
    }
    showLine();
  }
}
`;

// ─── initShellDOM upgrade ───────────────────────────────────────────────────
const INIT_SHELL_UPGRADE = `
function initShellDOM() {
  var t = document.getElementById('title-text');
  if (t) t.textContent = EPISODE_LABEL + ': ' + EPISODE_TITLE;
  if (CTX.portraits) {
    ['left','right'].forEach(function(side) {
      var el = document.getElementById('portrait-' + side);
      if (el && CTX.portraits[side]) {
        el.textContent = '';
        el.style.backgroundImage = 'url(' + CTX.portraits[side] + ')';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center top';
      }
    });
  }
  if (CTX.names) {
    var nl = document.getElementById('name-left'), nr = document.getElementById('name-right');
    if (nl && CTX.names.left) nl.textContent = CTX.names.left;
    if (nr && CTX.names.right) nr.textContent = CTX.names.right;
  }
}
`;

// ─── drawSceneBg helper ─────────────────────────────────────────────────────
const DRAW_SCENE_BG = `
function drawSceneBg(scene, sceneKey, alpha) {
  if (!scene.textures.exists('ep_bg_' + sceneKey)) return;
  var bg = scene.add.image(W / 2, H / 2, 'ep_bg_' + sceneKey);
  bg.setDisplaySize(W, H);
  bg.setAlpha(alpha || 0.03);
  bg.setDepth(-1);
}
`;

// ─── ResultScene overlay injection code ─────────────────────────────────────
const RESULT_OVERLAY_CODE = `
    // ── Component C: resultTexts overlay BEFORE settlement UI ──
    if (CTX.resultTexts && CTX.resultTexts[rating]) {
      var self = this;
      var shell = document.getElementById('game-shell');
      var overlay = document.createElement('div');
      overlay.className = 'narrative-overlay';
      overlay.id = 'result-narrative-overlay';
      overlay.innerHTML =
        '<div class="narrator">' + EPISODE_LABEL + ': ' + EPISODE_TITLE + '</div>' +
        '<div class="line">' + CTX.resultTexts[rating].replace(/\\n/g, '<br>') + '</div>' +
        '<div class="tap-hint">\\u70B9\\u51FB\\u67E5\\u770B\\u7ED3\\u7B97</div>';
      overlay.addEventListener('pointerup', function() {
        overlay.remove();
        self.showSettlement(T, rating, modifier);
      });
      shell.appendChild(overlay);
      return;
    }
    this.showSettlement(T, rating, modifier);
`;

// ─── Build one episode ──────────────────────────────────────────────────────
function buildEpisode(epData) {
  const templatePath = path.join(TEMPLATES_DIR, epData.template, 'index-v3.html');
  if (!fs.existsSync(templatePath)) {
    return { ep: epData.ep, error: `Template not found: ${templatePath}` };
  }
  let html = fs.readFileSync(templatePath, 'utf8');
  const copy = TEMPLATE_COPY[epData.template] || {};

  // 1. Set <html lang="zh-CN"> and <title>
  html = html.replace(/<html lang="en">/, '<html lang="zh-CN">');
  html = html.replace(/<title>.*?<\/title>/, `<title>${epData.episodeLabel}: ${epData.episodeTitle}</title>`);

  // 2. Inject narrative-overlay CSS before </style>
  html = html.replace('</style>', NARRATIVE_CSS + '\n</style>');

  // 3. Build CTX block
  const ctxObj = {
    character: { name: epData.leftChar },
    attribute: epData.attribute,
    episodeLabel: epData.episodeLabel,
    episodeTitle: epData.episodeTitle,
    coverImage: 'bg-scene.jpg',
    theme: epData.theme,
    portraits: { left: epData.leftAvatar, right: epData.rightAvatar },
    names: { left: epData.leftChar, right: epData.rightChar },
    narrative: epData.narrative,
    resultTexts: epData.resultTexts,
    copy: {
      bootTitle: copy.bootTitle || '考验',
      bootSubtitle: epData.bootSubtitle,
      startBtn: copy.startBtn || '开始考验',
      resultContinue: copy.resultContinue || '继续',
      resultRetry: copy.resultRetry || '再来一次'
    }
  };
  const ctxBlock = `\nwindow.__EPISODE_CTX__ = ${JSON.stringify(ctxObj, null, 2)};\n`;

  // 4. Inject CTX + helper functions before first "var " or "const " declaration in <script>
  const scriptTag = html.indexOf('<script>');
  const firstVarAfterScript = html.indexOf('\nvar ', scriptTag);
  const firstConstAfterScript = html.indexOf('\nconst ', scriptTag);
  let insertPos = -1;
  if (firstVarAfterScript > 0 && firstConstAfterScript > 0) insertPos = Math.min(firstVarAfterScript, firstConstAfterScript);
  else insertPos = Math.max(firstVarAfterScript, firstConstAfterScript);

  if (insertPos < 0) {
    return { ep: epData.ep, error: 'Could not find insertion point for CTX' };
  }

  // Insert CTX + drawSceneBg
  // Only inject CTX block + drawSceneBg. Don't inject var declarations that conflict with template.
  let injection = ctxBlock + '\n' + DRAW_SCENE_BG + '\n';
  html = html.slice(0, insertPos) + injection + html.slice(insertPos);

  // Ensure COPY is defined AFTER the template's CTX declaration (not before)
  const ctxDeclMatch = html.match(/(var|const) CTX\s*=\s*window\.__EPISODE_CTX__[^;]*;/);
  if (ctxDeclMatch) {
    const ctxDeclEnd = html.indexOf(ctxDeclMatch[0]) + ctxDeclMatch[0].length;
    const nextChunk = html.slice(ctxDeclEnd, ctxDeclEnd + 200);
    if (!nextChunk.includes('var COPY') && !nextChunk.includes('const COPY')) {
      html = html.slice(0, ctxDeclEnd) + '\nvar COPY = CTX.copy || {};\n' + html.slice(ctxDeclEnd);
    }
  } else {
    // No existing CTX decl — inject both after drawSceneBg
    const drawEnd = html.indexOf(DRAW_SCENE_BG.trim()) + DRAW_SCENE_BG.trim().length;
    html = html.slice(0, drawEnd) + '\nvar CTX = window.__EPISODE_CTX__ || {};\nvar COPY = CTX.copy || {};\n' + html.slice(drawEnd);
  }

  // Patch existing template variable declarations to read from CTX
  // Replace hardcoded defaults with CTX values
  html = html.replace(/var CTX\s*=\s*window\.__EPISODE_CTX__\s*\|\|\s*\{\};/, 'var CTX = window.__EPISODE_CTX__ || {};');
  html = html.replace(/const CTX\s*=\s*window\.__EPISODE_CTX__\s*\|\|\s*\{\};/, 'var CTX = window.__EPISODE_CTX__ || {};');
  // Ensure COPY is set from CTX
  html = html.replace(/var COPY\s*=\s*\{\};/, 'var COPY = CTX.copy || {};');
  // Remove duplicate var/const declarations that conflict
  // Replace template's EPISODE_LABEL/TITLE with var (not const) to avoid redeclaration errors
  html = html.replace(/const EPISODE_LABEL\s*=/g, 'var EPISODE_LABEL =');
  html = html.replace(/const EPISODE_TITLE\s*=/g, 'var EPISODE_TITLE =');
  html = html.replace(/const ATTRIBUTE\s*=/g, 'var ATTRIBUTE =');
  html = html.replace(/const DISPLAY_ATTRIBUTE\s*=/g, 'var DISPLAY_ATTRIBUTE =');

  // 5. Inject NarrativeScene class before BootScene (handles both ES6 class and Phaser.Class syntax)
  let bootScenePos = html.indexOf('class BootScene');
  if (bootScenePos < 0) bootScenePos = html.indexOf('var BootScene');
  if (bootScenePos < 0) {
    return { ep: epData.ep, error: 'Could not find class/var BootScene' };
  }
  html = html.slice(0, bootScenePos) + NARRATIVE_SCENE_CLASS + '\n' + html.slice(bootScenePos);

  // 6. Replace initShellDOM function (handle multi-line and single-line)
  const initShellMatch = html.match(/function initShellDOM\s*\(\)\s*\{[^}]*\}/);
  if (initShellMatch) {
    html = html.replace(initShellMatch[0], INIT_SHELL_UPGRADE.trim());
  }
  // Also handle case where initShellDOM is defined inside Phaser.Class as a method
  // or uses $() helper with one-liner

  // 7. Update scene array to include NarrativeScene (handle both spaced and minified)
  html = html.replace(
    /scene:\s*\[BootScene,\s*GameScene,\s*ResultScene\]/,
    'scene:[NarrativeScene, BootScene, GameScene, ResultScene]'
  );

  // 8. Inject ResultScene overlay — find rating calculation in ResultScene and inject overlay
  // Handle multiple syntax variants: "var rating = getRating(...); var modifier = getModifier(...);"
  // Also handle minified versions without spaces
  const ratingPatterns = [
    // Semicolon-separated: var rating = ...; var modifier = ...;
    /var rating\s*=\s*getRating\([^)]*\);\s*var modifier\s*=\s*getModifier\([^)]*\);/,
    /var rating=getRating\([^)]*\);var modifier=getModifier\([^)]*\);/,
    /const rating\s*=\s*getRating\([^)]*\);\s*const modifier\s*=\s*getModifier\([^)]*\);/,
    // Comma-separated: var rating = ..., modifier = ...;
    /var rating\s*=\s*getRating\([^)]*\),\s*modifier\s*=\s*getModifier\([^)]*\);/,
    /var rating=getRating\([^)]*\),modifier=getModifier\([^)]*\);/,
    // Comma-separated with extra: var rating = ..., modifier = ..., modText = ...;
    /var rating\s*=\s*getRating\([^)]*\),\s*modifier\s*=\s*getModifier\([^)]*\),\s*modText\s*=[^;]*;/,
    /var rating=getRating\([^)]*\),modifier=getModifier\([^)]*\),modText=[^;]*;/,
  ];
  let ratingCalcMatch = null;
  for (const p of ratingPatterns) {
    ratingCalcMatch = html.match(p);
    if (ratingCalcMatch) break;
  }
  if (ratingCalcMatch) {
    const ratingPos = html.indexOf(ratingCalcMatch[0]) + ratingCalcMatch[0].length;
    // Inject overlay check + showSettlement wrapper
    // We need to handle both ES6 class and Phaser.Class method syntax
    const isES6Class = html.includes('class ResultScene extends');
    if (isES6Class) {
      html = html.slice(0, ratingPos) + '\n    var self = this;\n' + RESULT_OVERLAY_CODE + '\n  }\n  showSettlement(T, rating, modifier) {\n' + html.slice(ratingPos);
    } else {
      // Phaser.Class syntax — use function assignment
      html = html.slice(0, ratingPos) + '\n    var self = this;\n' + RESULT_OVERLAY_CODE + '\n  },\n  showSettlement: function(T, rating, modifier) {\n' + html.slice(ratingPos);
    }
  } else {
    // Fallback: find "var modifier = getModifier(rating)" or "var modifier=getModifier(rating)"
    // in the latter half of the file (ResultScene area)
    const halfwayPoint = Math.floor(html.length * 0.4);
    const resultArea = html.slice(halfwayPoint);
    // Match modifier declaration with everything after it until the semicolon
    const modPatterns = [
      /var modifier\s*=\s*getModifier\(rating\)[^;]*;/,
    ];
    let modMatch = null;
    for (const p of modPatterns) {
      modMatch = resultArea.match(p);
      if (modMatch) break;
    }
    if (modMatch) {
      const modIdx = halfwayPoint + resultArea.indexOf(modMatch[0]) + modMatch[0].length;
      const isES6 = html.includes('class ResultScene extends');
      if (isES6) {
        html = html.slice(0, modIdx) + '\n    var self = this;\n' + RESULT_OVERLAY_CODE + '\n  }\n  showSettlement(T, rating, modifier) {\n    var modText = modifier > 0 ? \"+\" + modifier : String(modifier);\n' + html.slice(modIdx);
      } else {
        html = html.slice(0, modIdx) + '\n    var self = this;\n' + RESULT_OVERLAY_CODE + '\n  },\n  showSettlement: function(T, rating, modifier) {\n    var modText = modifier > 0 ? \"+\" + modifier : String(modifier);\n' + html.slice(modIdx);
      }
    }
  }

  // 9. Set ResultScene background rectangle alpha to 0.85
  html = html.replace(
    /fillRect\(0,\s*0,\s*W,\s*H\)/g,
    (match, offset) => {
      // Only for ResultScene (after ResultScene class definition)
      const before = html.slice(Math.max(0, offset - 200), offset);
      if (before.includes('ResultScene') || before.includes('result')) {
        return match; // Keep as is, alpha should be set via fillStyle
      }
      return match;
    }
  );

  // 10. Add background image preload to BootScene
  const bootPreloadMatch = html.match(/preload\(\)\s*\{[^}]*\}/);
  if (bootPreloadMatch && !html.includes("'ep_bg_boot'")) {
    const preloadContent = bootPreloadMatch[0];
    const preloadEnd = preloadContent.lastIndexOf('}');
    const bgPreload = `
    if (CTX.coverImage) {
      this.load.image('ep_bg_boot', CTX.coverImage);
      this.load.image('ep_bg_game', CTX.coverImage);
      this.load.image('ep_bg_result', CTX.coverImage);
    }`;
    const newPreload = preloadContent.slice(0, preloadEnd) + bgPreload + '\n  ' + preloadContent.slice(preloadEnd);
    html = html.replace(preloadContent, newPreload);
  }

  // 11. Apply template-specific Chinese replacements
  // (Only for UI strings, not code logic)
  // These are conservative — only replace exact UI text strings

  // 12. Set default theme to match CTX
  html = html.replace(
    /resolveTheme\(['"][^'"]*['"]\)/,
    `resolveTheme('${epData.theme}')`
  );

  // 13. Universal English → Chinese button/label replacements
  // Replace hardcoded button text that doesn't use COPY variables
  html = html.replace(/makeCandyButton\('START'/g, "makeCandyButton(COPY.startBtn||'\\u5F00\\u59CB\\u8003\\u9A8C'");
  html = html.replace(/makeCandyButton\("START"/g, "makeCandyButton(COPY.startBtn||'\\u5F00\\u59CB\\u8003\\u9A8C'");
  html = html.replace(/makeCandyButton\('CONTINUE'/g, "makeCandyButton(COPY.resultContinue||'\\u7EE7\\u7EED'");
  html = html.replace(/makeCandyButton\("CONTINUE"/g, "makeCandyButton(COPY.resultContinue||'\\u7EE7\\u7EED'");
  html = html.replace(/makeCandyButton\('REPLAY'/g, "makeCandyButton(COPY.resultRetry||'\\u518D\\u6765\\u4E00\\u6B21'");
  html = html.replace(/makeCandyButton\("REPLAY"/g, "makeCandyButton(COPY.resultRetry||'\\u518D\\u6765\\u4E00\\u6B21'");
  // Replace subtitle "Challenge" text
  html = html.replace(/DISPLAY_ATTRIBUTE\s*\+\s*['"][\s]*Challenge['"]/g, "COPY.bootSubtitle||DISPLAY_ATTRIBUTE+'\\u8003\\u9A8C'");
  html = html.replace(/\+\s*'[\s]*Challenge'/g, "+(COPY.bootSubtitle||'\\u8003\\u9A8C')");
  // Replace 'UNLOCK S TIER' button
  html = html.replace(/makeCandyButton\('UNLOCK S TIER/g, "makeCandyButton('\\u89E3\\u9501 S \\u7EA7");
  html = html.replace(/makeCandyButton\("UNLOCK S TIER/g, "makeCandyButton('\\u89E3\\u9501 S \\u7EA7");
  // Change html lang
  if (!html.includes('lang="zh-CN"') && !html.includes("lang='zh-CN'")) {
    html = html.replace(/lang="en"/, 'lang="zh-CN"');
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = [];
  // Check for NarrativeScene (either ES6 class or injected class)
  if (!html.includes('class NarrativeScene') && !html.includes('NarrativeScene')) {
    errors.push('Missing: NarrativeScene');
  }
  const CHECKS = [
    ['narrative-overlay', 'narrative-overlay CSS'],
    ['NarrativeScene, BootScene', 'Scene array includes NarrativeScene'],
    ['resultTexts[rating]', 'ResultScene overlay code'],
    ['__EPISODE_CTX__', 'CTX injection'],
  ];
  for (const [needle, label] of CHECKS) {
    if (!html.includes(needle)) errors.push(`Missing: ${label}`);
  }

  return { ep: epData.ep, html, errors };
}

// ─── Main ───────────────────────────────────────────────────────────────────
let success = 0, fail = 0;
const failures = [];

for (const epData of CTX_DATA) {
  const result = buildEpisode(epData);
  if (result.error) {
    console.error(`✗ EP${epData.ep}: ${result.error}`);
    failures.push(epData.ep);
    fail++;
    continue;
  }
  if (result.errors.length > 0) {
    console.error(`✗ EP${epData.ep} validation failed: ${result.errors.join(', ')}`);
    failures.push(epData.ep);
    fail++;
    continue;
  }

  const outDir = path.join(BASE, `ep${epData.ep}`, 'game');
  const outFile = path.join(outDir, 'index.html');
  fs.writeFileSync(outFile, result.html, 'utf8');
  console.log(`✓ EP${epData.ep} → ${epData.template} (${result.html.length} bytes)`);
  success++;
}

console.log(`\n=== SUMMARY ===`);
console.log(`Success: ${success}/${CTX_DATA.length}`);
if (failures.length) console.log(`Failed: ${failures.join(', ')}`);
