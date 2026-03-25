#!/usr/bin/env node
/**
 * patch-games-episode-ctx.js
 *
 * One-time migration script: patches all 50 games + template + 2 examples
 * to replace the old URL-params-only block with the CTX-aware 4-line version.
 *
 * Usage:
 *   node scripts/patch-games-episode-ctx.js            # dry run (no writes)
 *   node scripts/patch-games-episode-ctx.js --apply    # apply changes
 *
 * What it patches (inside each file's first <script> block):
 *
 *   BEFORE (2 or 3 lines):
 *     const params = new URLSearchParams(window.location.search);
 *     const ATTRIBUTE = params.get('attribute') || '<default>';
 *     const PRIMARY_COLOR = params.get('primaryColor') || '<colorDefault>';
 *
 *   AFTER (4 lines, CTX-aware):
 *     const CTX = window.__EPISODE_CTX__ || {};
 *     const params = new URLSearchParams(window.location.search);
 *     const ATTRIBUTE = CTX.attribute || params.get('attribute') || '<default>';
 *     const PRIMARY_COLOR = CTX.primaryColor || params.get('primaryColor') || '<colorDefault>';
 *
 * The script is idempotent: files already patched (containing __EPISODE_CTX__)
 * are skipped without error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// Target file groups
const GAME_DIR = path.join(ROOT, 'games');
const EXTRA_FILES = [
  path.join(ROOT, 'templates', 'phaser-h5-template.html'),
  path.join(ROOT, 'examples', 'platform-runner', 'index.html'),
  path.join(ROOT, 'examples', 'merge-2048', 'index.html'),
];

// Regex that matches the original 3-line block (with any default values).
// Handles both LF (\n) and CRLF (\r\n) line endings.
// Groups:
//   1 → indentation / leading whitespace
//   2 → ATTRIBUTE default value (e.g. 'Charm')
//   3 → PRIMARY_COLOR default value (e.g. '#ff6b9d')
const PATCH_REGEX =
  /^([ \t]*)const params = new URLSearchParams\(window\.location\.search\);\r?\n\1const ATTRIBUTE = params\.get\('attribute'\) \|\| ('(?:[^']*)'|"(?:[^"]*)");\r?\n\1const PRIMARY_COLOR = params\.get\('primaryColor'\) \|\| ('(?:[^']*)'|"(?:[^"]*)");\r?\n/m;

function buildReplacement(indent, attrDefault, colorDefault, eol) {
  const nl = eol; // preserve original line ending
  return (
    `${indent}const CTX = window.__EPISODE_CTX__ || {};${nl}` +
    `${indent}const params = new URLSearchParams(window.location.search);${nl}` +
    `${indent}const ATTRIBUTE = CTX.attribute || params.get('attribute') || ${attrDefault};${nl}` +
    `${indent}const PRIMARY_COLOR = CTX.primaryColor || params.get('primaryColor') || ${colorDefault};${nl}`
  );
}

function detectEol(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function patchFile(filePath) {
  const rel = path.relative(ROOT, filePath);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`  [ERROR] Cannot read ${rel}: ${err.message}`);
    return { status: 'error' };
  }

  // Already patched?
  if (content.includes('window.__EPISODE_CTX__')) {
    console.log(`  [SKIP]  ${rel}  (already patched)`);
    return { status: 'skip' };
  }

  const match = PATCH_REGEX.exec(content);
  if (!match) {
    console.warn(`  [WARN]  ${rel}  (pattern not found — manual review needed)`);
    return { status: 'warn' };
  }

  const [fullMatch, indent, attrDefault, colorDefault] = match;
  const eol = detectEol(content);
  const replacement = buildReplacement(indent, attrDefault, colorDefault, eol);
  const patched = content.replace(fullMatch, replacement);

  if (APPLY) {
    fs.writeFileSync(filePath, patched, 'utf8');
    console.log(`  [PATCH] ${rel}`);
  } else {
    console.log(`  [DRY]   ${rel}  →  would patch (ATTRIBUTE default: ${attrDefault})`);
  }

  return { status: 'patched' };
}

function collectGameFiles() {
  const files = [];
  if (!fs.existsSync(GAME_DIR)) return files;
  for (const dir of fs.readdirSync(GAME_DIR)) {
    const indexPath = path.join(GAME_DIR, dir, 'index.html');
    if (fs.existsSync(indexPath)) {
      files.push(indexPath);
    }
  }
  return files;
}

function main() {
  console.log(`\nEpisode CTX Patch Script`);
  console.log(`Mode: ${APPLY ? 'APPLY (writing files)' : 'DRY RUN (no writes)'}`);
  console.log('─'.repeat(60));

  const allFiles = [...collectGameFiles(), ...EXTRA_FILES];
  console.log(`\nTarget files: ${allFiles.length}\n`);

  const counts = { patched: 0, skip: 0, warn: 0, error: 0 };

  for (const file of allFiles) {
    const result = patchFile(file);
    counts[result.status] = (counts[result.status] || 0) + 1;
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`Summary:`);
  console.log(`  Patched : ${counts.patched}`);
  console.log(`  Skipped : ${counts.skip}  (already had __EPISODE_CTX__)`);
  console.log(`  Warnings: ${counts.warn}  (pattern not found)`);
  console.log(`  Errors  : ${counts.error}`);

  if (!APPLY && counts.patched > 0) {
    console.log(`\nRe-run with --apply to write changes.\n`);
  }

  if (counts.error > 0 || counts.warn > 0) {
    process.exit(1);
  }
}

main();
