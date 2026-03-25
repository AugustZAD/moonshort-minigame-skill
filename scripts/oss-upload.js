#!/usr/bin/env node
/**
 * OSS Upload Script
 *
 * Usage:
 *   node scripts/oss-upload.js <game-id>          — 上传指定游戏的资源
 *   node scripts/oss-upload.js <game-id> --html    — 同时生成在线版 HTML
 *   node scripts/oss-upload.js --list               — 列出 OSS 上已有的资源
 *
 * 上传目录结构:
 *   games/<game-id>/audio/*    → audio/<game-id>/*
 *   games/<game-id>/images/*   → images/<game-id>/*
 *   data/<ep>/character/*      → images/<game-id>/character/*
 *   data/<ep>/background/*     → images/<game-id>/background/*
 */

const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');

const REQUIRED_ENV = ['OSS_KEY_ID', 'OSS_KEY_SECRET', 'OSS_REGION', 'OSS_BUCKET', 'OSS_CDN_BASE'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}. Check .env file.`);
    process.exit(1);
  }
}

const client = new OSS({
  region: `oss-${process.env.OSS_REGION}`,
  accessKeyId: process.env.OSS_KEY_ID,
  accessKeySecret: process.env.OSS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  endpoint: process.env.OSS_ENDPOINT,
});

const CDN_BASE = process.env.OSS_CDN_BASE.replace(/\/+$/, '');

const MIME_MAP = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

async function uploadFile(localPath, ossKey) {
  const mime = getMime(localPath);
  const stat = fs.statSync(localPath);
  const sizeKB = (stat.size / 1024).toFixed(1);

  try {
    await client.put(ossKey, localPath, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    const url = `${CDN_BASE}/${ossKey}`;
    console.log(`  ✅ ${ossKey} (${sizeKB}KB) → ${url}`);
    return { ossKey, url, size: stat.size };
  } catch (err) {
    console.error(`  ❌ ${ossKey}: ${err.message}`);
    return null;
  }
}

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function uploadGameAssets(gameId) {
  console.log(`\n📦 Uploading assets for: ${gameId}\n`);
  const uploaded = [];

  // 1. Audio files
  const audioDir = path.join(ROOT, 'games', gameId, 'audio');
  if (fs.existsSync(audioDir)) {
    console.log('🔊 Audio:');
    for (const file of collectFiles(audioDir)) {
      const rel = path.relative(audioDir, file).replace(/\\/g, '/');
      const result = await uploadFile(file, `audio/${gameId}/${rel}`);
      if (result) uploaded.push(result);
    }
  }

  // 2. Game-local images
  const imgDir = path.join(ROOT, 'games', gameId, 'images');
  if (fs.existsSync(imgDir)) {
    console.log('🖼️  Images (game-local):');
    for (const file of collectFiles(imgDir)) {
      const rel = path.relative(imgDir, file).replace(/\\/g, '/');
      const result = await uploadFile(file, `images/${gameId}/${rel}`);
      if (result) uploaded.push(result);
    }
  }

  // 3. Episode data images (data/ep*/character, data/ep*/background)
  const dataDir = path.join(ROOT, 'data');
  if (fs.existsSync(dataDir)) {
    for (const epDir of fs.readdirSync(dataDir)) {
      const epPath = path.join(dataDir, epDir);
      if (!fs.statSync(epPath).isDirectory()) continue;

      for (const subDir of ['character', 'background']) {
        const subPath = path.join(epPath, subDir);
        if (!fs.existsSync(subPath)) continue;

        console.log(`🖼️  Images (${epDir}/${subDir}):`);
        for (const file of collectFiles(subPath)) {
          const rel = path.relative(subPath, file).replace(/\\/g, '/');
          const result = await uploadFile(file, `images/${gameId}/${subDir}/${rel}`);
          if (result) uploaded.push(result);
        }
      }
    }
  }

  // 4. Phaser library (shared, upload once)
  const phaserLocal = path.join(ROOT, 'games', gameId, 'phaser.min.js');
  if (fs.existsSync(phaserLocal)) {
    console.log('📚 Library:');
    const result = await uploadFile(phaserLocal, 'lib/phaser@3.60.0.min.js');
    if (result) uploaded.push(result);
  }

  console.log(`\n✅ Done. ${uploaded.length} files uploaded.`);
  console.log(`🌐 CDN base: ${CDN_BASE}`);

  return uploaded;
}

async function listOssFiles(prefix) {
  console.log(`\n📂 Listing OSS: ${prefix || '(all)'}\n`);
  const result = await client.list({ prefix: prefix || '', 'max-keys': 100 });
  if (!result.objects || result.objects.length === 0) {
    console.log('  (empty)');
    return;
  }
  for (const obj of result.objects) {
    const sizeKB = (obj.size / 1024).toFixed(1);
    console.log(`  ${obj.name} (${sizeKB}KB)`);
  }
  console.log(`\n  Total: ${result.objects.length} files`);
}

// ── CLI ──
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const prefix = args.find(a => a !== '--list');
    await listOssFiles(prefix);
    return;
  }

  const gameId = args.find(a => !a.startsWith('-'));
  if (!gameId) {
    console.error('Usage: node scripts/oss-upload.js <game-id> [--html]');
    process.exit(1);
  }

  const uploaded = await uploadGameAssets(gameId);

  if (args.includes('--html')) {
    console.log('\n📝 URL map for HTML integration:');
    console.log(JSON.stringify(
      Object.fromEntries(uploaded.map(u => [u.ossKey, u.url])),
      null, 2
    ));
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
