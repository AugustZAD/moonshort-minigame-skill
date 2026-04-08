const fs = require('fs');
const BASE = 'D:/nick/MobAI/minigame-remix/data/狼人';
const eps = ['2','3','4','5','6','7','8','9','10','11','12','12_minor','13','13_minor','14','15','16','17','18','19','20'];
let count = 0;
eps.forEach(ep => {
  const f = BASE + '/ep' + ep + '/game/index.html';
  let html = fs.readFileSync(f, 'utf8');
  // Use String.raw to match the literal backslash-u sequences in the source file
  const old = String.raw`>\u610F\u5FD7\u8003\u9A8C</div>'`;
  const repl = String.raw`>' + ATTRIBUTE + '\u8003\u9A8C</div>'`;
  if (html.includes(old)) {
    html = html.replace(old, repl);
    fs.writeFileSync(f, html, 'utf8');
    count++;
    console.log('EP' + ep + ': fixed');
  } else {
    console.log('EP' + ep + ': not found or already fixed');
  }
});
console.log('Total fixed: ' + count);
