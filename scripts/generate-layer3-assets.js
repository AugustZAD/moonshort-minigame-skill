#!/usr/bin/env node
/**
 * generate-layer3-assets.js
 *
 * Generates Layer 3 shell-replacement assets for 21 wolven episodes.
 * Uses ZenMux/Gemini text-to-image with #00FF00 chroma key → sharp → transparent PNG.
 *
 * Usage:
 *   node scripts/generate-layer3-assets.js                  # all episodes
 *   node scripts/generate-layer3-assets.js --ep ep1         # single episode
 *   node scripts/generate-layer3-assets.js --eps ep1,ep3,ep5 # specific list
 *   node scripts/generate-layer3-assets.js --force          # regenerate even if exists
 *   node scripts/generate-layer3-assets.js --dry-run        # print only
 *
 * Environment: ZENMUX_API_KEY (loaded from .env automatically)
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Load .env ──
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^(\w+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const PROMPTS = require('./layer3-prompts');

const API_KEY = process.env.ZENMUX_API_KEY;
const MODEL = 'google/gemini-3.1-flash-image-preview';
const BASE = path.join(__dirname, '..', 'data', '狼人');

// ── CLI args ──
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const ONLY_EP = args.includes('--ep') ? args[args.indexOf('--ep') + 1] : null;
const ONLY_EPS = args.includes('--eps') ? args[args.indexOf('--eps') + 1].split(',') : null;

if (!API_KEY && !DRY_RUN) {
  console.error('[ERROR] ZENMUX_API_KEY not set. Check .env');
  process.exit(1);
}

// ── ZenMux Vertex AI call ──
function callZenMux(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], maxOutputTokens: 4096 },
    });

    const options = {
      hostname: 'zenmux.ai',
      path: `/api/vertex-ai/v1beta/models/${MODEL}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 400)}`));
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const parts = json.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.inlineData) return resolve(Buffer.from(p.inlineData.data, 'base64'));
          }
          reject(new Error('No image in response'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(180000, () => { req.destroy(); reject(new Error('timeout 3min')); });
    req.write(body);
    req.end();
  });
}

// ── Chroma key: #00FF00 → transparent, soft edges ──
async function chromaKey(inputBuf, outputPath) {
  const sharp = require('sharp');
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    // Strong green: fully transparent
    if (g > 150 && g > r * 1.4 && g > b * 1.4) {
      pixels[i + 3] = 0;
    }
    // Semi-green (anti-alias edge): partial transparency + green tint removal
    else if (g > 120 && g > r + 25 && g > b + 25) {
      const greenExcess = g - Math.max(r, b);
      pixels[i + 3] = Math.max(0, 255 - greenExcess * 3);
      // Reduce green tint in remaining pixel
      pixels[i + 1] = Math.max(r, b);
    }
  }

  await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

// ── Main ──
async function main() {
  let eps = Object.keys(PROMPTS);
  if (ONLY_EP) eps = eps.filter(e => e === ONLY_EP);
  if (ONLY_EPS) eps = eps.filter(e => ONLY_EPS.includes(e));

  let total = 0, ok = 0, skip = 0, fail = 0;

  for (const ep of eps) {
    const def = PROMPTS[ep];
    const outDir = path.join(BASE, ep, 'game');
    if (!fs.existsSync(outDir)) { console.log(`[SKIP] ${ep}: game dir missing`); continue; }

    console.log(`\n═══ ${ep} — ${def.assets.length} assets ═══`);

    for (const asset of def.assets) {
      total++;
      const outPath = path.join(outDir, `${asset.name}.png`);
      const rel = path.relative(BASE, outPath);

      if (!FORCE && fs.existsSync(outPath)) {
        console.log(`  [EXIST] ${asset.name}`);
        skip++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY] ${asset.name}: ${asset.prompt.slice(0, 90)}...`);
        continue;
      }

      console.log(`  [GEN] ${asset.name}`);
      try {
        const imgBuf = await callZenMux(asset.prompt);
        console.log(`    API → ${Math.round(imgBuf.length / 1024)}KB`);
        await chromaKey(imgBuf, outPath);
        const outSize = fs.statSync(outPath).size;
        console.log(`    ✓ ${rel} (${Math.round(outSize / 1024)}KB)`);
        ok++;
      } catch (e) {
        console.error(`    ✗ ${asset.name}: ${e.message}`);
        fail++;
      }
      // Throttle to avoid rate limit
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log(`\n═══ DONE: ${ok} generated, ${skip} skipped, ${fail} failed (of ${total} total) ═══`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });
