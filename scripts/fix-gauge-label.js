const fs = require('fs');
const BASE = 'D:/nick/MobAI/minigame-remix/data/狼人';
const eps = ['2','3','4','5','6','7','8','9','10','11','12','12_minor','13','13_minor','14','15','16','17','18','19','20'];
let count = 0;
eps.forEach(ep => {
  const f = BASE + '/ep' + ep + '/game/index.html';
  let html = fs.readFileSync(f, 'utf8');
  // Replace hardcoded 意志 gauge label in GameScene with dynamic ATTRIBUTE
  const old = String.raw`<div class="gauge-label">\u610F\u5FD7</div>`;
  const repl = String.raw`<div class="gauge-label">' + ATTRIBUTE + '</div>`;
  if (html.includes(old)) {
    html = html.replace(old, repl);
    fs.writeFileSync(f, html, 'utf8');
    count++;
  }
});
console.log('Fixed gauge label: ' + count + ' files');

// Also fix the 意志值 score label in GameScene
count = 0;
eps.forEach(ep => {
  const f = BASE + '/ep' + ep + '/game/index.html';
  let html = fs.readFileSync(f, 'utf8');
  const old = String.raw`\u610F\u5FD7\u503C`;
  const repl = String.raw`' + ATTRIBUTE + '\u503C`;
  if (html.includes(old)) {
    // This appears in the ResultScene gauge
    html = html.replace(old, repl);
    fs.writeFileSync(f, html, 'utf8');
    count++;
  }
});
console.log('Fixed score label: ' + count + ' files');
