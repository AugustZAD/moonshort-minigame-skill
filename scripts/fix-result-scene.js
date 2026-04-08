/**
 * Batch fix for all EP files (except ep2):
 * 1. finishGame: remove narrativeOutro routing → direct ResultScene start
 * 2. ResultScene: add showSettlement() pattern with resultTexts overlay BEFORE settlement UI
 */
const fs = require('fs');
const path = require('path');

const epBase = path.join('data', '狼人');
const epDirs = fs.readdirSync(epBase).filter(d => d.startsWith('ep') && d !== 'ep2');

let fixedFinish = 0, fixedResult = 0, skipped = [];

epDirs.forEach(ep => {
  const f = path.join(epBase, ep, 'game', 'index.html');
  if (!fs.existsSync(f)) return;
  let html = fs.readFileSync(f, 'utf8');
  let changed = false;

  // ── Fix 1: Remove narrativeOutro routing from finishGame ──
  // Class-based format (multi-line)
  const narrativeOutroClassPat = /var resultData = ([^;]+);\s*\n\s*if \(CTX\.narrativeOutro && CTX\.narrativeOutro\.length\) \{\s*\n\s*this\.scene\.start\('NarrativeScene'[^}]+\}\s*\} else \{\s*\n\s*this\.scene\.start\('ResultScene', resultData\);\s*\n\s*\}/;
  let m1 = html.match(narrativeOutroClassPat);
  if (m1) {
    html = html.replace(m1[0], `var resultData = ${m1[1]};\n    this.scene.start('ResultScene', resultData);`);
    fixedFinish++;
    changed = true;
  }

  // Minified format
  const narrativeOutroMinPat = /var resultData = (\{[^}]+\});\s*\n\s*if \(CTX\.narrativeOutro && CTX\.narrativeOutro\.length\) \{\s*\n\s*this\.scene\.start\('NarrativeScene'[^}]+\}\s*\} else \{\s*\n\s*this\.scene\.start\('ResultScene', resultData\);\s*\n\s*\}\}/;
  let m1b = html.match(narrativeOutroMinPat);
  if (!m1 && m1b) {
    html = html.replace(m1b[0], `var resultData = ${m1b[1]};\n    this.scene.start('ResultScene', resultData);}`);
    fixedFinish++;
    changed = true;
  }

  // ── Fix 2: ResultScene — add showSettlement + resultTexts overlay ──
  if (html.includes('showSettlement')) {
    // Already has showSettlement pattern
    skipped.push(ep + ' (already has showSettlement)');
  } else {
    // Detect format: class-based or Phaser.Class minified
    const isClassBased = html.includes('class ResultScene extends Phaser.Scene');
    const isMinified = !isClassBased && html.includes("Phaser.Scene.call(this,'ResultScene')");

    if (isClassBased) {
      changed = fixClassBasedResultScene(html, ep, f) || changed;
      html = fs.readFileSync(f, 'utf8'); // re-read if changed
    } else if (isMinified) {
      changed = fixMinifiedResultScene(html, ep, f) || changed;
      html = fs.readFileSync(f, 'utf8');
    } else {
      skipped.push(ep + ' (unknown ResultScene format)');
    }
  }

  if (changed) {
    // Re-read to get latest
    html = fs.readFileSync(f, 'utf8');
    console.log('Fixed:', f);
  }
});

