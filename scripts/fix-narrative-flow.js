/**
 * Fix NarrativeScene to support nextScene parameter,
 * and update GameScene finishGame to show narrativeOutro before ResultScene.
 */
const fs = require('fs');
const path = require('path');

function walkDir(dir, filename) {
  let results = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) results = results.concat(walkDir(full, filename));
      else if (f === filename) results.push(full);
    });
  } catch (e) {}
  return results;
}

const files = [
  ...walkDir('packs/attribute-archetypes/games', 'index-v3.html'),
];
const epDirs = fs.readdirSync('data/狼人').filter(d => d.startsWith('ep'));
epDirs.forEach(ep => {
  const f = path.join('data/狼人', ep, 'game', 'index.html');
  if (fs.existsSync(f)) files.push(f);
});

let fixedN = 0, fixedF = 0;

files.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Fix 1: NarrativeScene create() to accept data parameter
  if (html.includes('class NarrativeScene') && !html.includes('data && data.lines')) {
    html = html.replace(
      /create\(\)\s*\{([^]*?)var\s+lines\s*=\s*CTX\.narrative\s*\|\|\s*\[\];/,
      (match, before) => 'create(data) {' + before +
        'var passedLines = (data && data.lines) || null;\n' +
        '    var nextScene = (data && data.nextScene) || \'BootScene\';\n' +
        '    var nextData = (data && data.nextData) || {};\n' +
        '    var lines = passedLines || CTX.narrative || [];'
    );
    html = html.replace(
      /if\s*\(!lines\.length\)\s*\{\s*this\.scene\.start\('BootScene'\);\s*return;\s*\}/,
      "if (!lines.length) { this.scene.start(nextScene, nextData); return; }"
    );
    html = html.replace(
      /self\.scene\.start\('BootScene'\)/,
      "self.scene.start(nextScene, nextData)"
    );
    if (html.includes('data && data.lines')) { fixedN++; changed = true; }
  }

  // Fix 2: finishGame -> narrativeOutro before ResultScene
  if (!html.includes('narrativeOutro')) {
    const pat = /this\.scene\.start\('ResultScene',\s*(\{[^}]+\})\);/;
    const m = html.match(pat);
    if (m) {
      const dataExpr = m[1];
      const replacement = `var resultData = ${dataExpr};\n    if (CTX.narrativeOutro && CTX.narrativeOutro.length) {\n      this.scene.start('NarrativeScene', { lines: CTX.narrativeOutro, nextScene: 'ResultScene', nextData: resultData });\n    } else {\n      this.scene.start('ResultScene', resultData);\n    }`;
      html = html.replace(m[0], replacement);
      fixedF++; changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(f, html);
    console.log('Fixed:', f);
  }
});

console.log(`\nNarrativeScene: ${fixedN}, finishGame: ${fixedF}`);
