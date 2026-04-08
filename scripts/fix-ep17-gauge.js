const fs = require('fs');
const f = 'D:/nick/MobAI/minigame-remix/data/狼人/ep17/game/index.html';
let html = fs.readFileSync(f, 'utf8');

// Replace all remaining 长按蓄力 with 长按积蓄 in JS code (not in rules description)
// Line 960: gauge-status reset
// Line 978: hold button label
// Line 1134: hold button release text
// Line 1139: charge reset text
const old = String.raw`\u957F\u6309\u84C4\u529B`;
const repl = String.raw`\u957F\u6309\u79EF\u84C4`;

let count = 0;
while (html.includes(old)) {
  html = html.replace(old, repl);
  count++;
}

fs.writeFileSync(f, html, 'utf8');
console.log('Replaced ' + count + ' occurrences of 长按蓄力 → 长按积蓄 in EP17');
