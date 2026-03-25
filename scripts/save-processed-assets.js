#!/usr/bin/env node
/**
 * save-processed-assets.js
 *
 * Tiny HTTP server that receives base64 image data POSTed from the browser
 * asset processor page and saves them to data/ep5/processed/.
 *
 * Usage:
 *   1. node scripts/save-processed-assets.js        (starts on port 3334)
 *   2. Open _asset-processor.html in preview browser
 *   3. Assets are saved automatically when processing completes
 */
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'data', 'ep5', 'processed');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let saved = 0;
const EXPECTED = 3;

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url.startsWith('/save/')) {
    const filename = decodeURIComponent(req.url.slice(6));
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { data, format } = JSON.parse(body);
        const ext = format === 'jpeg' ? '.jpg' : '.png';
        const buf = Buffer.from(data, 'base64');
        const fp  = path.join(OUT, filename + ext);
        fs.writeFileSync(fp, buf);
        console.log(`[SAVED] ${fp} (${Math.round(buf.length / 1024)} KB)`);
        saved++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: fp }));
        if (saved >= EXPECTED) {
          console.log('\n[DONE] All assets saved. Shutting down.');
          setTimeout(() => process.exit(0), 500);
        }
      } catch (e) {
        console.error('[ERR]', e.message);
        res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(3334, () => {
  console.log('[SAVE SERVER] Listening on http://localhost:3334');
  console.log('[SAVE SERVER] Waiting for asset processor to POST data...');
});
