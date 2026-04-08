#!/usr/bin/env node
/**
 * Batch Generate Wolven (狼人) Episode Games
 *
 * Reads CTX backup, copies v3 templates, injects 3 deep-customization components:
 *   A) NarrativeScene (opening dialogue)
 *   B) Upgraded initShellDOM (portraits + names)
 *   C) ResultScene narrative overlay (rating-based epilogue via monkey-patch)
 *
 * Usage: node scripts/batch-generate-wolven.js
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'data', '狼人');
const TEMPLATES_DIR = path.join(__dirname, '..', 'packs', 'attribute-archetypes', 'games');
const CTX_BACKUP = path.join(BASE, '_ctx_backup.json');

const allCtx = JSON.parse(fs.readFileSync(CTX_BACKUP, 'utf-8'));

const TEMPLATE_MAP = {
  ep1: 'qte-hold-release',
  ep2: 'red-light-green-light',
  ep3: 'conveyor-sort',
  ep4: 'spotlight-seek',
  ep5: 'will-surge',
  ep6: 'qte-boss-parry',
  ep7: 'cannon-aim',
  ep8: 'stardew-fishing',
  ep9: 'will-surge',
  ep10: 'qte-hold-release',
  ep11: 'parking-rush',
  ep12: 'lane-dash',
  ep12_minor: 'red-light-green-light',
  ep13: 'maze-escape',
  ep13_minor: 'conveyor-sort',
  ep14: 'lane-dash',
  ep15: 'stardew-fishing',
  ep16: 'color-match',
  ep17: 'spotlight-seek',
  ep18: 'cannon-aim',
  ep19: 'qte-boss-parry',
  ep20: 'maze-escape',
};

// ── Narrative overlay CSS ───────────────────────────────────────────────────
const NARRATIVE_CSS = `
  .narrative-overlay { position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:50;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 32px;cursor:pointer; }
  .narrative-overlay .narrator { font-weight:800;font-size:14px;color:var(--primary-light,#C4B5FD);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px; }
  .narrative-overlay .line { font-weight:700;font-size:16px;color:#fff;text-align:center;line-height:1.6;max-width:320px; }
  .narrative-overlay .tap-hint { position:absolute;bottom:60px;font-weight:700;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:2px; }`;

// ── Component A: NarrativeScene class ───────────────────────────────────────
const NARRATIVE_SCENE_CLASS = `
// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT A: NARRATIVE SCENE
// ══════════════════════════════════════════════════════════════════════════════
class NarrativeScene extends Phaser.Scene {
  constructor() { super('NarrativeScene'); }
  preload() {
    if (CTX.coverImage) {
      this.load.image('ep_bg_narrative', CTX.coverImage);
    }
  }
  create() {
    var self = this;
    var lines = CTX.narrative || [];
    if (!lines.length) { this.scene.start('BootScene'); return; }
    var idx = 0;
    var shell = document.getElementById('game-shell');

    // Shell UI stays visible behind overlay

    function showLine() {
      var old = document.getElementById('narrative-overlay');
      if (old) old.remove();
      if (idx >= lines.length) {
        self.scene.start('BootScene');
        return;
      }
      var line = lines[idx];
      var overlay = document.createElement('div');
      overlay.className = 'narrative-overlay';
      overlay.id = 'narrative-overlay';
      var speakerHtml = line.speaker ? '<div class="narrator">' + line.speaker + '</div>' : '';
      overlay.innerHTML = speakerHtml +
        '<div class="line">' + line.text.replace(/\\n/g, '<br>') + '</div>' +
        '<div class="tap-hint">点击继续</div>';
      overlay.addEventListener('pointerup', function() { idx++; showLine(); });
      shell.appendChild(overlay);
    }

    // Draw background image in Phaser canvas for narrative
    var T = window.__V3_THEME__;
    if (T) {
      this.add.rectangle(W/2, H/2, W, H, parseInt((T.bg||'#000000').replace('#',''),16), 1).setDepth(0);
    }
    if (this.textures.exists('ep_bg_narrative')) {
      var bg = this.add.image(W/2, H/2, 'ep_bg_narrative');
      bg.setDisplaySize(W, H);
      bg.setAlpha(0.12);
      bg.setDepth(1);
    }

    showLine();
  }
}`;

// ── Component B: Upgraded initShellDOM ──────────────────────────────────────
const UPGRADED_INIT_SHELL = `function initShellDOM() {
  $('title-text').textContent = EPISODE_LABEL + ': ' + EPISODE_TITLE;
  if (CTX.portraits) {
    ['left','right'].forEach(function(side) {
      var el = $('portrait-' + side);
      if (el && CTX.portraits[side]) {
        el.textContent = '';
        el.style.backgroundImage = 'url(' + CTX.portraits[side] + ')';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center top';
      }
    });
  }
  if (CTX.names) {
    var nl = $('name-left'), nr = $('name-right');
    if (nl && CTX.names.left) nl.textContent = CTX.names.left;
    if (nr && CTX.names.right) nr.textContent = CTX.names.right;
  }
}`;

// ── Component C: Monkey-patch ResultScene.create for narrative overlay ──────
// This is injected right before </script> — works with both class-based and
// Phaser.Class-based ResultScene definitions.
const RESULT_OVERLAY_PATCH = `
// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT C: ResultScene narrative overlay (monkey-patch)
// ══════════════════════════════════════════════════════════════════════════════
(function() {
  var proto = ResultScene.prototype || ResultScene;
  var origCreate = proto.create;
  proto.create = function() {
    var self = this;
    var rating = getRating(this.finalScore || 0);
    if (CTX.resultTexts && CTX.resultTexts[rating]) {
      // Hide all UI first
      ['dialogue','score-display','timer-text','combo-text','hint-text',
       'stars-row','result-info','gauge-area','boot-card','hud-row',
       'sort-legend','btn-area'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      var shell = document.getElementById('game-shell');
      var ov = document.createElement('div');
      ov.className = 'narrative-overlay';
      ov.id = 'narrative-overlay';
      ov.innerHTML =
        '<div class="narrator">' + rating + ' 级评价</div>' +
        '<div class="line">' + CTX.resultTexts[rating].replace(/\\n/g, '<br>') + '</div>' +
        '<div class="tap-hint">点击继续</div>';
      ov.addEventListener('pointerup', function() {
        ov.style.opacity = '0';
        ov.style.transition = 'opacity 0.4s';
        setTimeout(function() {
          ov.remove();
          // Restore display defaults
          ['dialogue','score-display','timer-text','combo-text','hint-text',
           'stars-row','result-info','gauge-area','boot-card','hud-row',
           'sort-legend','btn-area'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.display = '';
          });
          origCreate.call(self);
        }, 400);
      });
      shell.appendChild(ov);
      return;
    }
    origCreate.call(self);
  };
})();`;

// ── drawSceneBg helper ──────────────────────────────────────────────────────
const DRAW_SCENE_BG = `
function drawSceneBg(scene, sceneKey, alpha) {
  if (!scene.textures.exists('ep_bg_' + sceneKey)) return;
  var bg = scene.add.image(W/2, H/2, 'ep_bg_' + sceneKey);
  bg.setDisplaySize(W, H);
  bg.setAlpha(alpha || 0.03);
  bg.setDepth(-1);
}`;

// ── BootScene preload + background patch ────────────────────────────────────
// V3 templates have NO preload() in BootScene, so coverImage never loads as
// a Phaser texture. This monkey-patch adds preload + draws bg in canvas.
const BOOT_BG_PATCH = `
// ══════════════════════════════════════════════════════════════════════════════
//  BOOT SCENE BG PATCH: preload coverImage + draw in canvas
// ══════════════════════════════════════════════════════════════════════════════
(function() {
  var proto = BootScene.prototype || BootScene;
  // Add preload to load coverImage as Phaser texture
  var origPreload = proto.preload;
  proto.preload = function() {
    if (origPreload) origPreload.call(this);
    if (CTX.coverImage) {
      this.load.image('ep_bg_boot', CTX.coverImage);
      this.load.image('ep_bg_game', CTX.coverImage);
    }
  };
  // Wrap create to draw bg image after the solid fillRect
  var origBootCreate = proto.create;
  proto.create = function() {
    origBootCreate.call(this);
    // Draw bg image on top of the solid bg, with visible opacity
    if (this.textures.exists('ep_bg_boot')) {
      var bg = this.add.image(W/2, H/2, 'ep_bg_boot');
      bg.setDisplaySize(W, H);
      bg.setAlpha(0.15);
      bg.setDepth(0);
    }
  };
})();`;

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

let successCount = 0;
let errorCount = 0;
const errors = [];

// Print template allocation table first
console.log('═══ TEMPLATE ALLOCATION ═══');
const templateCounts = {};
const epOrder = Object.keys(TEMPLATE_MAP).sort((a, b) => {
  const na = parseInt(a.replace(/\D/g, ''));
  const nb = parseInt(b.replace(/\D/g, ''));
  return na - nb || a.localeCompare(b);
});
for (const ep of epOrder) {
  const t = TEMPLATE_MAP[ep];
  templateCounts[t] = (templateCounts[t] || 0) + 1;
  console.log(`  ${ep.padEnd(12)} → ${t}`);
}
console.log('\nTemplate usage:');
for (const [t, c] of Object.entries(templateCounts).sort((a, b) => b[1] - a[1])) {
  const warn = c > 3 ? ' ⚠️ OVER LIMIT' : '';
  console.log(`  ${t.padEnd(25)} × ${c}${warn}`);
}
console.log(`  Unique templates: ${Object.keys(templateCounts).length}/12`);

// Check adjacent eps don't repeat
let adjacentOk = true;
for (let i = 1; i < epOrder.length; i++) {
  if (TEMPLATE_MAP[epOrder[i]] === TEMPLATE_MAP[epOrder[i - 1]]) {
    console.log(`⚠️ Adjacent repeat: ${epOrder[i - 1]} and ${epOrder[i]} both use ${TEMPLATE_MAP[epOrder[i]]}`);
    adjacentOk = false;
  }
}
if (adjacentOk) console.log('✅ No adjacent template repeats');
console.log('');

// Generate all episodes
for (const ep of epOrder) {
  try {
    generateGame(ep, TEMPLATE_MAP[ep]);
    successCount++;
  } catch (e) {
    errorCount++;
    errors.push(`${ep}: ${e.message}`);
    console.error(`❌ ${ep}: ${e.message}`);
  }
}

console.log(`\n═══ RESULTS ═══`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
if (errors.length) {
  console.log('\nErrors:');
  errors.forEach(e => console.log('  ' + e));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  generateGame
// ═══════════════════════════════════════════════════════════════════════════════

function generateGame(ep, templateId) {
  const ctx = allCtx[ep];
  if (!ctx) throw new Error('No CTX data for ' + ep);

  const ctxClean = { ...ctx };
  delete ctxClean._template;
  delete ctxClean._htmlSize;
  delete ctxClean._raw;

  const templatePath = path.join(TEMPLATES_DIR, templateId, 'index-v3.html');
  if (!fs.existsSync(templatePath)) throw new Error('Template not found: ' + templatePath);

  let html = fs.readFileSync(templatePath, 'utf-8');

  // ── 1. Inject CTX block before main <script> ─────────────────────────────
  const ctxScript = `<script>\nwindow.__EPISODE_CTX__ = ${JSON.stringify(ctxClean, null, 2)};\n</script>\n`;
  // Insert before the first <script> that contains actual code (not just CTX)
  html = html.replace(/(<script>)/, ctxScript + '$1');

  // ── 2. Inject narrative-overlay CSS ───────────────────────────────────────
  html = html.replace('</style>', NARRATIVE_CSS + '\n</style>');

  // ── 3. Replace initShellDOM with upgraded version ─────────────────────────
  // Handle both formatted and minified patterns
  const initPatterns = [
    // Formatted: function initShellDOM() { ... multi-line ... }
    /function initShellDOM\(\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/,
    // Minified single-line
    /function initShellDOM\(\)\{[^}]*(?:\{[^}]*\})*[^}]*\}/,
  ];
  let replaced = false;
  for (const pat of initPatterns) {
    if (pat.test(html)) {
      html = html.replace(pat, UPGRADED_INIT_SHELL);
      replaced = true;
      break;
    }
  }
  if (!replaced) throw new Error('Cannot find initShellDOM in template');

  // ── 4. Inject NarrativeScene class before BootScene ───────────────────────
  // Try various patterns for BootScene definition
  const bootPatterns = [
    /(\/\/ ═+\n\/\/  BOOT SCENE)/,
    /(class BootScene)/,
    /(var BootScene\s*=)/,
  ];
  let injectedNarrative = false;
  for (const pat of bootPatterns) {
    if (pat.test(html)) {
      html = html.replace(pat, NARRATIVE_SCENE_CLASS + '\n\n$1');
      injectedNarrative = true;
      break;
    }
  }
  if (!injectedNarrative) throw new Error('Cannot find BootScene to inject NarrativeScene');

  // ── 5. Inject Component C: ResultScene overlay via monkey-patch ────────────
  // Insert before the closing </script> tag
  html = html.replace(/(fitShell\(\);\s*\n?)(<\/script>)/, '$1\n' + BOOT_BG_PATCH + '\n' + RESULT_OVERLAY_PATCH + '\n$2');
  // Fallback: if fitShell not found, insert before </script>
  if (!html.includes('COMPONENT C')) {
    html = html.replace(/(<\/script>\s*\n\s*<\/body>)/, BOOT_BG_PATCH + '\n' + RESULT_OVERLAY_PATCH + '\n$1');
  }

  // ── 6. Update scene array to include NarrativeScene ───────────────────────
  // Handle both formatted and minified patterns
  html = html.replace(
    /scene:\s*\[BootScene/,
    'scene: [NarrativeScene, BootScene'
  );
  // Handle minified: scene:[BootScene
  html = html.replace(
    /scene:\[BootScene/,
    'scene:[NarrativeScene,BootScene'
  );

  // ── 7. Chinese-ify buttons ────────────────────────────────────────────────
  html = html.replace(/makeCandyButton\('CONTINUE'/g, "makeCandyButton('继续'");
  html = html.replace(/makeCandyButton\("CONTINUE"/g, 'makeCandyButton("继续"');
  html = html.replace(/makeCandyButton\('REPLAY'/g, "makeCandyButton('再来一次'");
  html = html.replace(/makeCandyButton\("REPLAY"/g, 'makeCandyButton("再来一次"');
  html = html.replace(/makeCandyButton\('START'/g, "makeCandyButton('开始考验'");
  html = html.replace(/makeCandyButton\("START"/g, 'makeCandyButton("开始考验"');

  // ── 12. Story-bridge: replace BootScene dialogue + game rules with CTX copy ─
  const sub = (ctxClean.copy && ctxClean.copy.bootSubtitle) || '';
  if (sub) {
    // Replace BootScene dialogue textContent (varies per template)
    const BOOT_DIALOGUES = {
      'qte-hold-release': "Charge your attack. Release in the target zone!",
      'qte-boss-parry':   "Boss will attack with SLASH, HEAVY, or BURST.",
      'will-surge':       "Tap to push back the pressure wave! Survive surges and hold your ground.",
      'cannon-aim':       "Drag to aim, tap FIRE to shoot.",
      'stardew-fishing':  "Cast your line!",
      'conveyor-sort':    "Drag packages to matching bins!",
      'spotlight-seek':   "Tap the hidden tile!",
      'red-light-green-light': "READY...",
      'lane-dash':        "Swipe to dodge obstacles!",
      'maze-escape':      "Find the Key!",
      'parking-rush':     "Drag cars to clear the exit!",
      'color-match':      "Tap the correct match from the grid<br>",
    };
    const origDialogue = BOOT_DIALOGUES[templateId];
    if (origDialogue && html.includes(origDialogue)) {
      html = html.replace(origDialogue, sub);
    }
  }

  // Replace GAME RULE section per template with story-themed Chinese rules
  const GAME_RULES_CN = {
    'qte-hold-release': {
      title: '考验规则',
      rules: '长按蓄力，在目标区域松手<br>时机精准 = 高伤害<br>过早或过晚 = 失败',
    },
    'will-surge': {
      title: '考验规则',
      rules: '点击抵抗压力波<br>撑过每一波冲击<br>坚持到最后',
    },
    'qte-boss-parry': {
      title: '考验规则',
      rules: '判断对方攻击类型<br>选择正确的应对方式<br>精准反击得高分',
      extra: [
        ["Boss will attack with SLASH, HEAVY, or BURST.", sub],
        ["Counter with the right action!", "选择正确的应对！"],
      ],
    },
    'cannon-aim': {
      title: '考验规则',
      rules: '拖动瞄准，点击发射<br>小目标分数更高<br>连击加成',
    },
    'stardew-fishing': {
      title: '考验规则',
      rules: '追踪目标节奏<br>保持在绿色区域<br>稳住拉满进度',
      extra: [
        ["Cast your line!", sub],
        ["Track the fish!", "追踪节奏！"],
        ["Great catch!", "完美！"],
      ],
    },
    'conveyor-sort': {
      title: '考验规则',
      rules: '拖动到对应分类区<br>速度越来越快<br>小心干扰项',
    },
    'spotlight-seek': {
      title: '考验规则',
      rules: '记住目标位置<br>灯光熄灭后点击<br>越快越准分越高',
      extra: [
        ["Watch the spotlight...", "注意观察..."],
      ],
    },
    'red-light-green-light': {
      title: '考验规则',
      rules: '绿灯时前进<br>红灯时停下<br>被抓到就重来',
      extra: [
        ["STOP!", "停！"],
        ["GO!", "走！"],
      ],
    },
    'lane-dash': {
      title: '考验规则',
      rules: '左右滑动躲避障碍<br>收集加分项<br>连续躲避得连击',
    },
    'maze-escape': {
      title: '考验规则',
      rules: '找到钥匙，跑向出口<br>小心追兵<br>逃脱三次得S评价',
      extra: [
        ["Find the Key!", "找到钥匙！"],
        ["Got it! Run to Exit!", "拿到了！快跑向出口！"],
        ["Grab the key, reach the door, escape!<br>After 4s a 👻 ghost hunts you!<br>3 escapes = S rank. Caught = -5s + reset.", "找到钥匙，跑向出口，逃离！<br>4秒后 👻 追兵出现！<br>逃脱3次 = S级。被抓 = -5秒 + 重置"],
        ["Grab the key, reach the door, escape!", "找到钥匙，跑向出口，逃离！"],
      ],
    },
    'parking-rush': {
      title: '考验规则',
      rules: '拖动方块清出通道<br>在限时内完成<br>操作越少评分越高',
    },
    'color-match': {
      title: '考验规则',
      rules: '看文字内容，忽略颜色<br>点击匹配的选项<br>越快正确率越高',
      extra: [
        ["Tricky! Read the WORD, ignore the color!", "注意！看文字，忽略颜色！"],
        ["Tap the matching swatch", "点击匹配的色块"],
        ["Tap the correct color name", "点击正确的颜色名"],
      ],
    },
  };

  const rules = GAME_RULES_CN[templateId];
  if (rules) {
    // Replace GAME RULE title
    html = html.replace(/>GAME RULE</g, '>' + rules.title + '<');
    // Replace rule description lines (varies per template, try common patterns)
    const rulePatterns = [
      // Formatted multi-line in BootScene
      /Hold to charge power<br>Watch for target zone<br>Release at right moment!/,
      /Tap to resist.*?hold on until help arrives\./,
      /Hold to charge power\\nWatch for target zone\\nRelease at right moment!/,
      // Generic fallback: any 3-line rule block
    ];
    // Direct replacement of specific known patterns per template
    const RULE_TEXT_MAP = {
      'qte-hold-release': 'Hold to charge power<br>Watch for target zone<br>Release at right moment!',
      'will-surge': 'Tap to resist \\u2014 hold on until help arrives.',
      'cannon-aim': 'Big balloon: <b>2pt</b> (no combo)<br>Medium: <b>20pt</b> (builds combo)<br>Small gold (top): <b>50pt</b> (builds combo)',
      'qte-boss-parry': 'Choose PARRY, DODGE, or COUNTER<br>Match the attack type<br>Build combo for bonus!',
    };
    const origRuleText = RULE_TEXT_MAP[templateId];
    if (origRuleText && html.includes(origRuleText)) {
      html = html.replace(origRuleText, rules.rules);
    }

    // Apply extra text replacements
    if (rules.extra) {
      for (const [from, to] of rules.extra) {
        html = html.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      }
    }
  }

  // Replace Challenge suffix and game titles
  html = html.replace(/' Challenge'/g, "' 考验'");
  html = html.replace(/" Challenge"/g, '" 考验"');
  html = html.replace(/Challenge</g, '考验<');
  // Game title replacements
  const TITLE_CN = {
    'qte-hold-release': '蓄力释放', 'will-surge': '意志冲击', 'conveyor-sort': '传送分拣',
    'spotlight-seek': '聚光搜寻', 'cannon-aim': '精准射击', 'stardew-fishing': '心弦拉扯',
    'qte-boss-parry': '正面对决', 'red-light-green-light': '红绿抉择', 'lane-dash': '极速闪避',
    'maze-escape': '迷宫逃脱', 'parking-rush': '紧急调度', 'color-match': '颜色辨析',
  };
  const titleCn = TITLE_CN[templateId];
  const TITLE_EN = {
    'qte-hold-release': 'Hold Release', 'will-surge': 'Will Surge', 'conveyor-sort': 'Conveyor Sort',
    'spotlight-seek': 'Spotlight Seek', 'cannon-aim': 'Cannon Aim', 'stardew-fishing': 'Stardew Fishing',
    'qte-boss-parry': 'Boss Parry', 'red-light-green-light': 'Red Light Green Light',
    'lane-dash': 'Lane Dash', 'maze-escape': 'Maze Escape', 'parking-rush': 'Parking Rush',
    'color-match': 'Color Match',
  };
  if (titleCn && TITLE_EN[templateId]) {
    html = html.replace(new RegExp(TITLE_EN[templateId], 'g'), titleCn);
  }

  // Template-specific boot scene descriptions (full block replacements)
  const BOOT_DESC_REPLACEMENTS = {
    'conveyor-sort': [
      ['Drag falling packages into matching bins.<br>Speed increases! Watch for virus packages.', '拖动到对应分类区。<br>速度递增！小心干扰项。'],
      ['Drag packages to matching bins!', sub || '分类整理听到的信息碎片'],
    ],
    'spotlight-seek': [
      ['Tiles flash briefly on a 3x3 grid.<br>Remember and tap the highlighted tile.', '方块短暂闪烁。<br>记住位置，快速点击。'],
      ['Watch the spotlight...', '注意观察...'],
      ['Found: ', '找到: '],
    ],
    'stardew-fishing': [
      ['Hold to move the catch bar up.<br>Release to let it fall.<br>Keep bar over the fish to fill gauge.', '长按上移捕获条。<br>松开下落。<br>保持在目标上填满进度。'],
      ['Cast your line!', sub || '拉扯真相'],
      ['Track the fish!', '追踪节奏！'],
      ['HOLD TO REEL', '长按拉线'],
      ['Great catch!', '完美！'],
      ['🐟 Caught: ', '🐟 捕获: '],
    ],
    'lane-dash': [
      ['Tap LEFT or RIGHT to switch lanes.<br>Dodge falling obstacles to survive.<br>Speed increases as you progress!', '点击左右切换车道。<br>躲避障碍生存下去。<br>速度越来越快！'],
      ['Swipe to dodge obstacles!', sub || '在黑暗中奔跑'],
      ['Dodged ', '躲避 '],
    ],
    'parking-rush': [
      ['Tap the correct lane to park each car.<br>Get streaks for bonus points!<br>Wrong lane costs time!', '点击正确车道停车。<br>连续正确获得加成！<br>选错扣时间！'],
      ['Find the free slot before time runs out!', sub || '调度政治资源'],
      ['Streak ', '连击 '],
      ['Parked! +', '到位！+'],
      ['Parked: ', '停放: '],
      ['CENTER', '中间'],
    ],
    'color-match': [
      ['Tricky! Read the WORD, ignore the color!', '注意！看文字，忽略颜色！'],
      ['Tap the matching swatch', '点击匹配的色块'],
      ['Tap the correct color name', '点击正确的颜色名'],
    ],
    'red-light-green-light': [
      ['Reach 100m to get S rank!<br>Hold RUN on GREEN, STOP on RED.<br>Yellow flash is a bluff \\u2014 keep running!<br>Red violation pushes you back -5/-8/-12m', '达到100m获S级！<br>绿灯长按跑，红灯松手停。<br>黄灯是虚晃——继续跑！<br>红灯违规后退 -5/-8/-12m'],
      ['TRAFFIC LIGHT SPRINT', '红绿灯冲刺'],
      ['STAMINA', '体力'],
      ['STOP!', '停！'],
      ['GO!', '走！'],
      ['READY...', sub || '准备...'],
    ],
    'qte-boss-parry': [
      ['Choose PARRY, DODGE, or COUNTER<br>Match the attack type<br>Build combo for bonus!', '选择格挡、闪避或反击<br>匹配对方攻击类型<br>连击获得加成！'],
      ['Counter with the right action!', '选择正确的应对！'],
      ['Incoming: ', '来袭: '],
      ['Counter \\u2192 ', '应对 → '],
    ],
    'cannon-aim': [
      ['Drag to aim, tap FIRE to shoot.<br>Big balloon: <b>2pt</b> (no combo)<br>Medium: <b>20pt</b> (builds combo)<br>Small gold (top): <b>50pt</b> (builds combo)<br>Only medium & gold build your combo multiplier!', '拖动瞄准，点击发射。<br>大目标：<b>2分</b>（无连击）<br>中目标：<b>20分</b>（触发连击）<br>小金色（顶部）：<b>50分</b>（触发连击）<br>只有中、金目标累积连击！'],
    ],
  };

  const descReplacements = BOOT_DESC_REPLACEMENTS[templateId];
  if (descReplacements) {
    for (const [from, to] of descReplacements) {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(escaped, 'g'), to);
    }
  }

  // Replace misc English UI text across all templates
  html = html.replace(/'HOLD TO CHARGE ⚡'/g, "'蓄力 ⚡'");
  html = html.replace(/"HOLD TO CHARGE ⚡"/g, '"蓄力 ⚡"');
  html = html.replace(/'CHARGING... ⚡'/g, "'蓄力中... ⚡'");
  html = html.replace(/"CHARGING... ⚡"/g, '"蓄力中... ⚡"');
  html = html.replace(/'OVERCHARGED!'/g, "'过载！'");
  html = html.replace(/'PERFECT!'/g, "'完美！'");
  html = html.replace(/'GOOD HIT!'/g, "'不错！'");
  html = html.replace(/'TOO EARLY!'/g, "'太早了！'");
  html = html.replace(/'TOO LATE!'/g, "'太晚了！'");
  html = html.replace(/'MISS!'/g, "'失误！'");
  html = html.replace(/'FIRE'/g, "'发射'");
  html = html.replace(/'DODGE'/g, "'闪避'");
  html = html.replace(/'PARRY'/g, "'格挡'");
  html = html.replace(/'COUNTER'/g, "'反击'");
  html = html.replace(/'HOLDING STRONG'/g, "'撑住了'");
  html = html.replace(/'HOLD THE LINE'/g, "'坚守防线'");
  html = html.replace(/'Score '/g, "'得分 '");
  html = html.replace(/'Combo '/g, "'连击 '");
  html = html.replace(/'Combo x'/g, "'连击 x'");
  html = html.replace(/'Round '/g, "'第 '");
  html = html.replace(/'\u2726 PERFECT!'/g, "'✦ 完美！'");
  html = html.replace(/'CALM'/g, "'平静'");
  html = html.replace(/'WAVE IN '/g, "'冲击波 '");
  html = html.replace(/'WAVE APPROACHING'/g, "'冲击波来临'");
  html = html.replace(/'UNLOCK S TIER/g, "'解锁 S 级");
  html = html.replace(/"UNLOCK S TIER/g, '"解锁 S 级');

  // ── 8. Update resolveTheme default ────────────────────────────────────────
  if (ctxClean.theme) {
    html = html.replace(
      /resolveTheme\('[a-z]+'\)/,
      `resolveTheme('${ctxClean.theme}')`
    );
  }

  // ── 10. Fix kmeans: deterministic initialization (no Math.random) ──────────
  html = html.replace(
    /var centers = \[\];\s*var seen = new Set\(\);\s*while \(centers\.length < k\) \{\s*var i = Math\.floor\(Math\.random\(\) \* pixels\.length\);\s*if \(!seen\.has\(i\)\) \{ seen\.add\(i\); centers\.push\(pixels\[i\]\.slice\(\)\); \}\s*\}/,
    'var centers = []; var step = Math.max(1, Math.floor(pixels.length / k)); for (var ci = 0; ci < k; ci++) { centers.push(pixels[Math.min(ci * step, pixels.length - 1)].slice()); }'
  );

  // ── 11. Remove palette fallback: boost weak colors instead of falling back ─
  html = html.replace(
    /if \(pl > 0\.40 && pl < 0\.75 && ps > 0\.60\) return paletteToTheme\(palette\);/,
    `var fixedS = Math.max(ps, 0.55);
        var fixedL = pl < 0.30 ? 0.45 : (pl > 0.80 ? 0.60 : pl);
        if (fixedS !== ps || fixedL !== pl) {
          var fixedRgb = hslToRgb(hsl[0], fixedS, fixedL);
          palette.primary = toHex(fixedRgb[0], fixedRgb[1], fixedRgb[2]);
          if (ps < 0.30) {
            var accRgb = hslToRgb((hsl[0] + 30) % 360, 0.65, 0.55);
            palette.accent = toHex(accRgb[0], accRgb[1], accRgb[2]);
          }
        }
        return paletteToTheme(palette);`
  );

  // ── 9. Add drawSceneBg if not present ─────────────────────────────────────
  if (!html.includes('function drawSceneBg')) {
    // Insert before MoonAudio or before BootScene
    if (html.includes('// ── MoonAudio')) {
      html = html.replace(/(\/\/ ── MoonAudio)/, DRAW_SCENE_BG + '\n\n$1');
    } else if (html.includes('class MoonAudio')) {
      html = html.replace(/(class MoonAudio)/, DRAW_SCENE_BG + '\n\n$1');
    }
  }

  // ── VALIDATION (Step 7b) ──────────────────────────────────────────────────
  const REQUIRED_CHECKS = [
    ['class NarrativeScene', '组件A: NarrativeScene 类'],
    ['narrative-overlay', '组件A: narrative-overlay CSS'],
    ['NarrativeScene, BootScene', 'Scene 数组含 NarrativeScene (formatted)'],
    ['NarrativeScene,BootScene', 'Scene 数组含 NarrativeScene (minified)'],
    ['resultTexts[rating]', '组件C: resultTexts overlay'],
    ['backgroundImage', '组件B: initShellDOM 头像加载'],
    ['ep_bg_boot', 'BootScene 背景图加载'],
  ];

  // Scene array: check for either formatted or minified
  const hasSceneFormatted = html.includes('NarrativeScene, BootScene');
  const hasSceneMinified = html.includes('NarrativeScene,BootScene');
  if (!hasSceneFormatted && !hasSceneMinified) {
    throw new Error('缺少 Scene 数组含 NarrativeScene');
  }

  for (const [needle, label] of REQUIRED_CHECKS) {
    // Skip scene array checks (handled above)
    if (needle.includes('NarrativeScene') && needle.includes('BootScene')) continue;
    if (!html.includes(needle)) throw new Error(`缺少 ${label}`);
  }

  // ── Write output ──────────────────────────────────────────────────────────
  const outputPath = path.join(BASE, ep, 'game', 'index.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✅ ${ep}: ${templateId} (${(html.length / 1024).toFixed(1)}KB)`);
}
