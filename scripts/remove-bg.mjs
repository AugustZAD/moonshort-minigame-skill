#!/usr/bin/env node
/**
 * remove-bg.mjs — Remove background from character images using @imgly/background-removal-node
 * Outputs true RGBA PNG with transparent background.
 *
 * Usage:
 *   node scripts/remove-bg.mjs <input.jpg> <output.png>
 */

import { removeBackground } from '@imgly/background-removal-node';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/remove-bg.mjs <input.jpg> <output.png>');
  process.exit(1);
}

const absIn  = resolve(inputPath);
const absOut = resolve(outputPath);

console.log(`[INPUT]  ${absIn}`);
console.log('[PROCESSING] Removing background...');

const inputBuffer = readFileSync(absIn);
const ext = absIn.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const blob = await removeBackground(new Blob([inputBuffer], { type: ext }), {
  output: { format: 'image/png' },
});
const buffer = Buffer.from(await blob.arrayBuffer());
writeFileSync(absOut, buffer);

console.log(`[SAVED]  ${absOut} (${(buffer.length / 1024).toFixed(0)} KB)`);
console.log('[DONE]');
