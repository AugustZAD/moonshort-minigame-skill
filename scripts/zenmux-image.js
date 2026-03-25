#!/usr/bin/env node
/**
 * zenmux-image.js
 *
 * Generate or edit images via ZenMux Vertex AI protocol.
 * Supports text-to-image and image+text-to-image (editing/compositing).
 *
 * Usage:
 *   node scripts/zenmux-image.js --prompt "a cat" --out out.png
 *   node scripts/zenmux-image.js --prompt "remove background" --input char.jpg --out char_nobg.png
 *   node scripts/zenmux-image.js --prompt "..." --model google/gemini-3-pro-image-preview --out hq.png
 *
 * Environment:
 *   ZENMUX_API_KEY   Required
 *
 * Models:
 *   google/gemini-2.5-flash-image         (fast, cheap)
 *   google/gemini-2.5-flash-image-free    (free tier)
 *   google/gemini-3-pro-image-preview     (highest quality)
 *   google/gemini-3-pro-image-preview-free
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const PROMPT  = getArg('--prompt');
const INPUT   = getArg('--input');
const OUT     = getArg('--out') || 'generated.png';
const MODEL   = getArg('--model') || 'google/gemini-2.5-flash-image';
const API_KEY = process.env.ZENMUX_API_KEY;

if (!PROMPT) {
  console.error('Usage: ZENMUX_API_KEY=... node scripts/zenmux-image.js --prompt "..." [--input img.jpg] [--out out.png] [--model ...]');
  console.error('\nModels:');
  console.error('  google/gemini-2.5-flash-image          (fast, default)');
  console.error('  google/gemini-3-pro-image-preview      (best quality)');
  console.error('  google/gemini-3-pro-image-preview-free (free tier)');
  process.exit(1);
}
if (!API_KEY) {
  console.error('[ERROR] ZENMUX_API_KEY not set.');
  process.exit(1);
}

// ─── Build request ────────────────────────────────────────────────────────────

function buildParts() {
  const parts = [];

  // If input image provided, include it as inlineData
  if (INPUT) {
    const absInput = path.resolve(INPUT);
    if (!fs.existsSync(absInput)) {
      console.error(`[ERROR] Input file not found: ${absInput}`);
      process.exit(1);
    }
    const buf  = fs.readFileSync(absInput);
    const ext  = path.extname(absInput).toLowerCase();
    const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'image/jpeg';
    parts.push({ inlineData: { mimeType: mime, data: buf.toString('base64') } });
    console.log(`[INPUT] ${absInput} (${Math.round(buf.length / 1024)} KB, ${mime})`);
  }

  parts.push({ text: PROMPT });
  return parts;
}

function generateImage() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: buildParts() }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        maxOutputTokens: 4096,
      },
    });

    const reqPath = `/api/vertex-ai/v1beta/models/${MODEL}:generateContent`;
    console.log(`[REQ]  POST zenmux.ai${reqPath}`);
    console.log(`[REQ]  Model: ${MODEL}`);
    console.log(`[REQ]  Prompt: "${PROMPT}"`);

    const options = {
      hostname: 'zenmux.ai',
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`[ERROR] HTTP ${res.statusCode}:`, data.slice(0, 500));
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        try {
          const json = JSON.parse(data);
          if (json.error) {
            console.error('[ERROR] API:', json.error.message);
            return reject(new Error(json.error.message));
          }

          const candidates = json.candidates || [];
          if (candidates.length === 0) {
            console.error('[ERROR] No candidates in response');
            return reject(new Error('No candidates'));
          }

          const parts = candidates[0].content?.parts || [];
          let imageFound = false;

          for (const part of parts) {
            if (part.text) {
              console.log(`[TEXT] ${part.text}`);
            }
            if (part.inlineData) {
              const buf = Buffer.from(part.inlineData.data, 'base64');
              const ext = part.inlineData.mimeType === 'image/jpeg' ? '.jpg' : '.png';
              const outPath = OUT.endsWith(ext) ? OUT : OUT.replace(/\.[^.]+$/, ext);
              const absOut = path.resolve(outPath);
              fs.writeFileSync(absOut, buf);
              console.log(`[SAVED] ${absOut} (${Math.round(buf.length / 1024)} KB, ${part.inlineData.mimeType})`);
              imageFound = true;
            }
          }

          if (!imageFound) {
            console.warn('[WARN] Response contained no image data.');
          }

          resolve();
        } catch (e) {
          console.error('[ERROR] Parse:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (e) => { console.error('[ERROR] Request:', e.message); reject(e); });
    req.setTimeout(180000, () => { console.error('[ERROR] Timeout (3min)'); req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

generateImage()
  .then(() => console.log('[DONE]'))
  .catch(() => process.exit(1));
