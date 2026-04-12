#!/usr/bin/env node
/**
 * generate-wolven-sprites.js
 *
 * Generates story-themed game sprites for all 22 wolven episodes via ZenMux/Gemini.
 * Each sprite is generated with a bright green (#00FF00) background for chroma key removal.
 * Output: data/狼人/ep{N}/game/sprite-*.png (64x64 to 128x128 transparent PNGs)
 *
 * Usage:
 *   node scripts/generate-wolven-sprites.js              # Generate all
 *   node scripts/generate-wolven-sprites.js --ep ep3      # Generate for one episode
 *   node scripts/generate-wolven-sprites.js --dry-run     # Print prompts only
 *
 * Environment: ZENMUX_API_KEY (from .env)
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^(\w+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const API_KEY = process.env.ZENMUX_API_KEY;
const MODEL = 'google/gemini-3.1-flash-image-preview';
const BASE = path.join(__dirname, '..', 'data', '狼人');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_EP = args.includes('--ep') ? args[args.indexOf('--ep') + 1] : null;

if (!API_KEY && !DRY_RUN) {
  console.error('[ERROR] ZENMUX_API_KEY not set. Add to .env or export.');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SPRITE DEFINITIONS — per episode, what to generate
// ═══════════════════════════════════════════════════════════════════════════════

// Common prompt suffix for all sprites
const SPRITE_SUFFIX = ', simple flat icon style, centered on bright green #00FF00 chroma key background, 128x128 pixels, clean edges, no shadow, game UI icon';

const SPRITE_DEFS = {
  // ── qte-hold-release ──
  ep1: {
    template: 'qte-hold-release',
    sprites: [
      { name: 'sprite-charge', prompt: 'a clenched fist glowing with restrained emotion, dark purple energy aura' + SPRITE_SUFFIX },
      { name: 'sprite-release', prompt: 'an open hand releasing a burst of white light, emotional breakthrough moment' + SPRITE_SUFFIX },
    ]
  },
  ep10: {
    template: 'qte-hold-release',
    sprites: [
      { name: 'sprite-charge', prompt: 'a throat being choked by a dark hand, struggling to breathe, dramatic' + SPRITE_SUFFIX },
      { name: 'sprite-release', prompt: 'lips parting to speak with a bright white word bubble emerging' + SPRITE_SUFFIX },
    ]
  },

  // ── red-light-green-light ──
  ep2: {
    template: 'red-light-green-light',
    sprites: [
      { name: 'sprite-runner', prompt: 'a feminine silhouette standing tall and defiant, side view, elegant dress, dark atmosphere' + SPRITE_SUFFIX },
      { name: 'sprite-signal', prompt: 'a wolf eye glowing amber, watching intensely, dark background' + SPRITE_SUFFIX },
    ]
  },
  ep12_minor: {
    template: 'red-light-green-light',
    sprites: [
      { name: 'sprite-runner', prompt: 'a woman sitting rigidly in a formal chair, tense posture, side view' + SPRITE_SUFFIX },
      { name: 'sprite-signal', prompt: 'a gavel or judge hammer, formal and authoritative' + SPRITE_SUFFIX },
    ]
  },

  // ── conveyor-sort ──
  ep3: {
    template: 'conveyor-sort',
    sprites: [
      { name: 'sprite-cat1', prompt: 'a folded paper document with handwritten text, evidence file, warm parchment color' + SPRITE_SUFFIX },
      { name: 'sprite-cat2', prompt: 'a magnifying glass over a fingerprint, detective clue icon' + SPRITE_SUFFIX },
      { name: 'sprite-cat3', prompt: 'a sealed envelope with a wax seal, secret letter' + SPRITE_SUFFIX },
      { name: 'sprite-cat4', prompt: 'a thick leather-bound dossier folder with a classified stamp, archive file, dark brown' + SPRITE_SUFFIX },
      { name: 'sprite-decoy', prompt: 'a crumpled paper ball with a red X mark, false evidence, lie' + SPRITE_SUFFIX },
    ]
  },
  ep13_minor: {
    template: 'conveyor-sort',
    sprites: [
      { name: 'sprite-cat1', prompt: 'a hiking backpack with supplies, survival gear icon' + SPRITE_SUFFIX },
      { name: 'sprite-cat2', prompt: 'a folded map with a route marked in red, navigation icon' + SPRITE_SUFFIX },
      { name: 'sprite-cat3', prompt: 'a small radio transmitter, signal device, communication icon' + SPRITE_SUFFIX },
      { name: 'sprite-cat4', prompt: 'a worn treasure map with compass rose and terrain markings, exploration map icon' + SPRITE_SUFFIX },
      { name: 'sprite-decoy', prompt: 'a bear trap partially hidden in leaves, danger trap icon' + SPRITE_SUFFIX },
    ]
  },

  // ── spotlight-seek ──
  ep4: {
    template: 'spotlight-seek',
    sprites: [
      { name: 'sprite-target', prompt: 'a chess queen piece, elegant black and gold, power symbol' + SPRITE_SUFFIX },
      { name: 'sprite-flash', prompt: 'a spotlight beam from above, theatrical stage light' + SPRITE_SUFFIX },
    ]
  },
  ep17: {
    template: 'spotlight-seek',
    sprites: [
      { name: 'sprite-target', prompt: 'a woman waving goodbye with a gentle smile, warm farewell silhouette' + SPRITE_SUFFIX },
      { name: 'sprite-flash', prompt: 'a warm golden sunray breaking through clouds, hope light' + SPRITE_SUFFIX },
    ]
  },

  // ── will-surge ──
  ep5: {
    template: 'will-surge',
    sprites: [
      { name: 'sprite-wave', prompt: 'a dark purple shockwave ring expanding outward, pressure wave, menacing' + SPRITE_SUFFIX },
      { name: 'sprite-shield', prompt: 'a glowing translucent shield, willpower barrier, blue-white energy dome' + SPRITE_SUFFIX },
    ]
  },
  ep9: {
    template: 'will-surge',
    sprites: [
      { name: 'sprite-wave', prompt: 'a dark red heartbeat line forming a sharp spike, life-threatening pulse' + SPRITE_SUFFIX },
      { name: 'sprite-shield', prompt: 'a hand gripping a glowing vial firmly, determination, medicine bottle' + SPRITE_SUFFIX },
    ]
  },

  // ── qte-boss-parry ──
  ep6: {
    template: 'qte-boss-parry',
    sprites: [
      { name: 'sprite-atk1', prompt: 'a sharp pointed finger accusing someone, interrogation gesture' + SPRITE_SUFFIX },
      { name: 'sprite-atk2', prompt: 'a heavy fist slamming on a table, authority pressure' + SPRITE_SUFFIX },
      { name: 'sprite-atk3', prompt: 'a crown or alpha symbol with commanding aura, wolf pack leader' + SPRITE_SUFFIX },
    ]
  },
  ep19: {
    template: 'qte-boss-parry',
    sprites: [
      { name: 'sprite-atk1', prompt: 'a gentle hand reaching out, tentative offer, moonlight' + SPRITE_SUFFIX },
      { name: 'sprite-atk2', prompt: 'a heart shape glowing warmly, confession of love, soft pink' + SPRITE_SUFFIX },
      { name: 'sprite-atk3', prompt: 'a crescent moon with two wolves howling together, eternal bond' + SPRITE_SUFFIX },
    ]
  },

  // ── cannon-aim ──
  ep7: {
    template: 'cannon-aim',
    sprites: [
      { name: 'sprite-tgt-big', prompt: 'a large crack or wound in a wall, obvious vulnerability, dark' + SPRITE_SUFFIX },
      { name: 'sprite-tgt-med', prompt: 'a small keyhole with light shining through, hidden weakness' + SPRITE_SUFFIX },
      { name: 'sprite-tgt-sm', prompt: 'a tiny glowing ember of truth, precious and fragile, golden spark' + SPRITE_SUFFIX },
    ]
  },
  ep18: {
    template: 'cannon-aim',
    sprites: [
      { name: 'sprite-tgt-big', prompt: 'a large coffee cup steaming, café reunion, warm brown' + SPRITE_SUFFIX },
      { name: 'sprite-tgt-med', prompt: 'a shy smile expression icon, subtle warmth, soft pink' + SPRITE_SUFFIX },
      { name: 'sprite-tgt-sm', prompt: 'two intertwined hands, connection moment, golden glow, tiny and precious' + SPRITE_SUFFIX },
    ]
  },

  // ── stardew-fishing ──
  ep8: {
    template: 'stardew-fishing',
    sprites: [
      { name: 'sprite-catch', prompt: 'a glowing speech bubble with truth inside, interrogation, dark purple' + SPRITE_SUFFIX },
      { name: 'sprite-hook', prompt: 'a sharp question mark hook, pulling out secrets, silver metallic' + SPRITE_SUFFIX },
    ]
  },
  ep15: {
    template: 'stardew-fishing',
    sprites: [
      { name: 'sprite-catch', prompt: 'a pair of lungs breathing deeply, healing breath, soft blue' + SPRITE_SUFFIX },
      { name: 'sprite-hook', prompt: 'a heartbeat line stabilizing from erratic to calm, medical recovery' + SPRITE_SUFFIX },
    ]
  },

  // ── lane-dash ──
  ep12: {
    template: 'lane-dash',
    sprites: [
      { name: 'sprite-player', prompt: 'a running woman silhouette with flowing hair, escaping urgently, side view' + SPRITE_SUFFIX },
      { name: 'sprite-obstacle', prompt: 'iron window bars or locked gate, prison obstacle, dark metal' + SPRITE_SUFFIX },
      { name: 'sprite-collect', prompt: 'a window opening with moonlight, escape route, hope' + SPRITE_SUFFIX },
    ]
  },
  ep14: {
    template: 'lane-dash',
    sprites: [
      { name: 'sprite-player', prompt: 'a woman running through forest, survival escape, nature setting, side view silhouette' + SPRITE_SUFFIX },
      { name: 'sprite-obstacle', prompt: 'tangled dark tree branches blocking path, forest obstacle' + SPRITE_SUFFIX },
      { name: 'sprite-collect', prompt: 'a small first aid kit or healing herb, forest survival supply' + SPRITE_SUFFIX },
    ]
  },

  // ── maze-escape ──
  ep13: {
    template: 'maze-escape',
    sprites: [
      { name: 'sprite-player', prompt: 'a woman with a backpack walking determinedly, adventure traveler, side view' + SPRITE_SUFFIX },
      { name: 'sprite-ghost', prompt: 'a menacing wolf shadow with glowing amber eyes, predator stalking' + SPRITE_SUFFIX },
      { name: 'sprite-key', prompt: 'a golden compass pointing north, direction finder, adventure' + SPRITE_SUFFIX },
      { name: 'sprite-exit', prompt: 'a border crossing gate with an open path beyond, freedom exit' + SPRITE_SUFFIX },
    ]
  },
  ep20: {
    template: 'maze-escape',
    sprites: [
      { name: 'sprite-player', prompt: 'a confident woman walking forward, new beginning, warm light, side view' + SPRITE_SUFFIX },
      { name: 'sprite-ghost', prompt: 'swirling fog or mist, gentle confusion cloud, not threatening' + SPRITE_SUFFIX },
      { name: 'sprite-key', prompt: 'a glowing compass rose or star guiding the way, navigation symbol' + SPRITE_SUFFIX },
      { name: 'sprite-exit', prompt: 'a warm lit doorway of a new home, welcoming entrance' + SPRITE_SUFFIX },
    ]
  },

  // ── parking-rush ──
  ep11: {
    template: 'parking-rush',
    sprites: [
      { name: 'sprite-car', prompt: 'a formal legal document or decree scroll, law and order' + SPRITE_SUFFIX },
      { name: 'sprite-slot', prompt: 'a podium or speaking platform, parliament debate, formal setting' + SPRITE_SUFFIX },
    ]
  },

  // ── color-match ──
  ep16: {
    template: 'color-match',
    sprites: [
      { name: 'sprite-moon', prompt: 'a full moon with soft silver glow, romantic moonlight, night sky' + SPRITE_SUFFIX },
      { name: 'sprite-face', prompt: 'a wolf paw print gradually transforming into a human handprint, identity shift' + SPRITE_SUFFIX },
    ]
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  API CALL
// ═══════════════════════════════════════════════════════════════════════════════

function callZenMux(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        maxOutputTokens: 4096,
      },
    });

    const reqPath = `/api/vertex-ai/v1beta/models/${MODEL}:generateContent`;

    // Proxy support (China mainland)
    const proxyUrl = process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.https_proxy;
    let reqFn = https.request;
    let options = {
      hostname: 'zenmux.ai',
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    if (proxyUrl) {
      try {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        options.agent = new HttpsProxyAgent(proxyUrl);
        console.log(`  [PROXY] Using ${proxyUrl}`);
      } catch (e) {
        // If https-proxy-agent not installed, try without proxy
        console.log(`  [WARN] https-proxy-agent not available, trying direct connection`);
      }
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const parts = json.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              return resolve(Buffer.from(part.inlineData.data, 'base64'));
            }
          }
          reject(new Error('No image in response'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(180000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Simple chroma key removal using sharp (if available) or canvas ───────────
async function removeChromaKey(inputBuf, outputPath) {
  // Try using sharp for chroma key removal
  try {
    const sharp = require('sharp');
    const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = Buffer.from(data);

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      // Green screen detection: high green, low red and blue
      if (g > 150 && g > r * 1.4 && g > b * 1.4) {
        pixels[i + 3] = 0; // Set alpha to 0
      }
    }

    await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);

    return true;
  } catch (e) {
    // If sharp not available, save raw and warn
    fs.writeFileSync(outputPath, inputBuf);
    console.warn(`  [WARN] sharp not available, saved raw image (run: npm install sharp)`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const eps = ONLY_EP ? [ONLY_EP] : Object.keys(SPRITE_DEFS).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''));
    const nb = parseInt(b.replace(/\D/g, ''));
    return na - nb || a.localeCompare(b);
  });

  let total = 0, success = 0, failed = 0;

  for (const ep of eps) {
    const def = SPRITE_DEFS[ep];
    if (!def) { console.log(`[SKIP] ${ep}: no sprite definitions`); continue; }

    const outDir = path.join(BASE, ep, 'game');
    if (!fs.existsSync(outDir)) { console.log(`[SKIP] ${ep}: game dir not found`); continue; }

    console.log(`\n═══ ${ep} (${def.template}) — ${def.sprites.length} sprites ═══`);

    for (const sprite of def.sprites) {
      total++;
      const outPath = path.join(outDir, sprite.name + '.png');
      console.log(`  [${sprite.name}] ${sprite.prompt.substring(0, 80)}...`);

      if (DRY_RUN) {
        console.log(`  [DRY] Would save to: ${outPath}`);
        success++;
        continue;
      }

      // Skip if already exists
      if (fs.existsSync(outPath)) {
        console.log(`  [EXIST] Already generated, skipping`);
        success++;
        continue;
      }

      try {
        const imgBuf = await callZenMux(sprite.prompt);
        console.log(`  [API] Got ${Math.round(imgBuf.length / 1024)}KB image`);

        await removeChromaKey(imgBuf, outPath);
        console.log(`  [OK] Saved: ${outPath}`);
        success++;

        // Rate limit: wait 1s between calls
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        console.error(`  [FAIL] ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\n═══ RESULTS ═══`);
  console.log(`Total: ${total}, Success: ${success}, Failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
