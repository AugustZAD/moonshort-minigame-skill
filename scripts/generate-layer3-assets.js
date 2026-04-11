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
const DEFAULT_MODEL = 'google/gemini-3.1-flash-image-preview';
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
function callZenMux(prompt, model) {
  const useModel = model || DEFAULT_MODEL;
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], maxOutputTokens: 4096 },
    });

    const options = {
      hostname: 'zenmux.ai',
      path: `/api/vertex-ai/v1beta/models/${useModel}:generateContent`,
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

// ── Chroma key: #00FF00 → transparent, feathered edges ──
// Two-pass green removal → alpha erosion (1px inward shrink) → alpha Gaussian blur
// (sigma ~1.8) so edges fade softly instead of hard-cutting. RGB is never blurred
// (would muddy the painting); only the alpha channel is feathered.
async function chromaKey(inputBuf, outputPath) {
  const sharp = require('sharp');
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  const W = info.width, H = info.height;

  // ── Pass 1: green removal ──
  // CRITICAL: Zero the RGB of hard-green pixels (not just alpha). Otherwise the
  // Pass 2 alpha blur spreads soft alpha outward into alpha=0 pixels whose RGB
  // is still #00FF00, and bright green leaks back into the visible fringe.
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    if (g > 150 && g > r * 1.4 && g > b * 1.4) {
      pixels[i]     = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 0;
    } else if (g > 120 && g > r + 25 && g > b + 25) {
      const greenExcess = g - Math.max(r, b);
      pixels[i + 3] = Math.max(0, 255 - greenExcess * 3);
      pixels[i + 1] = Math.max(r, b);
    }
  }

  // ── Pass 2: extract alpha, erode 1px (shrink opaque region to hide
  //   green halo bleeding 1-2px past the chroma threshold), then blur
  //   with sigma 1.8 for feathered edges. ──
  const alphaBuf = Buffer.alloc(W * H);
  for (let i = 0; i < pixels.length; i += 4) alphaBuf[i / 4] = pixels[i + 3];

  // 1px erosion: each pixel becomes the MIN of its 4-neighborhood — any pixel
  // bordering a transparent neighbor gets pulled toward 0. This undoes the
  // outer 1px of opacity that still carries green fringe.
  const eroded = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      let m = alphaBuf[idx];
      if (x > 0)       m = Math.min(m, alphaBuf[idx - 1]);
      if (x < W - 1)   m = Math.min(m, alphaBuf[idx + 1]);
      if (y > 0)       m = Math.min(m, alphaBuf[idx - W]);
      if (y < H - 1)   m = Math.min(m, alphaBuf[idx + W]);
      eroded[idx] = m;
    }
  }

  // Gaussian blur the alpha channel only.
  const blurredAlpha = await sharp(eroded, { raw: { width: W, height: H, channels: 1 } })
    .blur(1.8)
    .raw()
    .toBuffer();

  // Recombine: keep original RGB, swap alpha with blurred value.
  for (let i = 0; i < pixels.length; i += 4) pixels[i + 3] = blurredAlpha[i / 4];

  await sharp(pixels, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

// ── Radial vignette: multiply RGB toward pure black outside inner radius ──
// Produces a PNG with mathematically guaranteed #000000 at corners and a
// smooth painterly rolloff from subject to black. Designed to pair with CSS
// `mix-blend-mode: screen` (black → transparent) for bullet-proof edge blend
// without any chroma-key color conflicts.
//
// opts:
//   inner   — fraction (0-1) of half-diagonal that stays 100% opaque (default 0.55)
//   outer   — fraction where multiplier reaches 0 (default 0.98)
//   cx, cy  — center in normalized 0-1 space (default 0.5, 0.5)
//   ellipse — [rx, ry] normalized radii, overrides circular distance (optional)
//   gamma   — falloff curve exponent (default 1.6, higher = tighter rolloff)
async function applyVignette(inputBuf, outputPath, opts = {}) {
  const sharp = require('sharp');
  const { data, info } = await sharp(inputBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const pixels = Buffer.from(data);

  const inner = opts.inner ?? 0.55;
  const outer = opts.outer ?? 0.98;
  const cx    = (opts.cx ?? 0.5) * W;
  const cy    = (opts.cy ?? 0.5) * H;
  const gamma = opts.gamma ?? 1.6;
  const ellipse = opts.ellipse; // [rx, ry] in fraction of half-width/height

  // Normalization: for circle mode use the INSCRIBED circle (half of the
  // shorter side), so `outer = 1.0` hits pure black at the edge midpoint
  // — and all corners (farther from center than the edge midpoint) are
  // already past `outer`, also pure black. Prevents the "visible square
  // with dark corners + bright edges" artifact that half-diagonal caused.
  const halfMin = Math.min(W, H) / 2;
  const rxN = ellipse ? ellipse[0] * (W / 2) : null;
  const ryN = ellipse ? ellipse[1] * (H / 2) : null;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let t; // normalized distance 0 (center) -> 1 (inner circle radius)
      if (ellipse) {
        const dx = (x - cx) / rxN;
        const dy = (y - cy) / ryN;
        t = Math.sqrt(dx * dx + dy * dy);
      } else {
        const dx = x - cx;
        const dy = y - cy;
        t = Math.sqrt(dx * dx + dy * dy) / halfMin;
      }

      // Multiplier: 1 inside `inner`, smooth rolloff to 0 at `outer`, hard 0 beyond
      let m;
      if (t <= inner) {
        m = 1;
      } else if (t >= outer) {
        m = 0;
      } else {
        const u = (t - inner) / (outer - inner);     // 0 → 1 in rolloff band
        const s = 1 - Math.pow(u, gamma);             // power falloff
        // Smoothstep for painterly feel on the tail
        m = s * s * (3 - 2 * s);
      }

      const idx = (y * W + x) * 3;
      pixels[idx]     = Math.round(pixels[idx]     * m);
      pixels[idx + 1] = Math.round(pixels[idx + 1] * m);
      pixels[idx + 2] = Math.round(pixels[idx + 2] * m);
    }
  }

  await sharp(pixels, { raw: { width: W, height: H, channels: 3 } })
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

      const modeTag = asset.vignette ? ' (vignette)' : asset.noChromaKey ? ' (no chroma)' : '';
      console.log(`  [GEN] ${asset.name}${modeTag}${asset.model ? ' model=' + asset.model : ''}`);
      try {
        const imgBuf = await callZenMux(asset.prompt, asset.model);
        console.log(`    API → ${Math.round(imgBuf.length / 1024)}KB`);
        if (asset.vignette) {
          // Post-process radial vignette → pure black corners for mix-blend-mode: screen
          await applyVignette(imgBuf, outPath, asset.vignette);
        } else if (asset.noChromaKey) {
          // Direct write — no transparency processing
          fs.writeFileSync(outPath, imgBuf);
        } else {
          await chromaKey(imgBuf, outPath);
        }
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
