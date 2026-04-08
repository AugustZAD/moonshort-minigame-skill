const fs = require('fs');
const path = require('path');

const epBase = path.join('data', '狼人');
const epDirs = fs.readdirSync(epBase).filter(d => d.startsWith('ep'));

epDirs.forEach(ep => {
  const f = path.join(epBase, ep, 'game', 'index.html');
  if (!fs.existsSync(f)) return;
  const html = fs.readFileSync(f, 'utf8');
  const m = html.match(/<script[^>]*>([\s\S]*)<\/script>/);
  if (!m) { console.log(ep + ': NO SCRIPT'); return; }
  const js = m[1];
  let depth = 0;
  for (let i = 0; i < js.length; i++) {
    const c = js[i];
    if (c === "'" || c === '"' || c === '`') {
      const q = c; i++;
      while (i < js.length && js[i] !== q) { if (js[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '/' && js[i+1] === '/') { while (i < js.length && js[i] !== '\n') i++; continue; }
    if (c === '/' && js[i+1] === '*') { i += 2; while (i < js.length && !(js[i] === '*' && js[i+1] === '/')) i++; i++; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
  }
  console.log(ep + ': depth=' + depth + (depth === 0 ? ' OK' : ' UNBALANCED'));
});
