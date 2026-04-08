#!/usr/bin/env node
/**
 * Generate deep-customized maze-escape games for each werewolf episode.
 * - Base template: packs/attribute-archetypes/games/maze-escape/index-v3.html
 * - Output: data/狼人/ep{N}[_minor]/game/index.html
 * - Injects: NarrativeScene (story intro) + custom ResultScene S/A/B/C texts
 * - Derives theme/attribute/narrative/endings from script.json per episode
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TPL_PATH = path.join(ROOT, 'packs/attribute-archetypes/games/maze-escape/index-v3.html');
const DATA_DIR = path.join(ROOT, 'data/狼人');

// ── Attribute detection from choice checks ─────────────────────────────────
const ATTR_RULES = [
  { pats: [/WIL/i, /意志/], name: 'WIL', zh: '意志' },
  { pats: [/CHA/i, /魅力/], name: 'CHA', zh: '魅力' },
  { pats: [/INT/i, /智力/, /智慧/], name: 'INT', zh: '智慧' },
  { pats: [/DEX/i, /敏捷/], name: 'DEX', zh: '敏捷' },
  { pats: [/CON/i, /体魄/, /耐力/], name: 'CON', zh: '体魄' },
  { pats: [/STR/i, /力量/], name: 'STR', zh: '力量' },
  { pats: [/PER/i, /感知/, /洞察/], name: 'PER', zh: '洞察' },
];

function detectAttribute(choiceNode) {
  if (!choiceNode || !choiceNode.options) return { name: 'WIL', zh: '意志' };
  const blob = choiceNode.options.map((o) => (o.check || '') + ' ' + (o.description || '')).join(' ');
  for (const r of ATTR_RULES) {
    for (const p of r.pats) if (p.test(blob)) return { name: r.name, zh: r.zh };
  }
  return { name: 'WIL', zh: '意志' };
}

// ── Theme selection from scene visual prompts + tone keywords ─────────────
const THEME_KEYWORDS = {
  combat:  ['血', '战', '怒', '暴', '撕', '咬', '厮杀', '红', '死', '尸'],
  mystery: ['阴云', '雾', '暗', '密', '秘', '沉郁', '冷灰', '低压', '公墓', '石碑'],
  nature:  ['森林', '针叶林', '树', '草地', '溪流', '绿', '领地', '边界'],
  dark:    ['黑', '深', '冷', '压迫', '寂静', '夜', '凝滞', '死'],
  sweet:   ['暖', '壁炉', '温', '柔', '粉', '拥抱', '亲'],
  ocean:   ['水', '海', '蓝', '河', '雨'],
  energy:  ['火', '灶', '金', '橙', '亮'],
};

function pickTheme(scenes, script) {
  const text = Object.values(scenes || {})
    .map((s) => s.visual_prompt || '')
    .concat([script || ''])
    .join(' ');
  const scores = {};
  for (const [k, words] of Object.entries(THEME_KEYWORDS)) {
    scores[k] = words.reduce((sum, w) => sum + (text.match(new RegExp(w, 'g')) || []).length, 0);
  }
  // Bias: werewolf drama defaults dark/mystery
  scores.dark += 2;
  scores.mystery += 1;
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Narrative extraction: clean pre_choice_script into intro beats ────────
function extractNarrativeBeats(script, maxBeats) {
  if (!script) return [];
  const lines = script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const beats = [];
  for (const line of lines) {
    if (line.startsWith('---')) continue;
    if (line.startsWith('黑屏字幕')) continue;
    if (line.startsWith('特写')) continue;
    // Scene markers: （场景：xxx）
    const scm = line.match(/^（场景[:：](.+?)）$/);
    if (scm) {
      beats.push({ type: 'scene', text: scm[1].trim() });
      continue;
    }
    // Subtitles: 字幕：【xxx】
    const ssm = line.match(/^字幕[:：]【(.+?)】$/);
    if (ssm) {
      beats.push({ type: 'subtitle', text: ssm[1].trim() });
      continue;
    }
    // Dialogue lines like "Sylvia: text" or "Sylvia:（emotion）text"
    const dm = line.match(/^([\u4e00-\u9fa5A-Za-z .]+?)[:：]\s*(?:（([^）]+)）\s*)?(.+)$/);
    if (dm && dm[1].length <= 20 && !line.startsWith('字幕') && !line.startsWith('黑屏')) {
      const speaker = dm[1].trim();
      const emotion = dm[2] ? `（${dm[2]}）` : '';
      const text = dm[3].trim();
      if (text) {
        beats.push({ type: 'dialogue', speaker, emotion, text });
        continue;
      }
    }
    // Action description: （xxx）
    const am = line.match(/^（(.+)）$/);
    if (am) {
      beats.push({ type: 'action', text: am[1].trim() });
      continue;
    }
    // Plain text fallback
    beats.push({ type: 'action', text: line });
  }
  return beats.slice(0, maxBeats || 12);
}

// ── Derive S/A/B/C result texts from outcomes + next-ep opening ───────────
function deriveResultTexts(current, next) {
  const outcomes = (current && current.output && current.output.post_choice_outcomes) || [];
  const nextOpen = next ? extractFirstLines(next) : '';

  // Reactions typically ordered: passive→attempt_fail→attempt_success
  const passive = outcomes[0];
  const failed = outcomes[1];
  const success = outcomes[2] || outcomes[1] || outcomes[0];

  const clean = (txt) => {
    if (!txt) return '';
    return String(txt).replace(/\s+/g, ' ').trim().slice(0, 140);
  };

  const butterflyBeat = (o) => clean(o && (o.butterfly_effect || o.story_content) || '');

  return {
    S: butterflyBeat(success) + (nextOpen ? ' ▸ ' + clean(nextOpen) : ''),
    A: butterflyBeat(success) || butterflyBeat(passive),
    B: butterflyBeat(failed || passive),
    C: butterflyBeat(passive) || '你退缩了，沉默接管了这一刻。',
  };
}

function extractFirstLines(nextVariantBundle) {
  const v = nextVariantBundle.mainline || nextVariantBundle.minor_mainline;
  if (!v || !v.output || !v.output.pre_choice_script) return '';
  const beats = extractNarrativeBeats(v.output.pre_choice_script, 3);
  const first = beats.find((b) => b.type === 'dialogue' || b.type === 'action');
  if (!first) return '';
  return first.type === 'dialogue' ? `${first.speaker}：${first.text}` : first.text;
}

// ── Asset path resolution ────────────────────────────────────────────────
function findCoverImage(epDir, scenes) {
  const bgDir = path.join(epDir, 'background');
  if (!fs.existsSync(bgDir)) return null;
  const files = fs.readdirSync(bgDir).filter((f) => f.endsWith('.png'));
  if (!files.length) return null;
  // Prefer a scene matching the first scene_locations key
  const sceneNames = Object.keys(scenes || {});
  for (const sn of sceneNames) {
    const exact = files.find((f) => f === sn + '.png');
    if (exact) return exact;
    const substituted = files.find((f) => f.startsWith(sn + ' [替代_'));
    if (substituted) return substituted;
  }
  return files[0];
}

function findCharacterImage(epDir, characters) {
  const chDir = path.join(epDir, 'character');
  if (!fs.existsSync(chDir)) return null;
  const files = fs.readdirSync(chDir).filter((f) => f.endsWith('.png'));
  if (!files.length) return null;
  // Prefer first named character (protagonist)
  for (const c of characters || []) {
    const hit = files.find((f) => f.startsWith(c) || f === c + '.png');
    if (hit) return hit;
  }
  return files[0];
}

// ── Template modification: inject NarrativeScene + custom ResultScene text ─
function buildCustomHTML(baseHTML, ctx) {
  // 1) Inject CTX at top of <script> block
  const ctxBlock =
    '<script>\nwindow.__EPISODE_CTX__ = ' +
    JSON.stringify(ctx, null, 2) +
    ';\n</script>\n';

  // 2) Replace BootScene -> inject NarrativeScene before it
  const narrativeSceneCode = `
// ══════════════════════════════════════════════════════════════════════════════
//  NARRATIVE SCENE (injected for werewolf episodes)
// ══════════════════════════════════════════════════════════════════════════════
class NarrativeScene extends Phaser.Scene {
  constructor() { super('NarrativeScene'); }
  preload() {
    if (CTX.coverImage) this.load.image('ep_bg', CTX.coverImage);
    if (CTX.characterImage) this.load.image('ep_char', CTX.characterImage);
  }
  create() {
    this.children.removeAll(true);
    var T = window.__V3_THEME__;
    setVisible('maze-info', false); setVisible('maze-label', false); setVisible('dpad-area', false);
    setVisible('combo-text', false); setVisible('stars-row', false); setVisible('result-info', false);
    setVisible('boot-card', false); setVisible('btn-area', true);

    // Background scene (darkened)
    if (this.textures.exists('ep_bg')) {
      var bg = this.add.image(W/2, H/2, 'ep_bg').setDepth(0);
      var s = Math.max(W / bg.width, H / bg.height);
      bg.setScale(s).setAlpha(0.35);
    } else {
      this.add.rectangle(W/2, H/2, W, H, hexToInt(T.bg), 1).setDepth(0);
    }
    // Dark gradient overlay for readability
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.55).setDepth(1);

    // Character portrait (right side)
    if (this.textures.exists('ep_char')) {
      var ch = this.add.image(W - 90, H/2 - 40, 'ep_char').setDepth(2);
      var cs = Math.min(220 / ch.width, 360 / ch.height);
      ch.setScale(cs).setAlpha(0.88);
    }

    // Episode label
    var label = (CTX.episodeLabel || '') + (CTX.episodeTitle ? ' · ' + CTX.episodeTitle : '');
    this.add.text(20, 96, label, { fontFamily:'Montserrat', fontSize:'14px', fontStyle:'800', color: T.primaryLight, stroke:'#000', strokeThickness:3 }).setDepth(10);

    // Character name tag
    if (CTX.character && CTX.character.name) {
      this.add.text(20, 118, CTX.character.name + ' · ' + (CTX.attribute || ''), { fontFamily:'Montserrat', fontSize:'12px', fontStyle:'700', color:'#fff', stroke:'#000', strokeThickness:2 }).setDepth(10);
    }

    // Narrative beats (scrollable text block on left)
    var beats = CTX.narrativeIntro || [];
    var panelX = 20, panelY = 150, panelW = W - 40;
    var panelBg = this.add.rectangle(panelX, panelY, panelW, 440, 0x000000, 0.72).setOrigin(0,0).setDepth(5);
    panelBg.setStrokeStyle(1, hexToInt(T.primary), 0.6);

    var y = panelY + 12, maxY = panelY + 420;
    for (var i = 0; i < beats.length && y < maxY; i++) {
      var b = beats[i];
      var style, prefix = '';
      if (b.type === 'scene') {
        style = { fontFamily:'Montserrat', fontSize:'11px', fontStyle:'700', color: T.gold, wordWrap:{width: panelW - 24} };
        prefix = '◆ ';
      } else if (b.type === 'subtitle') {
        style = { fontFamily:'Montserrat', fontSize:'11px', fontStyle:'700', color: T.primaryLight, wordWrap:{width: panelW - 24}, fontStyle:'italic' };
        prefix = '【';
      } else if (b.type === 'dialogue') {
        var speakerText = this.add.text(panelX + 12, y, (b.speaker || '') + '：' + (b.emotion || ''), { fontFamily:'Montserrat', fontSize:'12px', fontStyle:'900', color: T.primary, wordWrap:{width: panelW - 24} }).setDepth(6);
        y += speakerText.height + 2;
        if (y >= maxY) break;
        var diaText = this.add.text(panelX + 16, y, '"' + (b.text || '') + '"', { fontFamily:'Montserrat', fontSize:'12px', fontStyle:'500', color:'#fff', wordWrap:{width: panelW - 28} }).setDepth(6);
        y += diaText.height + 8;
        continue;
      } else {
        style = { fontFamily:'Montserrat', fontSize:'11px', fontStyle:'400', color:'#CFCFD4', wordWrap:{width: panelW - 24}, fontStyle:'italic' };
      }
      var suffix = (b.type === 'subtitle') ? '】' : '';
      var t = this.add.text(panelX + 12, y, prefix + (b.text || '') + suffix, style).setDepth(6);
      y += t.height + 6;
    }

    clearBtnArea();
    $('btn-area').appendChild(makeCandyButton('进入逃脱', 'full', 18, function() {
      audio.unlock();
      window.__game.scene.start('BootScene');
    }));
  }
}
`;

  // Find and replace the scene list so NarrativeScene is first
  const customized = baseHTML
    // 1) Insert NarrativeScene class before BootScene
    .replace(
      '// ══════════════════════════════════════════════════════════════════════════════\n//  BOOT SCENE',
      narrativeSceneCode +
        '\n// ══════════════════════════════════════════════════════════════════════════════\n//  BOOT SCENE'
    )
    // 2) Add NarrativeScene to scene list (make it first, so auto-started)
    .replace(
      'scene: [BootScene, GameScene, ResultScene]',
      'scene: [NarrativeScene, BootScene, GameScene, ResultScene]'
    )
    // 3) Replace hardcoded title from HTML (for tab name fallback)
    .replace('<title>Maze Escape</title>', '<title>' + escapeHtml(ctx.episodeLabel + ' ' + ctx.episodeTitle) + '</title>')
    // 4) Extend ResultScene to show custom S/A/B/C text
    .replace(
      "$('stat-hits').textContent = 'Caught: ' + this.captures + ' / Bumps: ' + this.misses;",
      "$('stat-hits').textContent = 'Caught: ' + this.captures + ' / Bumps: ' + this.misses;\n    // Injected: custom episode result text\n    if (CTX.resultTexts && CTX.resultTexts[rating]) {\n      this.add.text(W/2, 560, CTX.resultTexts[rating], { fontFamily:'Montserrat', fontSize:'12px', fontStyle:'500', color:'#CFCFD4', wordWrap:{width: 340}, align:'center' }).setOrigin(0.5,0).setDepth(10);\n    }"
    );

  // Prepend the CTX block right before the first <script> tag
  return customized.replace('<script>\n// ── Host context', ctxBlock + '<script>\n// ── Host context');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Main ───────────────────────────────────────────────────────────────
function main() {
  const baseHTML = fs.readFileSync(TPL_PATH, 'utf8');
  const epDirs = fs.readdirSync(DATA_DIR).filter((d) => /^ep\d+(_minor)?$/.test(d));
  epDirs.sort((a, b) => {
    const na = parseInt(a.match(/\d+/)[0], 10), nb = parseInt(b.match(/\d+/)[0], 10);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  });

  const summary = [];
  for (const epDir of epDirs) {
    const epPath = path.join(DATA_DIR, epDir);
    const scriptPath = path.join(epPath, 'script.json');
    if (!fs.existsSync(scriptPath)) {
      console.warn('[skip]', epDir, '(no script.json)');
      continue;
    }
    const bundle = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    const cur = bundle.current;
    const out = cur.output;

    const attr = detectAttribute(out.choice_node);
    const theme = pickTheme(out.scene_locations, out.pre_choice_script);
    const beats = extractNarrativeBeats(out.pre_choice_script, 14);
    const resultTexts = deriveResultTexts(cur, bundle.next);
    const coverImg = findCoverImage(epPath, out.scene_locations);
    const charImg = findCharacterImage(epPath, out.characters);
    const protagonist = (out.characters || [])[0] || '';

    const ctx = {
      character: { name: protagonist },
      attribute: attr.zh,
      attributeCode: attr.name,
      episodeLabel: out.episode_id || ('EP ' + cur.ep_num),
      episodeTitle: out.episode_title || '',
      theme,
      narrativeIntro: beats,
      resultTexts,
      coverImage: coverImg ? '../background/' + encodeURIComponent(coverImg) : null,
      characterImage: charImg ? '../character/' + encodeURIComponent(charImg) : null,
      variant: cur.variant_kind,
    };

    const html = buildCustomHTML(baseHTML, ctx);
    const gameDir = path.join(epPath, 'game');
    fs.mkdirSync(gameDir, { recursive: true });
    fs.writeFileSync(path.join(gameDir, 'index.html'), html, 'utf8');

    summary.push({
      dir: epDir,
      ep: cur.ep_num,
      variant: cur.variant_kind,
      protagonist,
      attr: attr.name,
      theme,
      beats: beats.length,
      cover: coverImg ? '✓' : '✗',
      portrait: charImg ? '✓' : '✗',
    });
    console.log(
      `[ok] ${epDir.padEnd(12)} ep${String(cur.ep_num).padStart(2)}/${cur.variant_kind.padEnd(14)} | ${protagonist.padEnd(10)} | ${attr.name} | ${theme.padEnd(8)} | beats=${String(beats.length).padStart(2)} | cover=${coverImg ? '✓' : '✗'} char=${charImg ? '✓' : '✗'}`
    );
  }

  // Update EPISODES_README
  const readmePath = path.join(DATA_DIR, 'EPISODES_README.md');
  if (fs.existsSync(readmePath)) {
    const old = fs.readFileSync(readmePath, 'utf8');
    const addendum =
      '\n\n## 定制化小游戏\n\n每集 `game/index.html` 是基于 maze-escape v3 模版深度定制的独立游戏（可直接浏览器打开）。\n\n' +
      '| 目录 | 主角 | 属性 | 主题 | 叙事 | 背景 | 立绘 |\n' +
      '|------|------|------|------|------|------|------|\n' +
      summary
        .map((s) => `| \`${s.dir}/game/\` | ${s.protagonist} | ${s.attr} | ${s.theme} | ${s.beats} | ${s.cover} | ${s.portrait} |`)
        .join('\n');
    if (!old.includes('## 定制化小游戏')) {
      fs.writeFileSync(readmePath, old + addendum, 'utf8');
    } else {
      fs.writeFileSync(readmePath, old.replace(/\n\n## 定制化小游戏[\s\S]*$/, addendum), 'utf8');
    }
  }

  console.log(`\nGenerated ${summary.length} episode games.`);
}

main();
