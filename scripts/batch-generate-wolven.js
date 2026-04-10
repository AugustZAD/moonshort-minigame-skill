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
const isVariant = process.argv.includes('--variant');

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

// ── Per-episode story-themed game title + rules (replaces generic template names) ─
const STORY_GAME = {
  ep1:  { title: '压住心跳', rules: '长按蓄力，在正确时机开口<br>太早暴露情绪，太晚错过窗口<br>精准释放 = 致命一击' },
  ep2:  { title: '不跪的理由', rules: '他移开目光时前进，注视你时停下<br>持续奔跑加速，最高2倍速<br>被抓或松手速度归零<br>撑过100步 = 证明自己' },
  ep3:  { title: '碎片拼图', rules: '将走廊里听到的碎片分类<br>真相和谎言混在一起<br>速度越来越快，别选错' },
  ep4:  { title: '权力棋盘', rules: '记住关键人物的位置<br>灯光熄灭后精准锁定<br>在人群中找到你的棋子' },
  ep5:  { title: '撑住', rules: '意志被一波波冲击<br>每一次点击都是在说"我还在"<br>坚持到最后一秒' },
  ep6:  { title: '最后摊牌', rules: '判断Luna的每一步棋<br>格挡、闪避、还是反击？<br>精准应对才能翻盘' },
  ep7:  { title: '锻造武器', rules: '瞄准嫉妒中的真相<br>小目标更难但更致命<br>每一发都是你的筹码' },
  ep8:  { title: '拉扯真相', rules: '追踪他话语里的节奏<br>拉住不放，逼他松口<br>填满进度条 = 他开口了' },
  ep9:  { title: '握紧声音', rules: '在生死抉择前保持冷静<br>压力波一波接一波<br>你的声音不能颤抖' },
  ep10: { title: '最后一口气', rules: '他扼住你的咽喉<br>长按蓄力，在窒息前开口<br>这句话只有一次机会' },
  ep11: { title: '规则战争', rules: '在议事厅的压力中调度资源<br>用程序而非武力<br>每一步都必须精准' },
  ep12: { title: '翻窗逃离', rules: '在黑暗走廊中躲避追兵<br>左右闪避，不能停下<br>高烧中跑向唯一的出口' },
  ep12_minor: { title: '坐到最后', rules: '在座位上承受所有压力<br>压力松开时可以喘息<br>压力来袭时一动不动' },
  ep13: { title: '踏过边界', rules: '背着行囊穿越迷宫<br>找到钥匙，跑向自由<br>追兵就在身后' },
  ep13_minor: { title: '独自前行', rules: '将混乱的信息分类<br>哪些是真的，哪些是干扰<br>靠自己走到边界线' },
  ep14: { title: '黑暗奔逃', rules: '在树线间躲避追兵<br>左右闪避，越跑越快<br>撑到Iris出现的那一刻' },
  ep15: { title: '重新呼吸', rules: '追踪呼吸的节奏<br>保持在平稳区域<br>让身体慢慢愈合' },
  ep16: { title: '月光辨认', rules: '在月光下辨认归来的面孔<br>看清楚，别被情绪干扰<br>每一次判断都是答案' },
  ep17: { title: '道别的勇气', rules: '在人群中找到那个人<br>记住位置，精准锁定<br>这是最后一次说谢谢' },
  ep18: { title: '迈出第一步', rules: '瞄准重逢后的每一个时刻<br>大的容易，小的珍贵<br>连击 = 你们的默契' },
  ep19: { title: '满月之约', rules: '在月光下回应新的连结<br>判断每一个信号<br>精准应对 = 接受远方' },
  ep20: { title: '找到方向', rules: '在新领地的迷宫中探索<br>找到钥匙，推开那扇门<br>这一次，没有人追你' },
};

// ── Per-episode in-game element reskin (labels, categories) ──────────────────
// Each entry maps template-specific game elements to story-themed equivalents
const STORY_RESKIN = {
  // ── conveyor-sort: category bins ──
  ep3:  { // 偷听Luna书房情报
    categories: { DATA:'证词', CODE:'线索', MAIL:'密信', MEDIA:'档案', VIRUS:'谎言' },
    hints: { 'Watch out for VIRUS packages!': '小心混入的谎言！' },
  },
  ep13_minor: { // 靠自己走到边界线
    categories: { DATA:'补给', CODE:'路线', MAIL:'信号', MEDIA:'地图', VIRUS:'陷阱' },
    hints: { 'Watch out for VIRUS packages!': '小心路上的陷阱！' },
  },
  // ── qte-boss-parry: attack/counter types ──
  ep6:  { // 直面Luna摊牌
    attacks: { SLASH:'质问', HEAVY:'施压', BURST:'命令' },
    counters: { PARRY:'沉默', DODGE:'回避', BLOCK:'反驳' },
    symbols: { '⚔':'🗡️', '⚡':'💢', '⛔':'👊' },
    dialogue: 'Luna会用质问、施压或命令来压制你。',
  },
  ep19: { // 满月之约
    attacks: { SLASH:'试探', HEAVY:'表白', BURST:'承诺' },
    counters: { PARRY:'回应', DODGE:'犹豫', BLOCK:'接受' },
    symbols: { '⚔':'💬', '⚡':'💗', '⛔':'🌙' },
    dialogue: '月光下的每一句话都需要你回应。',
  },
  // ── cannon-aim: target types ──
  ep7:  { // 在嫉妒中锻造武器
    targetLabels: { 'Big balloon':'大破绽', 'Medium':'中等弱点', 'Small gold':'关键真相' },
  },
  ep18: { // 咖啡馆重逢
    targetLabels: { 'Big balloon':'大信号', 'Medium':'微表情', 'Small gold':'心意' },
  },
  // ── stardew-fishing: fish/reel metaphor ──
  ep8:  { // 拉扯真相
    labels: { '🐟 Caught:':'💬 逼问:', '🐟 Caught: ':'💬 逼问: ', 'Cast your line!':'试探他', 'Track the fish!':'抓住他的话！', 'HOLD TO REEL':'拉住不放', 'Great catch!':'他松口了！' },
  },
  ep15: { // 重新呼吸
    labels: { '🐟 Caught:':'🫁 呼吸:', '🐟 Caught: ':'🫁 呼吸: ', 'Cast your line!':'深呼吸', 'Track the fish!':'保持节奏', 'HOLD TO REEL':'稳住', 'Great catch!':'好多了！' },
  },
  // ── maze-escape: ghost/key metaphor ──
  ep13: { // 踏过边界线
    labels: { '👻':'🐺', 'ghost hunts you':'追兵来了', 'Find the Key!':'找到出路！', 'Got it! Run to Exit!':'拿到了！快跑！' },
  },
  ep20: { // 在新领地找到方向
    labels: { '👻':'🌫️', 'ghost hunts you':'迷雾追来了', 'Find the Key!':'找到方向！', 'Got it! Run to Exit!':'看清了！往前跑！' },
  },
  // ── will-surge: wave metaphor ──
  ep5:  { // 撑不住
    labels: { 'WAVE IN ':'崩溃波 ', 'WAVE APPROACHING':'崩溃逼近', 'CALM':'平静', 'HOLDING STRONG':'撑住了', 'HOLD THE LINE':'不能倒' },
  },
  ep9:  { // 给我
    labels: { 'WAVE IN ':'压力波 ', 'WAVE APPROACHING':'抉择逼近', 'CALM':'冷静', 'HOLDING STRONG':'握紧了', 'HOLD THE LINE':'不能颤抖' },
  },
  // ── red-light-green-light ──
  ep2:  { // 在Alpha命令下撑住不跪
    labels: { '跑':'前进', '停！':'跪下！', '走！':'站起来！' },
  },
  ep12_minor: { // 坐着别动
    labels: { '跑':'喘息', '停！':'别动！', '走！':'可以了' },
  },
  // ── lane-dash ──
  ep12: { // 翻窗逃离
    labels: { 'Dodged ':'躲过 ' },
  },
  ep14: { // 黑暗奔逃
    labels: { 'Dodged ':'闪过 ' },
  },
  // ── spotlight-seek ──
  ep4: { // 权力棋盘
    labels: { 'Watch the spotlight...':'注意权力动向...', 'Found: ':'锁定: ' },
  },
  ep17: { // 道别的勇气
    labels: { 'Watch the spotlight...':'找到那个人...', 'Found: ':'找到: ' },
  },
  // ── qte-hold-release ──
  ep1: { // 压住心跳
    labels: { 'HOLD TO CHARGE ⚡':'压住 💔', 'CHARGING... ⚡':'压住中... 💔', 'OVERCHARGED!':'压不住了！', 'PERFECT!':'精准开口！', 'GOOD HIT!':'说到了！', 'TOO EARLY!':'太急了！', 'TOO LATE!':'来不及了！' },
  },
  ep10: { // 最后一口气
    labels: { 'HOLD TO CHARGE ⚡':'憋住 🫁', 'CHARGING... ⚡':'憋气中... 🫁', 'OVERCHARGED!':'窒息了！', 'PERFECT!':'说出来了！', 'GOOD HIT!':'开口了！', 'TOO EARLY!':'太早了！', 'TOO LATE!':'说不出了！' },
  },
  // ── parking-rush ──
  ep11: { // 规则战争
    labels: { 'Parked! +':'到位！+', 'Parked: ':'部署: ', 'Streak ':'连续 ', 'CENTER':'中路', 'Find the free slot before time runs out!':'在时间耗尽前把资源送到正确位置！' },
  },
  // ── color-match ──
  ep16: { // 月光辨认
    labels: { 'Tricky! Read the WORD, ignore the color!':'注意！看清面孔，别被月光干扰！', 'Tap the matching swatch':'点击匹配的面孔', 'Tap the correct color name':'选择正确的判断' },
  },
};

