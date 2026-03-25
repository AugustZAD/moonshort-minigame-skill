#!/usr/bin/env node
/**
 * patch-games-dynamic-attr.js
 *
 * Adds DISPLAY_ATTRIBUTE to every game file so that the settlement screen
 * can show a character-qualified attribute name (e.g. "Mira的勇气" instead of "勇气")
 * when CTX.character.name is present.
 *
 * Changes per file:
 *   1. Inserts after the PRIMARY_COLOR const line:
 *        const DISPLAY_ATTRIBUTE = (CTX.character && CTX.character.name
 *            ? CTX.character.name + '\u7684' : '') + ATTRIBUTE;
 *   2. Replaces `ATTRIBUTE + ' ' + modText` → `DISPLAY_ATTRIBUTE + ' ' + modText`
 *      (used in ResultScene settlement text across all 50 games and template)
 *   3. Replaces `${ATTRIBUTE}  ${modText}` → `${DISPLAY_ATTRIBUTE}  ${modText}`
 *      (used in the 2 example files)
 *
 * Idempotent: files already containing DISPLAY_ATTRIBUTE are skipped.
 * CRLF-aware: line endings are detected and preserved per file.
 *
 * Usage:
 *   node scripts/patch-games-dynamic-attr.js           # dry run (default)
 *   node scripts/patch-games-dynamic-attr.js --apply   # write changes
 *   node scripts/patch-games-dynamic-attr.js --verbose # verbose dry run
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CLI args ────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const APPLY   = args.includes('--apply');
const VERBOSE = args.includes('--verbose');

// ─── Target files ────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

const GAME_DIRS  = path.join(ROOT, 'games');
const EXAMPLE_DIRS = path.join(ROOT, 'examples');
const TEMPLATE   = path.join(ROOT, 'templates', 'phaser-h5-template.html');

function collectTargets() {
  const targets = [];

  // 50 games
  if (fs.existsSync(GAME_DIRS)) {
    for (const dir of fs.readdirSync(GAME_DIRS)) {
      const p = path.join(GAME_DIRS, dir, 'index.html');
      if (fs.existsSync(p)) targets.push(p);
    }
  }

  // 2 examples
  if (fs.existsSync(EXAMPLE_DIRS)) {
    for (const dir of fs.readdirSync(EXAMPLE_DIRS)) {
      const p = path.join(EXAMPLE_DIRS, dir, 'index.html');
      if (fs.existsSync(p)) targets.push(p);
    }
  }

  // template
  if (fs.existsSync(TEMPLATE)) targets.push(TEMPLATE);

  return targets;
}

// ─── EOL helpers ────────────────────────────────────────────────────────────

function detectEol(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

// ─── Patch logic ─────────────────────────────────────────────────────────────

/**
 * The line to insert after PRIMARY_COLOR.
 * Unicode-escaped so the source file stays ASCII-safe.
 */
const DISPLAY_ATTR_LINE =
  "const DISPLAY_ATTRIBUTE = (CTX.character && CTX.character.name ? CTX.character.name + '\\u7684' : '') + ATTRIBUTE;";

/**
 * Patch a single file's content.
 * Returns { patched: boolean, content: string, reason: string }.
 */
function patchContent(original, filePath) {
  // Skip if already patched
  if (original.includes('DISPLAY_ATTRIBUTE')) {
    return { patched: false, content: original, reason: 'already patched' };
  }

  const eol = detectEol(original);
  let content = original;
  let changed = false;

  // ── Step 1: Insert DISPLAY_ATTRIBUTE after PRIMARY_COLOR line ──────────────
  // Match pattern: `const PRIMARY_COLOR = CTX.primaryColor || ...;`
  // The line may end with CRLF or LF.
  const primaryColorRe = /(const PRIMARY_COLOR\s*=\s*CTX\.primaryColor\s*\|\|[^\n]+\n)/;
  if (primaryColorRe.test(content)) {
    content = content.replace(primaryColorRe, `$1${DISPLAY_ATTR_LINE}${eol}`);
    changed = true;
  } else {
    // Fallback: try CRLF-terminated line
    const primaryColorReCrlf = /(const PRIMARY_COLOR\s*=\s*CTX\.primaryColor\s*\|\|[^\r\n]+\r\n)/;
    if (primaryColorReCrlf.test(content)) {
      content = content.replace(primaryColorReCrlf, `$1${DISPLAY_ATTR_LINE}${eol}`);
      changed = true;
    }
  }

  if (!changed) {
    return { patched: false, content: original, reason: 'PRIMARY_COLOR line not found — skipped' };
  }

  // ── Step 2a: Replace `ATTRIBUTE + ' ' + modText` (games / template) ────────
  // This appears in ResultScene settlement text line
  content = content.replace(
    /ATTRIBUTE \+ ' ' \+ modText/g,
    "DISPLAY_ATTRIBUTE + ' ' + modText"
  );

  // ── Step 2b: Replace `${ATTRIBUTE}  ${modText}` (examples) ─────────────────
  // Template literal variant used in platform-runner and merge-2048 examples
  content = content.replace(
    /\$\{ATTRIBUTE\}(\s+)\$\{modText\}/g,
    '${DISPLAY_ATTRIBUTE}$1${modText}'
  );

  return { patched: true, content, reason: 'ok' };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\nDynamic Attribute Patcher');
  console.log('─'.repeat(60));
  console.log(`Mode: ${APPLY ? 'APPLY (writing files)' : 'DRY RUN (no files written)'}`);
  console.log('');

  const targets = collectTargets();
  console.log(`Found ${targets.length} target files.\n`);

  let patched  = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const filePath of targets) {
    const rel = path.relative(ROOT, filePath);
    try {
      const original = fs.readFileSync(filePath, 'utf8');
      const { patched: didPatch, content, reason } = patchContent(original, filePath);

      if (!didPatch) {
        skipped++;
        if (VERBOSE) console.log(`  SKIP   ${rel}  (${reason})`);
        continue;
      }

      if (APPLY) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  PATCH  ${rel}`);
      } else {
        console.log(`  PATCH  ${rel}  [dry run]`);
        if (VERBOSE) {
          // Show a preview of the new DISPLAY_ATTRIBUTE line
          const lines = content.split(/\r?\n/);
          const idx = lines.findIndex(l => l.includes('DISPLAY_ATTRIBUTE'));
          if (idx !== -1) {
            console.log(`         line ~${idx + 1}: ${lines[idx].trim()}`);
          }
        }
      }
      patched++;

    } catch (err) {
      errors++;
      console.error(`  ERROR  ${rel}  ${err.message}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${patched} patched  ${skipped} skipped  ${errors} errors`);
  if (!APPLY && patched > 0) {
    console.log('\nRe-run with --apply to write changes.');
  }
  if (errors > 0) {
    process.exit(1);
  }
}

main();