function fixClassBasedResultScene(html, ep, filepath) {
  // Find the create() method body and extract the settlement UI code
  // Pattern: from "create() {" to the closing "}" of create

  // Strategy: find create() method, extract its body, wrap in showSettlement
  const createStart = html.indexOf('class ResultScene');
  if (createStart === -1) return false;

  // Find create() { after class ResultScene
  const afterClass = html.substring(createStart);
  const createMatch = afterClass.match(/create\(\)\s*\{/);
  if (!createMatch) return false;

  const createIdx = createStart + createMatch.index + createMatch[0].length;

  // Find the body of create() — need to match braces
  let depth = 1, i = createIdx;
  while (i < html.length && depth > 0) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    i++;
  }
  const createEndIdx = i; // position after closing }
  const createBody = html.substring(createIdx, createEndIdx - 1); // exclude final }

  // Find where the settlement UI starts (after rating/modifier computation)
  // We need to split: preamble (rating computation) vs settlement UI

  // Look for the first setVisible or add.rectangle after rating computation
  const ratingLine = createBody.match(/var rating = getRating\([^)]+\)[^;]*;/);
  if (!ratingLine) {
    skipped.push(ep + ' (no getRating in create)');
    return false;
  }

  const ratingEnd = createBody.indexOf(ratingLine[0]) + ratingLine[0].length;
  // Find modifier line
  const afterRating = createBody.substring(ratingEnd);
  const modifierMatch = afterRating.match(/[^]*?(?=\n\s*(?:var rHex|var self|setVisible|this\.add\.rectangle|var GC))/);

  let preambleEnd;
  if (modifierMatch) {
    preambleEnd = ratingEnd + modifierMatch[0].length;
  } else {
    preambleEnd = ratingEnd;
  }

  // Extract preamble (everything up to settlement UI) and settlement body
  const preamble = createBody.substring(0, preambleEnd);
  const settlementBody = createBody.substring(preambleEnd);

  // Build new create() + showSettlement()
  const newCreate = `create() {
${preamble}
    var self = this;

    // Show resultTexts overlay BEFORE settlement UI
    if (CTX.resultTexts && CTX.resultTexts[rating]) {
      ['boot-card','dialogue','score-display','timer-text','surge-bar-area','tug-bar-area','stars-row','result-info','combo-text','hint-text','hud-bar','round-text','gauge-area','result-story'].forEach(function(id) {
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
    }
  }

  showSettlement(T, rating, modifier) {${settlementBody}
  }`;

  // Replace create() body
  const before = html.substring(0, createIdx);
  const after = html.substring(createEndIdx - 1);
  html = before + '\n' + newCreate + '\n' + after;

  // Fix: remove duplicate "var self = this;" if present in settlementBody
  // Fix: ensure T and modifier are accessible
  // Add "var T = window.__V3_THEME__;" at top of showSettlement if not already there
  if (!settlementBody.includes('var T = window.__V3_THEME__')) {
    // T is typically defined in preamble; showSettlement receives it as parameter so it's fine
  }

  fs.writeFileSync(filepath, html);
  fixedResult++;
  return true;
}

function fixMinifiedResultScene(html, ep, filepath) {
  // Minified format: create:function(){...}});
  // Find the create function
  const resultStart = html.indexOf("Phaser.Scene.call(this,'ResultScene')");
  if (resultStart === -1) return false;

  const afterResult = html.substring(resultStart);
  const createMatch = afterResult.match(/create:function\(\)\{/);
  if (!createMatch) return false;

  const createGlobalIdx = resultStart + createMatch.index + createMatch[0].length;

  // Find matching closing — tricky in minified code
  // Count braces
  let depth = 1, i = createGlobalIdx;
  while (i < html.length && depth > 0) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    i++;
  }
  const createEndIdx = i; // after closing }
  const createBody = html.substring(createGlobalIdx, createEndIdx - 1);

  // Find rating computation
  const ratingMatch = createBody.match(/var rating=getRating\([^)]+\)/);
  if (!ratingMatch) {
    skipped.push(ep + ' (no getRating in minified create)');
    return false;
  }

  // For minified, we'll inject the showSettlement pattern
  // Find the point after "var self=this;" or after modifier computation
  const selfMatch = createBody.match(/var self=this;/);
  const modMatch = createBody.match(/var mod(?:Text|ifier)=[^;]+;/);

  // Find all the settlement UI content
  // We need to identify where the main UI starts vs preamble ends
  // In minified: usually after setDepth(0); or after the first setVisible

  // Simpler approach: wrap entire create body
  const newCreate = `create:function(){
this.children.removeAll(true);this.cameras.main.resetFX();var self=this;var T=window.__V3_THEME__;
var rating=getRating(this.finalScore);var modifier=getModifier(rating);
if(CTX.resultTexts&&CTX.resultTexts[rating]){
['boot-card','dialogue','score-display','timer-text','surge-bar-area','tug-bar-area','stars-row','result-info','combo-text','hint-text','hud-bar','hud-row','round-text','sort-legend','gauge-area','result-story'].forEach(function(id){setVisible(id,false);});
clearBtnArea();
var overlay=document.createElement('div');
overlay.className='narrative-overlay';
overlay.id='result-narrative-overlay';
overlay.innerHTML='<div class="narrator">'+EPISODE_LABEL+': '+EPISODE_TITLE+'</div>'+'<div class="line">'+CTX.resultTexts[rating].replace(/\\n/g,'<br>')+'</div>'+'<div class="tap-hint">点击查看结算</div>';
document.getElementById('game-shell').appendChild(overlay);
overlay.addEventListener('pointerup',function(){overlay.style.opacity='0';overlay.style.transition='opacity 0.4s';setTimeout(function(){overlay.remove();self.showSettlement(T,rating,modifier);},400);});
}else{this.showSettlement(T,rating,modifier);}},
showSettlement:function(T,rating,modifier){${createBody}}`;

  const before = html.substring(0, createGlobalIdx);
  const after = html.substring(createEndIdx - 1);
  html = before + '\n' + newCreate + '\n' + after;

  fs.writeFileSync(filepath, html);
  fixedResult++;
  return true;
}

console.log(`\nfinishGame fixed: ${fixedFinish}`);
console.log(`ResultScene fixed: ${fixedResult}`);
if (skipped.length) console.log('Skipped:', skipped.join(', '));