// ── Layer 3 theme builder (asset-based shell replacement) ────────────────────
// Injects an AI-generated PNG overlay onto the game shell as the narrative visual.
// Follows SKILL.md L142-168 spec: AI imagery only, no CSS drawing.
//
// opts: {
//   name,              // narrative label (comment only)
//   bg,                // [top, mid, bot] background gradient
//   asset,             // PNG filename without .png (e.g., 'theme-gauge')
//   hide,              // CSS selector(s) to hide (original shell element, optional)
//   rect,              // { top, left, width, height, transform? } overlay position
//   soft,              // bool — apply radial mask for soft edges (default true)
//   glow,              // CSS box-shadow / drop-shadow color (optional)
//   statePatch,        // { fn, charge?, idle? } — monkey-patch window[fn] to toggle '.charging' class
// }
function layer3Theme(opts) {
  const {
    name, bg, asset, hide, rect, soft = true, glow, statePatch,
  } = opts;
  const cls = 'theme-' + asset;
  const mask = soft
    ? 'mask-image:radial-gradient(ellipse 85% 85% at 50% 50%,#000 50%,transparent 92%);-webkit-mask-image:radial-gradient(ellipse 85% 85% at 50% 50%,#000 50%,transparent 92%);'
    : '';
  const filter = glow
    ? `filter:drop-shadow(0 0 18px ${glow}) drop-shadow(0 0 40px ${glow});`
    : 'filter:drop-shadow(0 4px 20px rgba(0,0,0,0.6));';
  const pos = `position:absolute;top:${rect.top};left:${rect.left};width:${rect.width};height:${rect.height};${rect.transform ? 'transform:' + rect.transform + ';' : ''}z-index:15;pointer-events:none;`;

  let css = `\n  /* ═══ Layer 3 Theme: ${name} ═══ */`;
  if (bg) {
    css += `\n  body, #game-shell { background: linear-gradient(180deg, ${bg[0]} 0%, ${bg[1]} 45%, ${bg[2]} 100%) !important; }`;
  }
  if (hide) {
    css += `\n  ${hide} { visibility: hidden !important; }`;
  }
  css += `\n  .${cls} { ${pos} }`;
  css += `\n  .${cls} img { width:100%; height:100%; object-fit:contain; ${mask} ${filter} transition:filter 0.25s ease, transform 0.25s ease; }`;
  if (statePatch) {
    css += `\n  .${cls}.active img { filter:drop-shadow(0 0 30px ${glow || 'rgba(255,255,255,0.6)'}) drop-shadow(0 0 60px ${glow || 'rgba(255,255,255,0.3)'}) brightness(1.15); transform: scale(1.04); }`;
  }
  // Soft vignette across whole shell (subtle, never overpowers the asset)
  css += `\n  #theme-l3-vig { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.35) 100%); }`;

  // JS: inject overlay element, optionally monkey-patch state function
  let js = `(function(){`;
  js += `var shell=document.getElementById('game-shell');if(!shell)return;`;
  js += `var vig=document.createElement('div');vig.id='theme-l3-vig';shell.appendChild(vig);`;
  js += `var ov=document.createElement('div');ov.className='${cls}';ov.id='${cls}-el';`;
  js += `ov.innerHTML='<img src="${asset}.png" alt="">';`;
  js += `shell.appendChild(ov);`;
  if (statePatch && statePatch.fn) {
    js += `var origFn=window.${statePatch.fn};`;
    js += `if(typeof origFn==='function'){`;
    js += `window.${statePatch.fn}=function(){var r=origFn.apply(this,arguments);`;
    if (statePatch.trigger) {
      js += `try{if(${statePatch.trigger}){ov.classList.add('active');}else{ov.classList.remove('active');}}catch(e){}`;
    }
    js += `return r;};}`;
  }
  js += `})();`;

  return { cssOverride: css, jsOverride: js };
}

// Multi-state asset helper (for ep12_minor's 3-state eye). Creates 3 layered <img>
// with opacity cross-fade driven by monkey-patching setTrafficLight.
function layer3MultiStateEye(opts) {
  const { name, bg, open, half, closed, top = '120px', size = '200px' } = opts;
  const css = `
  /* ═══ Layer 3 Theme: ${name} ═══ */
  body, #game-shell { background: linear-gradient(180deg, ${bg[0]} 0%, ${bg[1]} 45%, ${bg[2]} 100%) !important; }
  .traffic-light { visibility: hidden !important; }
  .theme-eye-multi { position:absolute; top:${top}; left:50%; transform:translateX(-50%); width:${size}; height:${size}; z-index:15; pointer-events:none; }
  .theme-eye-multi img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; transition:opacity 0.35s ease, filter 0.35s ease; -webkit-mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,#000 40%,transparent 80%); mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,#000 40%,transparent 80%); }
  .theme-eye-multi .eye-open { z-index:1; }
  .theme-eye-multi .eye-half { z-index:2; }
  .theme-eye-multi .eye-closed { z-index:3; }
  #theme-l3-vig { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.35) 100%); }`;
  const js = `(function(){
  var shell=document.getElementById('game-shell');
  var vig=document.createElement('div');vig.id='theme-l3-vig';shell.appendChild(vig);
  var e=document.createElement('div');e.className='theme-eye-multi';e.id='theme-eye-multi';
  e.innerHTML='<img class="eye-open" src="${open}.png" alt=""><img class="eye-half" src="${half}.png" alt=""><img class="eye-closed" src="${closed}.png" alt="">';
  var tl=document.getElementById('traffic-light');
  if(tl&&tl.parentNode)tl.parentNode.insertBefore(e,tl.nextSibling); else shell.appendChild(e);
  var origSet=window.setTrafficLight;
  if(typeof origSet==='function'){
    window.setTrafficLight=function(color){
      origSet(color);
      var o=e.querySelector('.eye-open'),h=e.querySelector('.eye-half'),c=e.querySelector('.eye-closed');
      if(!o)return;
      if(color==='red'){o.style.opacity='1';h.style.opacity='0';c.style.opacity='0';o.style.filter='drop-shadow(0 0 30px rgba(255,50,50,0.75)) brightness(1.15)';}
      else if(color==='yellow'){o.style.opacity='0';h.style.opacity='1';c.style.opacity='0';h.style.filter='drop-shadow(0 0 15px rgba(255,160,30,0.5))';}
      else if(color==='green'){o.style.opacity='0';h.style.opacity='0';c.style.opacity='1';c.style.filter='brightness(0.65)';}
      else {o.style.opacity='0';h.style.opacity='0';c.style.opacity='1';c.style.filter='brightness(0.35)';}
    };
  }
  var origVis=window.setVisible;
  if(typeof origVis==='function'){
    window.setVisible=function(id,v){origVis(id,v);if(id==='traffic-light'){e.style.visibility=v?'visible':'hidden';}};
  }
})();`;
  return { cssOverride: css, jsOverride: js };
}

