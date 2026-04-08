#!/usr/bin/env node
/**
 * Fix initShellDOM in all episodes (except EP1) to load portrait images
 * and character names from CTX.
 */
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data', '狼人');

const NEW_INIT = `function initShellDOM() {
  $('title-text').textContent = EPISODE_LABEL + ': ' + EPISODE_TITLE;
  // Portrait images from CTX
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
  } else {
    $('portrait-left').textContent = (CTX.character && CTX.character.name) ? CTX.character.name.charAt(0) : 'P';
  }
  // Character names
  if (CTX.names) {
    var nl = $('name-left');
    var nr = $('name-right');
    if (nl && CTX.names.left) nl.textContent = CTX.names.left;
    if (nr && CTX.names.right) nr.textContent = CTX.names.right;
  }
}`;

const eps = fs.readdirSync(DATA)
  .filter(d => d.startsWith('ep') && d !== 'ep1')
  .sort();

let count = 0;
for (const ep of eps) {
  const f = path.join(DATA, ep, 'game', 'index.html');
  if (!fs.existsSync(f)) continue;

  let html = fs.readFileSync(f, 'utf8');

  // Remove broken initShellDOM (from previous bad injection)
  // Match: function initShellDOM() { ... } up to closing brace at start of line
  const initRe = /function initShellDOM\(\)\s*\{[\s\S]*?\n\}/;
  if (initRe.test(html)) {
    html = html.replace(initRe, NEW_INIT);
    console.log(`${ep}: initShellDOM replaced`);
  } else {
    // No initShellDOM found — inject after EPISODE_TITLE line
    const marker = /((?:var|const) EPISODE_TITLE\s*=[^\n]+\n)/;
    const m = html.match(marker);
    if (m) {
      html = html.replace(m[0], m[0] + '\n' + NEW_INIT + '\ninitShellDOM();\n');
      console.log(`${ep}: initShellDOM injected`);
    } else {
      console.log(`${ep}: FAILED — no marker found`);
      continue;
    }
  }

  // Also clean up any standalone "Apply CTX names" blocks from earlier fix attempts
  html = html.replace(/\n\/\/ Apply CTX names to DOM\nif \(CTX\.names\) \{[\s\S]*?\n\}\n/g, '');
  // Clean up duplicate "Apply CTX" blocks with document.getElementById
  html = html.replace(/\n\/\/ Apply CTX names to DOM\nif \(CTX\.names\) \{[\s\S]*?getElementById[\s\S]*?\n\}\n/g, '');

  fs.writeFileSync(f, html, 'utf8');
  count++;
}

console.log(`\nTotal: ${count} updated`);
