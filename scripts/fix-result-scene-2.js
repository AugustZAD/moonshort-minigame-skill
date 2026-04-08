/**
 * Fix remaining EP ResultScene files.
 * Strategy: find ResultScene's create() body, split into preamble + settlement,
 * wrap settlement in showSettlement(), add resultTexts overlay.
 */
const fs = require('fs');
const path = require('path');

const targets = ['ep8', 'ep12', 'ep12_minor', 'ep14', 'ep17', 'ep18', 'ep19'];
let fixed = 0;

targets.forEach(ep => {
  const f = path.join('data', '狼人', ep, 'game', 'index.html');
  if (!fs.existsSync(f)) { console.log('NOT FOUND:', f); return; }
  let html = fs.readFileSync(f, 'utf8');

  if (html.includes('showSettlement')) {
    console.log('SKIP (already done):', ep);
    return;
  }

  // Find ResultScene declaration position
  const resultDeclPatterns = [
    /class ResultScene\s*extends\s*Phaser\.Scene\s*\{/,
    /class ResultScene\s*\{/,
    /Phaser\.Scene\.call\(this,\s*'ResultScene'\)/,
  ];

  let resultStartIdx = -1;
  for (const pat of resultDeclPatterns) {
    const m = html.match(pat);
    if (m) { resultStartIdx = html.indexOf(m[0]); break; }
  }
  if (resultStartIdx === -1) { console.log('NO RESULTSCENE:', ep); return; }

  // Find create() after ResultScene declaration
  const afterResult = html.substring(resultStartIdx);
  const isClassBased = /^class ResultScene/.test(afterResult);
  const createPat = isClassBased ? /create\(\)\s*\{/ : /create:\s*function\(\)\s*\{/;
  const createMatch = afterResult.match(createPat);
  if (!createMatch) { console.log('NO CREATE:', ep); return; }

  const createGlobalIdx = resultStartIdx + afterResult.indexOf(createMatch[0]) + createMatch[0].length;

  // Find matching closing brace
  let depth = 1, i = createGlobalIdx;
  while (i < html.length && depth > 0) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    i++;
  }
  const createEndIdx = i;
  const createBody = html.substring(createGlobalIdx, createEndIdx - 1);

  // Debug: show first 200 chars of create body
  console.log(`${ep} create body start: ${createBody.substring(0, 200).replace(/\n/g, '\\n')}`);

  // Find split point: after rating+modifier computation, before first setVisible
  // Look for the rating variable and modifier, then find the next line that starts UI work
  let splitIdx = -1;

  // Pattern A: "var modText = ..." (spaced)
  let m = createBody.match(/var modText\s*=\s*modifier\s*>\s*0\s*\?\s*'[^']*'\s*\+\s*modifier\s*:\s*String\(modifier\);/);
  if (!m) m = createBody.match(/var modText\s*=\s*modifier\s*>\s*0\s*\?\s*'\+'?\s*\+\s*modifier\s*:\s*String\(modifier\)/);
  if (m) {
    splitIdx = createBody.indexOf(m[0]) + m[0].length;
  }

  // Pattern B: "modifier = getModifier(rating), modText = ..." (compact comma-separated)
  if (splitIdx === -1) {
    m = createBody.match(/modText\s*=\s*modifier\s*>\s*0\s*\?[^;]+;/);
    if (m) {
      splitIdx = createBody.indexOf(m[0]) + m[0].length;
    }
  }

  // Pattern C: ep12 — custom rating, then "var modifier = getModifier(rating)"
  if (splitIdx === -1) {
    m = createBody.match(/var modifier\s*=\s*getModifier\(rating\)[^;]*;/);
    if (m) {
      splitIdx = createBody.indexOf(m[0]) + m[0].length;
    }
  }

  // Pattern D: after GC/GRADE_COLORS/rHex definition
  if (splitIdx === -1) {
    m = createBody.match(/var (?:GC|GRADE_COLORS|rHex|rcHex)\s*=\s*[^;]+;/);
    if (m) {
      splitIdx = createBody.indexOf(m[0]) + m[0].length;
    }
  }

  if (splitIdx === -1) {
    console.log('NO SPLIT POINT:', ep);
    return;
  }

  const preamble = createBody.substring(0, splitIdx);
  const settlementBody = createBody.substring(splitIdx);

  const hasSelf = /var self\s*=\s*this/.test(preamble);
  const hasT = /var T\s*=\s*window\.__V3_THEME__/.test(preamble);

  // Build overlay code
  const overlayBlock = `
    ${hasSelf ? '' : 'var self = this;'}
    // Show resultTexts overlay BEFORE settlement UI
    if (CTX.resultTexts && CTX.resultTexts[rating]) {
      ['boot-card','dialogue','score-display','timer-text','surge-bar-area','tug-bar-area','stars-row','result-info','combo-text','hint-text','hud-bar','round-text','gauge-area','result-story','maze-info','maze-label','dpad-area','catch-row','water-surface','status-text','reel-btn','level-info','streak-text','lane-btns','round-bar-wrap','round-row','mode-hint','answer-timer','answer-grid','color-card-wrap','card-question','card-text'].forEach(function(id) {
        setVisible(id, false);
      });
      clearBtnArea();
      var overlay = document.createElement('div');
      overlay.className = 'narrative-overlay';
      overlay.id = 'result-narrative-overlay';
      overlay.innerHTML =
        '<div class="narrator">' + EPISODE_LABEL + ': ' + EPISODE_TITLE + '</div>' +
        '<div class="line">' + CTX.resultTexts[rating].replace(/\\n/g, '<br>') + '</div>' +
        '<div class="tap-hint">点击查看结算</div>';
      document.getElementById('game-shell').appendChild(overlay);
      overlay.addEventListener('pointerup', function() {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s';
        setTimeout(function() {
          overlay.remove();
          self.showSettlement(T, rating, modifier);
        }, 400);
      });
    } else {
      this.showSettlement(T, rating, modifier);
    }`;

  let newCode;
  if (isClassBased) {
    newCode = `${createMatch[0]}
${preamble}
${overlayBlock}
  }

  showSettlement(T, rating, modifier) {
    var modText = modifier > 0 ? '+' + modifier : String(modifier);${settlementBody}
  }`;
  } else {
    // Phaser.Class format
    newCode = `${createMatch[0]}
${preamble}
${overlayBlock}
  },
  showSettlement: function(T, rating, modifier) {
    var modText = modifier > 0 ? '+' + modifier : String(modifier);${settlementBody}
  }`;
  }

  // Replace from createMatch[0] start to createEndIdx-1
  const createStartGlobal = resultStartIdx + afterResult.indexOf(createMatch[0]);
  const before = html.substring(0, createStartGlobal);
  const after = html.substring(createEndIdx - 1);
  html = before + newCode + after;

  fs.writeFileSync(f, html);
  fixed++;
  console.log('FIXED:', ep);
});

console.log('\nTotal fixed:', fixed);