// ── Per-episode environment theme (Layer 3: game shell → story world) ────────
// cssOverride is injected before </style>; jsOverride is appended after sprite patches
const STORY_THEME = {
  // ── ep1: qte-hold-release — 心电图 ───────────────────────────────
  ep1: layer3Theme({
    name: '压住心跳 — 心电监护仪',
    bg: ['#0a0408', '#1a0a10', '#0d0408'],
    asset: 'theme-gauge',
    hide: '.gauge-area .gauge-ring, .gauge-area .gauge-center, .gauge-pct',
    rect: { top: '290px', left: '50%', width: '280px', height: '280px', transform: 'translateX(-50%)' },
    glow: 'rgba(204,51,68,0.5)',
    statePatch: { fn: 'updateGaugeUI', trigger: 'arguments[0]&&arguments[0]>0.1' },
  }),

  // ── ep2: red-light-green-light — 狼眼替换（完整自定义） ────────────
  ep2: {
    cssOverride: `
  /* ═══ Layer 3 Theme: Alpha 注视（狼眼） ═══ */
  .traffic-light { display: none !important; }
  .wolf-eye { position: absolute; top: 96px; left: 50%; transform: translateX(-50%); width: 200px; height: 200px; z-index: 10; display: flex; align-items: center; justify-content: center; }
  .wolf-eye img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; transition: opacity 0.35s ease, filter 0.35s ease; pointer-events: none; -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 35%, transparent 72%); mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 35%, transparent 72%); }
  .wolf-eye .eye-open { z-index: 1; } .wolf-eye .eye-half { z-index: 2; } .wolf-eye .eye-closed { z-index: 3; }
  .light-label { top: 310px !important; font-size: 28px !important; letter-spacing: 4px !important; text-shadow: 0 0 20px currentColor, 0 2px 10px rgba(0,0,0,0.7) !important; }
  body, #game-shell { background: linear-gradient(180deg, #06000a 0%, #150812 35%, #0a0610 70%, #050308 100%) !important; }
  #game-shell::after { content: ''; position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 260px; height: 260px; background: radial-gradient(circle, rgba(140,170,220,0.06) 0%, transparent 65%); pointer-events: none; z-index: 0; }
  .stamina-fill { background: linear-gradient(90deg, #7a3adf, #df5a8a) !important; box-shadow: 0 0 10px rgba(122, 58, 223, 0.4) !important; }
  .speed-text { color: #df5a8a !important; text-shadow: 0 0 8px rgba(223, 90, 138, 0.5) !important; }
  .track-bg { background: rgba(100, 80, 60, 0.25) !important; border: 1px solid rgba(100, 80, 60, 0.15); }
  .track-fill { background: linear-gradient(90deg, #7a3adf, #b05adf) !important; }
  .btn-area::before { content: ''; position: absolute; bottom: 100%; left: -12px; right: -12px; height: 80px; background: linear-gradient(180deg, transparent 0%, rgba(5,3,8,0.6) 100%); pointer-events: none; }`,
    jsOverride: `
(function() {
  var shell = document.getElementById('game-shell');
  var eye = document.createElement('div');
  eye.className = 'wolf-eye hidden'; eye.id = 'wolf-eye';
  eye.setAttribute('data-state', 'green');
  eye.innerHTML = '<img class="eye-open" src="theme-eye.png" alt=""><img class="eye-half" src="theme-eye-half.png" alt=""><img class="eye-closed" src="theme-eye-closed.png" alt="">';
  var tl = document.getElementById('traffic-light');
  if (tl && tl.parentNode) tl.parentNode.insertBefore(eye, tl.nextSibling);
  var origSetTL = window.setTrafficLight;
  window.setTrafficLight = function(color) {
    origSetTL(color);
    var eyeEl = document.getElementById('wolf-eye');
    if (!eyeEl) return;
    eyeEl.setAttribute('data-state', color || 'off');
    var eOpen = eyeEl.querySelector('.eye-open'), eHalf = eyeEl.querySelector('.eye-half'), eClosed = eyeEl.querySelector('.eye-closed');
    if (!eOpen) return;
    if (color === 'red') { eOpen.style.opacity='1'; eHalf.style.opacity='0'; eClosed.style.opacity='0'; eOpen.style.filter='drop-shadow(0 0 30px rgba(255,20,20,0.8)) brightness(1.15)'; }
    else if (color === 'yellow') { eOpen.style.opacity='0'; eHalf.style.opacity='1'; eClosed.style.opacity='0'; eHalf.style.filter='drop-shadow(0 0 15px rgba(255,160,30,0.5)) brightness(0.9)'; }
    else if (color === 'green') { eOpen.style.opacity='0'; eHalf.style.opacity='0'; eClosed.style.opacity='1'; eClosed.style.filter='drop-shadow(0 0 4px rgba(60,10,10,0.2)) brightness(0.6)'; }
    else { eOpen.style.opacity='0'; eHalf.style.opacity='0'; eClosed.style.opacity='1'; eClosed.style.filter='brightness(0.3)'; }
  };
  var origSetVisible = window.setVisible;
  window.setVisible = function(id, visible) {
    origSetVisible(id, visible);
    if (id === 'traffic-light') { var e = document.getElementById('wolf-eye'); if (e) { if (visible) e.classList.remove('hidden'); else e.classList.add('hidden'); } }
  };
})();`,
  },

  // ── ep3: conveyor-sort — 证据墙 ───────────────────────────────────
  ep3: layer3Theme({
    name: '碎片拼图 — 暗室证据墙',
    bg: ['#0d0a06', '#1a1408', '#0f0c06'],
    asset: 'theme-overlay',
    rect: { top: '120px', left: '0', width: '100%', height: '40%' },
    glow: 'rgba(196,163,90,0.35)',
    soft: true,
  }),

  // ── ep4: spotlight-seek — 棋盘聚光 ────────────────────────────────
  ep4: layer3Theme({
    name: '权力棋盘 — 金色聚光',
    bg: ['#06080d', '#0a1020', '#060810'],
    asset: 'theme-overlay',
    rect: { top: '200px', left: '50%', width: '340px', height: '340px', transform: 'translateX(-50%)' },
    glow: 'rgba(212,168,64,0.55)',
    soft: true,
  }),

  // ── ep5: will-surge — 意志核心 ────────────────────────────────────
  ep5: layer3Theme({
    name: '撑住 — 紫色意志核心',
    bg: ['#08040d', '#180a20', '#0a0610'],
    asset: 'theme-surge',
    hide: '.tug-bar-area',
    rect: { top: '200px', left: '20px', width: 'calc(100% - 40px)', height: '80px' },
    glow: 'rgba(144,64,204,0.55)',
    statePatch: { fn: 'updateTugBar', trigger: 'true' },
  }),

  // ── ep6: qte-boss-parry — Luna 肖像 ───────────────────────────────
  ep6: layer3Theme({
    name: '最后摊牌 — Luna 肖像',
    bg: ['#0a0406', '#200a10', '#0d0408'],
    asset: 'theme-boss',
    hide: '#circle-content',
    rect: { top: '294px', left: '50%', width: '300px', height: '300px', transform: 'translateX(-50%)' },
    glow: 'rgba(232,64,64,0.45)',
  }),

  // ── ep7: cannon-aim — 锻造炉火 ────────────────────────────────────
  ep7: layer3Theme({
    name: '锻造武器 — 红热锻造',
    bg: ['#0d0804', '#201008', '#100a04'],
    asset: 'theme-overlay',
    rect: { top: '140px', left: '0', width: '100%', height: '40%' },
    glow: 'rgba(232,112,48,0.5)',
    soft: true,
  }),

  // ── ep8: stardew-fishing — 拉扯之绳 ───────────────────────────────
  ep8: layer3Theme({
    name: '拉扯真相 — 紧绷之绳',
    bg: ['#06080a', '#0a1018', '#060a0d'],
    asset: 'theme-overlay',
    rect: { top: '220px', left: '0', width: '100%', height: '30%' },
    glow: 'rgba(68,136,204,0.35)',
    soft: true,
  }),

  // ── ep9: will-surge — 握紧声音 ────────────────────────────────────
  ep9: layer3Theme({
    name: '握紧声音 — 紧握麦克风',
    bg: ['#040608', '#081020', '#040810'],
    asset: 'theme-surge',
    hide: '.tug-bar-area',
    rect: { top: '200px', left: '20px', width: 'calc(100% - 40px)', height: '80px' },
    glow: 'rgba(48,96,170,0.55)',
    statePatch: { fn: 'updateTugBar', trigger: 'true' },
  }),

  // ── ep10: qte-hold-release — 氧气表 ───────────────────────────────
  ep10: layer3Theme({
    name: '最后一口气 — 氧气压力表',
    bg: ['#04060a', '#081520', '#040810'],
    asset: 'theme-gauge',
    hide: '.gauge-area .gauge-ring, .gauge-area .gauge-center, .gauge-pct',
    rect: { top: '290px', left: '50%', width: '280px', height: '280px', transform: 'translateX(-50%)' },
    glow: 'rgba(48,136,204,0.55)',
    statePatch: { fn: 'updateGaugeUI', trigger: 'arguments[0]&&arguments[0]>0.1' },
  }),

  // ── ep11: parking-rush — 议事厅 ───────────────────────────────────
  ep11: layer3Theme({
    name: '规则战争 — 议事厅讲台',
    bg: ['#080806', '#141410', '#0a0a06'],
    asset: 'theme-overlay',
    rect: { top: '180px', left: '0', width: '100%', height: '30%' },
    glow: 'rgba(212,168,64,0.35)',
    soft: true,
  }),

  // ── ep12: lane-dash — 月下走廊 ────────────────────────────────────
  ep12: layer3Theme({
    name: '翻窗逃离 — 月下走廊',
    bg: ['#060406', '#100810', '#080408'],
    asset: 'theme-overlay',
    rect: { top: '140px', left: '0', width: '100%', height: '65%' },
    glow: 'rgba(170,120,200,0.35)',
    soft: true,
  }),

  // ── ep12_minor: red-light-green-light — 审讯之眼（多态） ──────────
  ep12_minor: layer3MultiStateEye({
    name: '坐到最后 — 审讯之眼',
    bg: ['#080604', '#18100a', '#0d0a06'],
    open: 'theme-eye',
    half: 'theme-eye-half',
    closed: 'theme-eye-closed',
    top: '100px',
    size: '220px',
  }),

  // ── ep13: maze-escape — 森林边境 ──────────────────────────────────
  ep13: layer3Theme({
    name: '踏过边界 — 迷雾森林',
    bg: ['#04060a', '#0a1018', '#060a10'],
    asset: 'theme-overlay',
    rect: { top: '180px', left: '0', width: '100%', height: '60%' },
    glow: 'rgba(100,170,120,0.35)',
    soft: true,
  }),

  // ── ep13_minor: conveyor-sort — 破碎家书 ──────────────────────────
  ep13_minor: layer3Theme({
    name: '独自前行 — 旧照片',
    bg: ['#060808', '#0e1418', '#080a0a'],
    asset: 'theme-overlay',
    rect: { top: '140px', left: '0', width: '100%', height: '40%' },
    glow: 'rgba(140,160,190,0.35)',
    soft: true,
  }),

  // ── ep14: lane-dash — 月下森林 ────────────────────────────────────
  ep14: layer3Theme({
    name: '黑暗奔逃 — 月下松林',
    bg: ['#040806', '#081810', '#040a06'],
    asset: 'theme-overlay',
    rect: { top: '140px', left: '0', width: '100%', height: '65%' },
    glow: 'rgba(170,210,180,0.35)',
    soft: true,
  }),

  // ── ep15: stardew-fishing — 宁静水面 ──────────────────────────────
  ep15: layer3Theme({
    name: '重新呼吸 — 晨雾水面',
    bg: ['#060a08', '#0e1a14', '#080d0a'],
    asset: 'theme-overlay',
    rect: { top: '240px', left: '0', width: '100%', height: '30%' },
    glow: 'rgba(100,200,160,0.45)',
    soft: true,
  }),

  // ── ep16: color-match — 月光面孔（3 张） ──────────────────────────
  ep16: (() => {
    const base = layer3Theme({
      name: '月光辨认 — 月下面孔',
      bg: ['#060810', '#101830', '#080a18'],
      asset: 'theme-face-0',
      rect: { top: '200px', left: '30%', width: '40%', height: '240px' },
      glow: 'rgba(140,170,220,0.4)',
      soft: true,
    });
    // Append second + third face as additional absolute elements
    base.cssOverride += `
  .theme-face-extra { position:absolute; width:140px; height:140px; z-index:14; pointer-events:none; }
  .theme-face-extra img { width:100%; height:100%; object-fit:contain; -webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000 45%,transparent 88%); mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000 45%,transparent 88%); filter:drop-shadow(0 0 15px rgba(140,170,220,0.35)); opacity:0.75; }
  .theme-face-1-el { top: 190px; left: 20px; }
  .theme-face-2-el { top: 190px; right: 20px; }`;
    base.jsOverride = base.jsOverride.replace('})();', `
  var f1=document.createElement('div');f1.className='theme-face-extra theme-face-1-el';f1.innerHTML='<img src="theme-face-1.png" alt="">';shell.appendChild(f1);
  var f2=document.createElement('div');f2.className='theme-face-extra theme-face-2-el';f2.innerHTML='<img src="theme-face-2.png" alt="">';shell.appendChild(f2);
})();`);
    return base;
  })(),

  // ── ep17: spotlight-seek — 夕阳聚光 ───────────────────────────────
  ep17: layer3Theme({
    name: '道别的勇气 — 夕阳聚光',
    bg: ['#0d0806', '#201410', '#140e08'],
    asset: 'theme-overlay',
    rect: { top: '180px', left: '50%', width: '340px', height: '340px', transform: 'translateX(-50%)' },
    glow: 'rgba(221,136,68,0.5)',
    soft: true,
  }),

  // ── ep18: cannon-aim — 咖啡重逢 ───────────────────────────────────
  ep18: layer3Theme({
    name: '迈出第一步 — 咖啡馆桌面',
    bg: ['#0a0806', '#1a1410', '#100d08'],
    asset: 'theme-overlay',
    rect: { top: '180px', left: '0', width: '100%', height: '35%' },
    glow: 'rgba(221,168,100,0.4)',
    soft: true,
  }),

  // ── ep19: qte-boss-parry — 满月 ───────────────────────────────────
  ep19: layer3Theme({
    name: '满月之约 — 银月',
    bg: ['#06080d', '#0e1828', '#080a14'],
    asset: 'theme-boss',
    hide: '#circle-content',
    rect: { top: '294px', left: '50%', width: '300px', height: '300px', transform: 'translateX(-50%)' },
    glow: 'rgba(180,210,240,0.55)',
  }),

  // ── ep20: maze-escape — 晨雾新路 ──────────────────────────────────
  ep20: layer3Theme({
    name: '找到方向 — 晨雾之路',
    bg: ['#060808', '#101a18', '#080d0c'],
    asset: 'theme-overlay',
    rect: { top: '180px', left: '0', width: '100%', height: '55%' },
    glow: 'rgba(140,200,170,0.45)',
    soft: true,
  }),
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
    var bridgeSubtitle = (CTX.copy && CTX.copy.bootSubtitle) || '';
    var charName = (CTX.character && CTX.character.name) || '';
    var attrName = CTX.attribute || '';

    function showLine() {
      var old = document.getElementById('narrative-overlay');
      if (old) old.remove();

      // After all dialogue lines: show bridge card
      if (idx >= lines.length) {
        if (bridgeSubtitle) {
          idx = -1; // mark bridge shown
          var overlay = document.createElement('div');
          overlay.className = 'narrative-overlay';
          overlay.id = 'narrative-overlay';
          overlay.style.background = 'rgba(0,0,0,0.92)';
          overlay.innerHTML =
            '<div style="font-size:12px;letter-spacing:3px;color:rgba(255,255,255,0.5);margin-bottom:12px;">—— ' + (charName ? charName + '的' : '') + attrName + '考验 ——</div>' +
            '<div style="font-size:22px;font-weight:900;color:#fff;text-align:center;line-height:1.5;margin-bottom:20px;">' + bridgeSubtitle + '</div>' +
            '<div class="tap-hint">点击开始考验</div>';
          overlay.addEventListener('pointerup', function() {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(function() { overlay.remove(); self.scene.start('BootScene'); }, 500);
          });
          shell.appendChild(overlay);
          return;
        }
        self.scene.start('BootScene');
        return;
      }
      if (idx < 0) { self.scene.start('BootScene'); return; }

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
      var _t = bg.texture.getSourceImage();
      var _s = Math.max(W/_t.width, H/_t.height);
      bg.setScale(_s);
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
  var _t = bg.texture.getSourceImage();
  var _s = Math.max(W/_t.width, H/_t.height);
  bg.setScale(_s);
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
      var _t = bg.texture.getSourceImage();
      var _s = Math.max(W/_t.width, H/_t.height);
      bg.setScale(_s);
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
  const storyGame = STORY_GAME[ep];

  const ctxClean = { ...ctx };
  delete ctxClean._template;
  delete ctxClean._htmlSize;
  delete ctxClean._raw;

  // ── 0. Normalize portrait filenames to match actual files on disk ──────────
  // CTX backup may use simplified names (e.g. avatar-lunamiller.png) while
  // batch-assets-werewolf.js generates names with hyphens (avatar-luna-miller.png).
  // Resolve by checking which file actually exists in the game directory.
  const gameDir = path.join(BASE, ep, 'game');
  if (ctxClean.portraits) {
    const avatarFiles = fs.readdirSync(gameDir).filter(f => f.startsWith('avatar-') && f.endsWith('.png'));
    for (const side of ['left', 'right']) {
      const wanted = ctxClean.portraits[side];
      if (wanted && !avatarFiles.includes(wanted)) {
        // Try to find a matching avatar by character name substring
        const namepart = wanted.replace('avatar-', '').replace('.png', '').toLowerCase();
        const match = avatarFiles.find(f => {
          const fpart = f.replace('avatar-', '').replace('.png', '').replace(/-/g, '');
          return fpart === namepart || namepart.includes(fpart) || fpart.includes(namepart);
        });
        if (match) {
          console.log(`  [portrait] ${side}: ${wanted} → ${match}`);
          ctxClean.portraits[side] = match;
        } else {
          // Fallback: copy from character/ directory if available
          const charDir = path.join(BASE, ep, 'character');
          if (fs.existsSync(charDir)) {
            const charFiles = fs.readdirSync(charDir).filter(f => f.endsWith('.png'));
            const charMatch = charFiles.find(f => {
              const cname = f.replace('.png', '').toLowerCase().replace(/ /g, '');
              return cname === namepart || namepart.includes(cname) || cname.includes(namepart);
            });
            if (charMatch) {
              const dest = path.join(gameDir, wanted);
              fs.copyFileSync(path.join(charDir, charMatch), dest);
              console.log(`  [portrait] ${side}: copied ${charMatch} → ${wanted}`);
            }
          }
        }
      }
    }
  }

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
    // Use story-themed title if available
    var ruleTitle = (storyGame ? storyGame.title : rules.title);
    html = html.replace(/>GAME RULE</g, '>' + ruleTitle + '<');
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
      'red-light-green-light': 'Reach 100m to get S rank!<br>Hold RUN on GREEN, STOP on RED.<br>Yellow flash is a bluff \u2014 keep running!<br>Red violation pushes you back -5/-8/-12m<br>Combos reward +5m / +10m bonus<br>Quick release before RED = +3m',
    };
    const origRuleText = RULE_TEXT_MAP[templateId];
    // Use story-themed rules if available, otherwise generic Chinese
    const finalRules = (storyGame ? storyGame.rules : rules.rules);
    if (origRuleText && html.includes(origRuleText)) {
      html = html.replace(origRuleText, finalRules);
    }

    // Apply extra text replacements
    if (rules.extra) {
      for (const [from, to] of rules.extra) {
        html = html.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      }
    }
  }

  // ── Story-themed game identity ──────────────────────────────────────────────
  // Replace Challenge suffix
  html = html.replace(/' Challenge'/g, "' 考验'");
  html = html.replace(/" Challenge"/g, '" 考验"');
  html = html.replace(/Challenge</g, '考验<');
  const TITLE_EN = {
    'qte-hold-release': 'Hold Release', 'will-surge': 'Will Surge', 'conveyor-sort': 'Conveyor Sort',
    'spotlight-seek': 'Spotlight Seek', 'cannon-aim': 'Cannon Aim', 'stardew-fishing': 'Stardew Fishing',
    'qte-boss-parry': 'Boss Parry', 'red-light-green-light': 'Red Light Green Light',
    'lane-dash': 'Lane Dash', 'maze-escape': 'Maze Escape', 'parking-rush': 'Parking Rush',
    'color-match': 'Color Match',
  };
  // Also replace any Chinese generic titles we set earlier
  const TITLE_CN_GENERIC = {
    'qte-hold-release': '蓄力释放', 'will-surge': '意志冲击', 'conveyor-sort': '传送分拣',
    'spotlight-seek': '聚光搜寻', 'cannon-aim': '精准射击', 'stardew-fishing': '心弦拉扯',
    'qte-boss-parry': '正面对决', 'red-light-green-light': '红绿抉择', 'lane-dash': '极速闪避',
    'maze-escape': '迷宫逃脱', 'parking-rush': '紧急调度', 'color-match': '颜色辨析',
  };
  if (storyGame) {
    // Replace English template title → story title
    if (TITLE_EN[templateId]) {
      html = html.replace(new RegExp(TITLE_EN[templateId], 'g'), storyGame.title);
    }
    // Also replace generic Chinese title (some templates already have Chinese in HTML)
    if (TITLE_CN_GENERIC[templateId]) {
      html = html.replace(new RegExp(TITLE_CN_GENERIC[templateId], 'g'), storyGame.title);
    }
    // Also replace <h2> titles in rules cards
    const H2_TITLES = {
      'cannon-aim': 'FIRING RANGE', 'red-light-green-light': '红绿灯冲刺',
      'lane-dash': '极速冲刺', 'parking-rush': 'Parking Rush',
      'qte-boss-parry': 'Boss Parry', 'maze-escape': 'Maze Escape',
    };
    if (H2_TITLES[templateId]) {
      html = html.replace(new RegExp(H2_TITLES[templateId], 'g'), storyGame.title);
    }
  } else if (TITLE_EN[templateId]) {
    html = html.replace(new RegExp(TITLE_EN[templateId], 'g'), TITLE_CN_GENERIC[templateId]);
  }

  // Template-specific boot scene descriptions (full block replacements)
  const BOOT_DESC_REPLACEMENTS = {
    'conveyor-sort': [
      ['Drag falling packages into matching bins.<br>Speed increases! Watch for virus packages.', storyGame ? storyGame.rules : '拖动到对应分类区。<br>速度递增！小心干扰项。'],
      ['Drag packages to matching bins!', sub || '分类整理听到的信息碎片'],
    ],
    'spotlight-seek': [
      ['Tiles flash briefly on a 3x3 grid.<br>Remember and tap the highlighted tile.', storyGame ? storyGame.rules : '方块短暂闪烁。<br>记住位置，快速点击。'],
      ['Watch the spotlight...', '注意观察...'],
      ['Found: ', '找到: '],
    ],
    'stardew-fishing': [
      ['Hold to move the catch bar up.<br>Release to let it fall.<br>Keep bar over the fish to fill gauge.', storyGame ? storyGame.rules : '长按上移捕获条。<br>松开下落。<br>保持在目标上填满进度。'],
      ['Cast your line!', sub || '拉扯真相'],
      ['Track the fish!', '追踪节奏！'],
      ['HOLD TO REEL', '长按拉线'],
      ['Great catch!', '完美！'],
      ['🐟 Caught: ', '🐟 捕获: '],
    ],
    'lane-dash': [
      ['Tap LEFT or RIGHT to switch lanes.<br>Dodge falling obstacles to survive.<br>Speed increases as you progress!', storyGame ? storyGame.rules : '点击左右切换车道。<br>躲避障碍继续前进。<br>速度越来越快！'],
      ['3-LANE SPRINT', storyGame ? storyGame.title : '极速冲刺'],
      ['Swipe to dodge obstacles!', sub || '在黑暗中奔跑'],
      ['Dodged ', '躲避 '],
    ],
    'parking-rush': [
      ['Tap the correct lane to park each car.<br>Get streaks for bonus points!<br>Wrong lane costs time!', storyGame ? storyGame.rules : '点击正确车道停车。<br>连续正确获得加成！<br>选错扣时间！'],
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
      ['Reach 100m to get S rank!<br>Hold RUN on GREEN, STOP on RED.<br>Keep running to accelerate — up to 2x speed!<br>Penalty or release resets speed to 1x<br>Yellow flash is a bluff — keep running!<br>Combos reward +5m / +10m bonus', storyGame ? storyGame.rules : '达到100m获S级！<br>绿灯长按跑，红灯松手停。<br>持续奔跑加速，最高2倍速！<br>被罚或松手速度归零<br>黄灯是虚晃——继续跑！<br>连击奖励 +5m / +10m'],
      ['TRAFFIC LIGHT SPRINT', storyGame ? storyGame.title : '红绿灯冲刺'],
      ['SPEED', '速度'],
      ['STOP!', '停！'],
      ['GO!', '走！'],
      ['READY...', sub || '准备...'],
      ['RUN', '跑'],
    ],
    'qte-boss-parry': [
      ['Choose PARRY, DODGE, or COUNTER<br>Match the attack type<br>Build combo for bonus!', storyGame ? storyGame.rules : '选择格挡、闪避或反击<br>匹配对方攻击类型<br>连击获得加成！'],
      ['Counter with the right action!', '选择正确的应对！'],
      ['Incoming: ', '来袭: '],
      ['Counter \\u2192 ', '应对 → '],
    ],
    'cannon-aim': [
      ['Drag to aim, tap FIRE to shoot.<br>🎯 Big balloon: <b>2pt</b> (no combo)<br>🎯 Medium: <b>20pt</b> (builds combo)<br>🎯 Small gold (top): <b>50pt</b> (builds combo)<br>Only medium & gold build your combo multiplier!', storyGame ? storyGame.rules : '拖动瞄准，点击发射。<br>🎯 大目标：<b>2分</b>（无连击）<br>🎯 中目标：<b>20分</b>（触发连击）<br>🎯 小金色（顶部）：<b>50分</b>（触发连击）<br>只有中、金目标累积连击！'],
      ['FIRING RANGE', storyGame ? storyGame.title : '精准射击'],
    ],
  };

  const descReplacements = BOOT_DESC_REPLACEMENTS[templateId];
  if (descReplacements) {
    for (const [from, to] of descReplacements) {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(escaped, 'g'), to);
    }
  }

  // ── Final story-rules replacement (after all translations) ──
  if (storyGame) {
    // Strategy 1: replace generic Chinese rules if present
    if (rules && rules.rules && html.includes(rules.rules)) {
      html = html.replace(rules.rules, storyGame.rules);
    }
    // Strategy 2: replace BootScene inline rules div (line-height:2 block)
    html = html.replace(
      /(line-height:2;?">)([^<]+(?:<br>[^<]+)*?)(<\/div>)/,
      '$1' + storyGame.rules + '$3'
    );
    // Strategy 3: replace rules-card <p> content if present
    html = html.replace(
      /(<div class="rules-card[^>]*>.*?<p>)([^<]+(?:<[^>]+>[^<]*)*)(<\/p>)/,
      '$1' + storyGame.rules + '$3'
    );
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

  // ── 13. Apply per-episode in-game reskin ────────────────────────────────────
  const reskin = STORY_RESKIN[ep];
  if (reskin) {
    // Category label replacements (conveyor-sort bins)
    if (reskin.categories) {
      for (const [en, cn] of Object.entries(reskin.categories)) {
        html = html.replace(new RegExp("label:'" + en + "'", 'g'), "label:'" + cn + "'");
        html = html.replace(new RegExp("'" + en + "'", 'g'), "'" + cn + "'");
      }
    }
    // Attack/counter labels (qte-boss-parry)
    if (reskin.attacks) {
      for (const [en, cn] of Object.entries(reskin.attacks)) {
        html = html.replace(new RegExp("label: '" + en + "'", 'g'), "label: '" + cn + "'");
        html = html.replace(new RegExp("label:'" + en + "'", 'g'), "label:'" + cn + "'");
      }
    }
    if (reskin.counters) {
      for (const [en, cn] of Object.entries(reskin.counters)) {
        html = html.replace(new RegExp("counter: '" + en + "'", 'g'), "counter: '" + cn + "'");
        html = html.replace(new RegExp("counter:'" + en + "'", 'g'), "counter:'" + cn + "'");
        // Also replace button labels
        html = html.replace(new RegExp("makeCandyButton\\('" + en + "'", 'g'), "makeCandyButton('" + cn + "'");
      }
    }
    if (reskin.dialogue) {
      // Replace the boss dialogue hint
      const origDialogues = [
        'Luna会用质问、施压或命令来压制你。',
        '月光下的每一句话都需要你回应。',
        '选择正确的应对！',
      ];
      // The dialogue was already partly replaced, just set it
      html = html.replace(/Boss will attack with.*?\./, reskin.dialogue);
    }
    // Hint text replacements
    if (reskin.hints) {
      for (const [from, to] of Object.entries(reskin.hints)) {
        html = html.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      }
    }
    // Generic label replacements
    if (reskin.labels) {
      for (const [from, to] of Object.entries(reskin.labels)) {
        html = html.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      }
    }
    // Target label replacements (cannon-aim)
    if (reskin.targetLabels) {
      for (const [from, to] of Object.entries(reskin.targetLabels)) {
        html = html.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      }
    }
  }

  // ── 14. Inject sprite loading + rendering if sprite files exist ─────────────
  // gameDir already defined in step 0 (portrait normalization)
  const spriteFiles = fs.readdirSync(gameDir).filter(f => f.startsWith('sprite-') && f.endsWith('.png'));

  if (spriteFiles.length > 0) {
    // Add sprites to CTX
    const spriteMap = {};
    for (const f of spriteFiles) {
      const key = f.replace('.png', '').replace('sprite-', '');
      spriteMap[key] = f;
    }
    html = html.replace(
      /window\.__EPISODE_CTX__\s*=\s*\{/,
      'window.__EPISODE_CTX__ = {\n  "sprites": ' + JSON.stringify(spriteMap) + ','
    );

    // Build sprite preload lines
    const preloadLines = spriteFiles.map(f => {
      const key = 'ep_sprite_' + f.replace('.png', '').replace('sprite-', '');
      return `    this.load.image('${key}', '${f}');`;
    }).join('\n');

    // Monkey-patch GameScene preload to load sprites
    let spritePatch = `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origPre = gs.preload;
  gs.preload = function() { if (origPre) origPre.call(this);
${preloadLines}
  };
})();`;

    // Template-specific rendering patches
    if (templateId === 'conveyor-sort') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origSpawn = gs.spawnItem;
  gs.spawnItem = function() {
    origSpawn.call(this);
    var last = this.items[this.items.length - 1];
    if (!last || !last.container) return;
    var ct = last.container;
    var children = ct.list || ct.getAll();
    for (var i = 0; i < children.length; i++) {
      if (children[i].type === 'Text' && children[i].text) {
        var sMap = {data:'cat1',code:'cat2',mail:'cat3',media:'cat4',decoy:'decoy'};
        var sKey = 'ep_sprite_' + (sMap[last.targetKey] || last.targetKey);
        if (this.textures.exists(sKey)) {
          var old = children[i];
          var img = this.add.image(0, 2, sKey).setDisplaySize(28, 28).setOrigin(0.5);
          ct.replace(old, img);
          old.destroy();
        }
        break;
      }
    }
  };
})();`;
    }

    // ── qte-hold-release: charge center icon + release burst ──
    if (templateId === 'qte-hold-release') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  // After create: add charge sprite to gauge center
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    if (this.textures.exists('ep_sprite_charge')) {
      this._sprCharge = this.add.image(this.gCx, this.gCy, 'ep_sprite_charge')
        .setDisplaySize(80, 80).setOrigin(0.5).setDepth(2.5).setAlpha(0.85);
    }
  };
  // On release success: show release sprite burst
  var origUpdate = gs.update;
  gs.update = function(time, dt) {
    origUpdate.call(this, time, dt);
    // Pulse charge sprite with charge level
    if (this._sprCharge && this.charge > 0) {
      var s = 1 + (this.charge / 100) * 0.25;
      this._sprCharge.setScale(s * 80 / this._sprCharge.width);
      this._sprCharge.setAlpha(0.6 + (this.charge / 100) * 0.4);
    } else if (this._sprCharge) {
      this._sprCharge.setAlpha(0.5);
    }
  };
  // Hook into releaseCharge to show release sprite
  var origRelease = gs.releaseCharge;
  if (origRelease) {
    gs.releaseCharge = function() {
      var wasCharging = this.isCharging;
      origRelease.call(this);
      if (wasCharging && this.textures.exists('ep_sprite_release')) {
        var rel = this.add.image(this.gCx, this.gCy, 'ep_sprite_release')
          .setDisplaySize(60, 60).setOrigin(0.5).setDepth(50).setAlpha(1);
        this.tweens.add({ targets: rel, scaleX: 2.5, scaleY: 2.5, alpha: 0,
          duration: 500, ease: 'Quad.easeOut', onComplete: function() { rel.destroy(); } });
      }
    };
  }
})();`;
    }

    // ── red-light-green-light: runner img + signal overlay ──
    if (templateId === 'red-light-green-light') {
      spritePatch += `
(function() {
  // Replace runner emoji with sprite image (DOM-based template)
  function replaceRunner() {
    var runner = document.getElementById('track-runner');
    if (!runner) return;
    var ctx = window.__EPISODE_CTX__;
    if (ctx && ctx.sprites && ctx.sprites.runner) {
      runner.innerHTML = '';
      runner.style.fontSize = '0';
      var img = document.createElement('img');
      img.src = ctx.sprites.runner;
      img.style.width = '32px'; img.style.height = '32px';
      img.style.objectFit = 'contain';
      img.style.filter = 'invert(1) drop-shadow(0 0 6px rgba(255,255,255,0.8))';
      runner.appendChild(img);
    }
  }
  // Replace traffic light with signal sprite overlay
  function replaceSignal() {
    var tl = document.getElementById('traffic-light');
    if (!tl) return;
    var ctx = window.__EPISODE_CTX__;
    if (ctx && ctx.sprites && ctx.sprites.signal) {
      var img = document.createElement('img');
      img.src = ctx.sprites.signal;
      img.style.width = '48px'; img.style.height = '48px';
      img.style.objectFit = 'contain';
      img.style.position = 'absolute'; img.style.top = '-8px'; img.style.right = '-56px';
      img.style.filter = 'drop-shadow(0 0 6px rgba(255,255,255,0.3))';
      img.style.pointerEvents = 'none';
      tl.style.position = 'relative';
      tl.appendChild(img);
    }
  }
  // Run after DOM is ready and game starts
  var origBoot = BootScene.prototype.create;
  BootScene.prototype.create = function() {
    origBoot.call(this);
    setTimeout(function() { replaceRunner(); replaceSignal(); }, 100);
  };
  // Also patch GameScene in case runner gets reset
  var gs = GameScene.prototype || GameScene;
  var origGCreate = gs.create;
  gs.create = function() {
    origGCreate.call(this);
    setTimeout(function() { replaceRunner(); replaceSignal(); }, 50);
  };
})();`;
    }

    // ── spotlight-seek: replace target tile with sprite ──
    if (templateId === 'spotlight-seek') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    // Overlay sprite on each target cell after board is built
    if (this.textures.exists('ep_sprite_target') && this.cells) {
      for (var i = 0; i < this.cells.length; i++) {
        var cell = this.cells[i];
        if (cell && cell.x && cell.y) {
          var spr = this.add.image(cell.x, cell.y, 'ep_sprite_target')
            .setDisplaySize(48, 48).setOrigin(0.5).setDepth(12).setAlpha(0);
          cell._sprite = spr;
        }
      }
    }
  };
  // Show sprite when cell is the target
  var origPaint = gs.paintBoard;
  if (origPaint) {
    gs.paintBoard = function() {
      origPaint.call(this);
      if (this.cells) {
        for (var i = 0; i < this.cells.length; i++) {
          var c = this.cells[i];
          if (c && c._sprite) {
            c._sprite.setAlpha(i === this.targetIdx && this.phase === 'show' ? 0.9 : 0);
          }
        }
      }
    };
  }
})();`;
    }

    // ── will-surge: shield center + wave overlay ──
    if (templateId === 'will-surge') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    if (this.textures.exists('ep_sprite_shield') && this.coreCircle) {
      this._sprShield = this.add.image(this.coreCircle.x, this.coreCircle.y, 'ep_sprite_shield')
        .setDisplaySize(70, 70).setOrigin(0.5).setDepth(15).setAlpha(0.7);
    }
  };
  var origUpdate = gs.update;
  gs.update = function(time, dt) {
    origUpdate.call(this, time, dt);
    if (this._sprShield && this.coreCircle) {
      this._sprShield.setPosition(this.coreCircle.x, this.coreCircle.y);
      var s = this.coreCircle.scaleX || 1;
      this._sprShield.setScale(s * 70 / this._sprShield.width);
    }
  };
})();`;
    }

    // ── qte-boss-parry: attack type icons (DOM-based) ──
    if (templateId === 'qte-boss-parry') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    // Map attack keys to sprite keys
    var atkMap = { 'slash': 'ep_sprite_atk1', 'heavy': 'ep_sprite_atk2', 'burst': 'ep_sprite_atk3' };
    var self = this;
    // Patch showAttack to replace symbol with sprite image
    if (this.attacks) {
      this.attacks.forEach(function(atk) {
        var origSym = atk.symbol;
        var sprKey = atkMap[atk.key] || atkMap[Object.keys(atkMap)[0]];
        if (self.textures.exists(sprKey)) {
          atk._spriteKey = sprKey;
        }
      });
    }
  };
  // After showAttack renders the cue symbol, try to overlay a sprite
  var origUpdate = gs.update;
  gs.update = function(time, dt) {
    origUpdate.call(this, time, dt);
    if (this.currentAttack && this.currentAttack._spriteKey && !this._atkSprShown) {
      var cueEl = document.getElementById('boss-cue') || document.getElementById('cue-symbol');
      if (cueEl && this.textures.exists(this.currentAttack._spriteKey)) {
        if (!cueEl.querySelector('img.atk-spr')) {
          var img = document.createElement('img');
          img.className = 'atk-spr';
          img.src = window.__EPISODE_CTX__.sprites[this.currentAttack._spriteKey.replace('ep_sprite_','')] || '';
          img.style.cssText = 'width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 0 8px rgba(255,255,255,0.5));display:block;margin:4px auto;';
          cueEl.appendChild(img);
          this._atkSprShown = true;
        }
      }
    }
    if (!this.currentAttack) this._atkSprShown = false;
  };
})();`;
    }

    // ── cannon-aim: replace balloon targets with sprites ──
    if (templateId === 'cannon-aim') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    this._sprTgtMap = { 1: 'ep_sprite_tgt-big', 2: 'ep_sprite_tgt-med', 3: 'ep_sprite_tgt-sm' };
  };
  var origUpdate = gs.update;
  gs.update = function(time, dt) {
    origUpdate.call(this, time, dt);
    if (this.targets && !this._sprTargetsInit) {
      this._sprTargetsInit = true;
      this._sprTargets = [];
    }
    // Draw sprite overlays on targets
    if (this.targets) {
      // Clean old sprites
      if (this._sprTargets) {
        this._sprTargets.forEach(function(s) { if (s) s.destroy(); });
      }
      this._sprTargets = [];
      var self = this;
      this.targets.forEach(function(t) {
        var key = self._sprTgtMap[t.tier];
        if (key && self.textures.exists(key)) {
          var sz = t.r * 2.5;
          var spr = self.add.image(t.x, t.y, key)
            .setDisplaySize(sz, sz).setOrigin(0.5).setDepth(20).setAlpha(0.85);
          self._sprTargets.push(spr);
        }
      });
    }
  };
})();`;
    }

    // ── stardew-fishing: fish icon + hook decoration ──
    if (templateId === 'stardew-fishing') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    // Replace fish emoji text with sprite
    if (this.textures.exists('ep_sprite_catch') && this.fishIcon) {
      this.fishIcon.setVisible(false);
      this._sprFish = this.add.image(this.fishIcon.x, this.fishIcon.y, 'ep_sprite_catch')
        .setDisplaySize(28, 28).setOrigin(0.5).setDepth(this.fishIcon.depth + 1);
    }
  };
  var origUpdate = gs.update;
  gs.update = function(time, dt) {
    origUpdate.call(this, time, dt);
    if (this._sprFish && this.fishIcon) {
      this._sprFish.setPosition(this.fishIcon.x, this.fishIcon.y);
    }
  };
})();`;
    }

    // ── lane-dash: player + obstacle sprites ──
    if (templateId === 'lane-dash') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    // Create player sprite overlay
    if (this.textures.exists('ep_sprite_player') && this.player) {
      this._sprPlayer = this.add.image(this.player.x, 700, 'ep_sprite_player')
        .setDisplaySize(42, 56).setOrigin(0.5).setDepth(11)
        .setTint(0xffffff);
    }
  };
  var origUpdate = gs.update;
  gs.update = function(time, dt) {
    origUpdate.call(this, time, dt);
    // Follow player position
    if (this._sprPlayer && this.player) {
      this._sprPlayer.setPosition(this.player.x, 700);
    }
    // Add obstacle sprites
    if (this.hazards && this.textures.exists('ep_sprite_obstacle')) {
      for (var i = 0; i < this.hazards.length; i++) {
        var h = this.hazards[i];
        if (!h._spr && h.y > 0) {
          h._spr = this.add.image(h.x, h.y, 'ep_sprite_obstacle')
            .setDisplaySize(40, 64).setOrigin(0.5).setDepth(9).setAlpha(0.8);
        }
        if (h._spr) {
          h._spr.setPosition(h.x, h.y);
          if (h.y > 900) { h._spr.destroy(); h._spr = null; }
        }
      }
    }
  };
})();`;
    }

    // ── maze-escape: player, ghost, key, door ──
    if (templateId === 'maze-escape') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origDraw = gs.drawMaze;
  if (!origDraw) return;
  gs.drawMaze = function() {
    origDraw.call(this);
    var cell = this.cell || 20;
    var offX = this.offX || 0, offY = this.offY || 0;
    // Player sprite
    if (this.textures.exists('ep_sprite_player') && this.playerPos) {
      if (!this._sprP) {
        this._sprP = this.add.image(0, 0, 'ep_sprite_player').setDepth(40).setOrigin(0.5);
      }
      var px = offX + this.playerPos.x * cell + cell / 2;
      var py = offY + this.playerPos.y * cell + cell / 2;
      this._sprP.setPosition(px, py).setDisplaySize(cell * 0.7, cell * 0.7);
    }
    // Ghost sprites
    if (this.textures.exists('ep_sprite_ghost') && this.ghosts) {
      if (!this._sprGhosts) this._sprGhosts = [];
      for (var gi = 0; gi < this.ghosts.length; gi++) {
        var g = this.ghosts[gi];
        if (!this._sprGhosts[gi]) {
          this._sprGhosts[gi] = this.add.image(0, 0, 'ep_sprite_ghost').setDepth(38).setOrigin(0.5);
        }
        var gx = offX + g.x * cell + cell / 2;
        var gy = offY + g.y * cell + cell / 2;
        this._sprGhosts[gi].setPosition(gx, gy).setDisplaySize(cell * 0.8, cell * 0.8);
      }
    }
    // Key sprite
    if (this.textures.exists('ep_sprite_key') && this.keyPos && !this.hasKey) {
      if (!this._sprKey) {
        this._sprKey = this.add.image(0, 0, 'ep_sprite_key').setDepth(35).setOrigin(0.5);
      }
      var kx = offX + this.keyPos.x * cell + cell / 2;
      var ky = offY + this.keyPos.y * cell + cell / 2;
      this._sprKey.setPosition(kx, ky).setDisplaySize(cell * 0.6, cell * 0.6).setVisible(true);
    } else if (this._sprKey) {
      this._sprKey.setVisible(false);
    }
    // Exit door sprite
    if (this.textures.exists('ep_sprite_exit') && this.exitPos) {
      if (!this._sprExit) {
        this._sprExit = this.add.image(0, 0, 'ep_sprite_exit').setDepth(34).setOrigin(0.5);
      }
      var ex = offX + this.exitPos.x * cell + cell / 2;
      var ey = offY + this.exitPos.y * cell + cell / 2;
      this._sprExit.setPosition(ex, ey).setDisplaySize(cell * 0.6, cell * 0.8);
    }
  };
})();`;
    }

    // ── parking-rush: vehicle decoration ──
    if (templateId === 'parking-rush') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    // Add decorative slot sprite if available
    if (this.textures.exists('ep_sprite_slot')) {
      var cx = this.sys.game.config.width / 2;
      this.add.image(cx, 100, 'ep_sprite_slot')
        .setDisplaySize(60, 60).setOrigin(0.5).setDepth(1).setAlpha(0.3);
    }
  };
})();`;
    }

    // ── color-match: decorative moon/effect sprite ──
    if (templateId === 'color-match') {
      spritePatch += `
(function() {
  var gs = GameScene.prototype || GameScene;
  var origCreate = gs.create;
  gs.create = function() {
    origCreate.call(this);
    // Add atmospheric decoration
    if (this.textures.exists('ep_sprite_moon')) {
      this.add.image(this.sys.game.config.width - 50, 80, 'ep_sprite_moon')
        .setDisplaySize(48, 48).setOrigin(0.5).setDepth(1).setAlpha(0.4);
    }
  };
})();`;
    }

    html = html.replace(/(fitShell\(\);)/, '$1\n' + spritePatch);
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

  // ── 15. Inject environment theme (Layer 3) ──────────────────────────────────
  const theme = STORY_THEME[ep];
  if (theme) {
    if (theme.cssOverride) {
      const cssInjection = '\n  /* ═══ STORY_THEME injection ═══ */' + theme.cssOverride + '\n';
      html = html.replace(/<\/style>/, cssInjection + '</style>');
    }
    if (theme.jsOverride) {
      html = html.replace(/(fitShell\(\);)/, '$1\n// ═══ STORY_THEME JS ═══\n' + theme.jsOverride);
    }
  }

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
  const outFile = isVariant ? 'variant-themed.html' : 'index.html';
  const outputPath = path.join(BASE, ep, 'game', outFile);
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✅ ${ep}: ${templateId} → ${outFile} (${(html.length / 1024).toFixed(1)}KB)`);
}
