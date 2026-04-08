#!/usr/bin/env node
/**
 * regen-wolven-avatars.js
 * Regenerate avatar portraits for episodes that actually display VS HUD.
 *
 * Only 3 templates show portraits: qte-hold-release, qte-boss-parry, will-surge
 * → Only 6 episodes: ep1, ep5, ep6, ep9, ep10, ep19
 *
 * Improvements over old batch-assets-werewolf.js:
 *   - Prompt: bust portrait (head + shoulders + upper chest) instead of "face only"
 *   - Chroma key: stronger green removal + better edge despill
 *   - Output: 256×256 square (was 200×200)
 *   - Uses character reference art (角色立绘) for consistency
 *
 * Usage:
 *   node scripts/regen-wolven-avatars.js [--force] [--ep 1]
 *
 * Requires: ZENMUX_API_KEY env, sharp
 */
'use strict';
const { execSync } = require('child_process');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Auto-load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const BASE = path.resolve(__dirname, '../data/狼人');
const PORTRAITS_DIR = path.join(BASE, '角色立绘');

const FORCE = process.argv.includes('--force');
const EP_FILTER = (() => {
  const idx = process.argv.indexOf('--ep');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// ─── Only episodes that actually show VS portraits ─────────────────────────
const EPISODES = [
  { ep: '1',  left: { name: 'Sylvia', expr: 'intense, suppressing heartbeat, jaw tight' },
               right: { name: 'James', expr: 'cold authority, stern, arms crossed' } },
  { ep: '5',  left: { name: 'Sylvia', expr: 'exhausted, barely holding on, gritting teeth' },
               right: { name: 'Elara Vance', expr: 'serious, empathetic, professional calm' } },
  { ep: '6',  left: { name: 'Sylvia', expr: 'resolute, confrontational, burning determination' },
               right: { name: 'Luna Miller', expr: 'manipulative, cold smile, calculating' } },
  { ep: '9',  left: { name: 'Sylvia', expr: 'grim determination, accepting pain' },
               right: { name: 'Elara Vance', expr: 'concerned, reaching out, empathetic' } },
  { ep: '10', left: { name: 'Sylvia', expr: 'devastating resolve, ice-cold clarity' },
               right: { name: 'James', expr: 'shocked, shattered, disbelieving' } },
  { ep: '19', left: { name: 'Sylvia', expr: 'transcendent, serene, at peace under moonlight' },
               right: { name: 'Huxley', expr: 'loving, committed, quiet strength' } },
];

// ─── Improved chroma key (stronger green removal + better despill) ──────
async function chromaKeyToAvatar(inputPath, outputPath) {
  const raw = sharp(inputPath);
  const { data, info } = await raw.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const output = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const a = (channels === 4) ? data[i * channels + 3] : 255;

    // Stronger green detection
    const isG = g > 100 && g > r * 1.2 && g > b * 1.2;
    const gn = isG ? Math.min(1, (g - Math.max(r, b)) / g) : 0;

    if (isG && gn > 0.25) {
      // Pure green → fully transparent
      output[i * 4] = r; output[i * 4 + 1] = g; output[i * 4 + 2] = b; output[i * 4 + 3] = 0;
    } else if (gn > 0.03) {
      // Edge fringe → partial transparency + heavier despill
      const despillG = Math.round(g * 0.55 + Math.max(r, b) * 0.45);
      const edgeAlpha = Math.round(a * Math.max(0, 1 - gn * 2.5));
      output[i * 4] = r; output[i * 4 + 1] = despillG; output[i * 4 + 2] = b;
      output[i * 4 + 3] = Math.max(0, edgeAlpha);
    } else {
      output[i * 4] = r; output[i * 4 + 1] = g; output[i * 4 + 2] = b; output[i * 4 + 3] = a;
    }
  }

  const keyed = await sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer();

  // Trim → fit into 256×256 square, face biased toward upper portion
  const trimmed = await sharp(keyed).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const sz = 256, inner = Math.round(sz * 0.88);
  const fitted = await sharp(trimmed.data)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer({ resolveWithObject: true });
  const left = Math.round((sz - fitted.info.width) / 2);
  const top = Math.round((sz - fitted.info.height) * 0.25);

  await sharp({
    create: { width: sz, height: sz, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: fitted.data, left, top }])
    .png()
    .toFile(outputPath);

  const m = await sharp(outputPath).metadata();
  const kb = Math.round(fs.statSync(outputPath).size / 1024);
  return { w: m.width, h: m.height, alpha: m.hasAlpha, kb };
}

// ─── Generate bust portrait via ZenMux ──────────────────────────────────
function generateBust(charName, expression, outputPath) {
  const inputPath = path.join(PORTRAITS_DIR, charName + '.png');
  if (!fs.existsSync(inputPath)) {
    console.error(`  ✗ Reference not found: ${inputPath}`);
    return false;
  }

  // Key change: "bust portrait" not "tight headshot face only"
  const prompt = [
    `Based on this character reference, generate a portrait bust shot showing head, neck, shoulders and upper chest.`,
    `Keep the SAME character appearance: same face, same hair color/style, same clothing style.`,
    `Expression: ${expression}.`,
    `Square 1:1 composition. Face centered, fills about 50-60% of image height.`,
    `Solid bright green #00FF00 chroma key background filling all empty space.`,
    `No other objects, no text, no decorations. Clean anime illustration style.`,
  ].join(' ');

  try {
    execSync(
      `node scripts/zenmux-image.js --prompt "${prompt.replace(/"/g, '\\"')}" --input "${inputPath}" --out "${outputPath}" --model google/gemini-2.5-flash-image`,
      { cwd: path.resolve(__dirname, '..'), stdio: 'pipe', timeout: 120000 }
    );
    return fs.existsSync(outputPath);
  } catch (e) {
    console.error(`  ✗ ZenMux failed for ${charName}: ${e.message.substring(0, 120)}`);
    return false;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const episodes = EP_FILTER
    ? EPISODES.filter(e => e.ep === EP_FILTER)
    : EPISODES;

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  Wolven Avatar Regen — Bust Portraits         ║`);
  console.log(`║  Episodes: ${episodes.length}  Force: ${FORCE}                        ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);

  let success = 0, fail = 0;

  for (const ep of episodes) {
    const gameDir = path.join(BASE, `ep${ep.ep}`, 'game');
    console.log(`\n=== EP${ep.ep} ===`);

    for (const side of ['left', 'right']) {
      const char = ep[side];
      const slug = char.name.toLowerCase().replace(/ /g, '-');
      const avatarFile = `avatar-${slug === 'iris-blackwood' ? 'iris' : slug === 'elara-vance' ? 'elara' : slug === 'luna-miller' ? 'lunamiller' : slug === 'kennedy-barnes' ? 'kennedy' : slug}.png`;
      const avatarPath = path.join(gameDir, avatarFile);
      const greenPath = path.join(gameDir, `bust-${slug}-green.png`);

      if (fs.existsSync(avatarPath) && !FORCE) {
        console.log(`  ✓ ${avatarFile} exists (use --force to regenerate)`);
        success++;
        continue;
      }

      console.log(`  Generating ${char.name} (${side}) — ${char.expr.substring(0, 40)}...`);

      if (generateBust(char.name, char.expr, greenPath)) {
        const r = await chromaKeyToAvatar(greenPath, avatarPath);
        console.log(`  ✓ ${avatarFile}: ${r.w}×${r.h} alpha=${r.alpha} ${r.kb}KB`);
        // Clean up green intermediate
        if (fs.existsSync(greenPath)) fs.unlinkSync(greenPath);
        success++;
      } else {
        fail++;
      }
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`  Success: ${success}  Failed: ${fail}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
