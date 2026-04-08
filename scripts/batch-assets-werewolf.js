#!/usr/bin/env node
/**
 * Batch asset processor for werewolf episodes.
 * For each episode: generate headshots via ZenMux → chroma key → 200×200 avatar
 * Also process background images to JPEG.
 */
'use strict';
const { execSync } = require('child_process');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../data/狼人');
const PORTRAITS_DIR = path.join(BASE, '角色立绘');
const SCENES_DIR = path.join(BASE, '场景');

// ─── Episode configs ────────────────────────────────────────────────────────
const EPISODES = [
  // Already done: ep1, ep5, ep8, ep14, ep20
  { ep: '2', left: { name: 'Sylvia', expr: 'tense, jaw clenched, holding back tears' }, right: { name: 'James', expr: 'cold, dismissive, looking away' }, scene: '银月领地 豪宅 客厅' },
  { ep: '3', left: { name: 'Sylvia', expr: 'calculating, alert, eyes narrowed' }, right: { name: 'James', expr: 'aggressive, threatening, alpha authority' }, scene: '银月领地 豪宅 厨房' },
  { ep: '4', left: { name: 'Sylvia', expr: 'defiant, standing ground, composed' }, right: { name: 'Cynthia', expr: 'scrutinizing, suspicious, piercing gaze' }, scene: '银月领地 豪宅 走廊' },
  { ep: '6', left: { name: 'Sylvia', expr: 'resolute, confrontational, burning determination' }, right: { name: 'Luna Miller', expr: 'manipulative, cold smile, calculating' }, scene: '银月领地 豪宅 Luna书房' },
  { ep: '7', left: { name: 'Sylvia', expr: 'anguished, steeled, pain behind composure' }, right: { name: 'James', expr: 'conflicted, tormented, unable to face her' }, scene: '银月领地 豪宅 议事厅' },
  { ep: '9', left: { name: 'Sylvia', expr: 'grim determination, accepting pain' }, right: { name: 'Elara Vance', expr: 'serious, empathetic, professional concern' }, scene: '银月领地 治疗师小屋' },
  { ep: '10', left: { name: 'Sylvia', expr: 'devastating resolve, ice-cold clarity' }, right: { name: 'James', expr: 'shocked, shattered, disbelieving' }, scene: '银月领地 豪宅 主卧' },
  { ep: '11', left: { name: 'Sylvia', expr: 'strategic, sharp focus, political composure' }, right: { name: 'James', expr: 'cornered, public facade cracking' }, scene: '银月领地 豪宅 议事厅' },
  { ep: '12', left: { name: 'Sylvia', expr: 'fevered, desperate, barely standing' }, right: { name: 'Daisy', expr: 'worried, urgent, protective' }, scene: '银月领地 豪宅 主卧' },
  { ep: '12_minor', left: { name: 'Sylvia', expr: 'composed under pressure, public calm' }, right: { name: 'Cynthia', expr: 'watchful, opportunistic, calculating' }, scene: '银月领地 豪宅 议事厅' },
  { ep: '13', left: { name: 'Sylvia', expr: 'desperate, breaking free, running' }, right: { name: 'Huxley', expr: 'protective, torn, letting her go' }, scene: '银月领地 东部边界' },
  { ep: '13_minor', left: { name: 'Sylvia', expr: 'defiant, autonomous, walking away' }, right: { name: 'Cynthia', expr: 'surprised, grudging respect' }, scene: '银月领地 豪宅 走廊' },
  { ep: '15', left: { name: 'Sylvia', expr: 'recovering, fragile but peaceful' }, right: { name: 'Iris Blackwood', expr: 'patient, warm, steady presence' }, scene: '河谷领地 豪宅 客厅' },
  { ep: '16', left: { name: 'Sylvia', expr: 'vulnerable, tears of relief, opening up' }, right: { name: 'Iris Blackwood', expr: 'gentle, encouraging, proud' }, scene: '河谷领地 豪宅 客厅' },
  { ep: '17', left: { name: 'Sylvia', expr: 'ready, confident, genuine smile' }, right: { name: 'Iris Blackwood', expr: 'bittersweet, proud farewell' }, scene: '中立区 草地' },
  { ep: '18', left: { name: 'Sylvia', expr: 'tentative hope, shy warmth' }, right: { name: 'Huxley', expr: 'gentle, patient, warm invitation' }, scene: '中立区 咖啡馆' },
  { ep: '19', left: { name: 'Sylvia', expr: 'transcendent, accepting, at peace' }, right: { name: 'Huxley', expr: 'loving, committed, quiet strength' }, scene: '中立区 草地' },
];

// ─── Chroma key + avatar pipeline ───────────────────────────────────────────
async function chromaKeyToAvatar(inputPath, outputPath) {
  const raw = sharp(inputPath);
  const { data, info } = await raw.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const output = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2];
    const a = (channels === 4) ? data[i * channels + 3] : 255;
    const isG = g > 120 && g > r * 1.3 && g > b * 1.3;
    const gn = isG ? Math.min(1, (g - Math.max(r, b)) / g) : 0;
    if (isG && gn > 0.3) { output[i*4]=r; output[i*4+1]=g; output[i*4+2]=b; output[i*4+3]=0; }
    else if (gn > 0.05) { output[i*4]=r; output[i*4+1]=Math.round(g*0.7+Math.max(r,b)*0.3); output[i*4+2]=b; output[i*4+3]=Math.round(a*(1-gn)); }
    else { output[i*4]=r; output[i*4+1]=g; output[i*4+2]=b; output[i*4+3]=a; }
  }
  const keyed = await sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(keyed).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const sz = 200, inner = Math.round(sz * 0.90);
  const fitted = await sharp(trimmed.data).resize(inner, inner, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).toBuffer({ resolveWithObject: true });
  const left = Math.round((sz - fitted.info.width) / 2);
  const top = Math.round((sz - fitted.info.height) * 0.25);
  await sharp({ create: { width: sz, height: sz, channels: 4, background: { r:0,g:0,b:0,alpha:0 } } })
    .composite([{ input: fitted.data, left, top }]).png().toFile(outputPath);
  const m = await sharp(outputPath).metadata();
  const kb = Math.round(fs.statSync(outputPath).size / 1024);
  return { w: m.width, h: m.height, alpha: m.hasAlpha, kb };
}

// ─── Generate headshot via ZenMux ───────────────────────────────────────────
function generateHeadshot(charName, expression, outputPath) {
  const inputPath = path.join(PORTRAITS_DIR, charName + '.png');
  if (!fs.existsSync(inputPath)) {
    console.error(`  ✗ Reference image not found: ${inputPath}`);
    return false;
  }
  const prompt = `Based on this character, generate a tight headshot portrait (face and neck only, very close crop, face fills 80% of the image). Same character face, same hair color and style. Expression: ${expression}. Solid bright green #00FF00 chroma key background. No other objects, no body.`;
  try {
    execSync(`node scripts/zenmux-image.js --prompt "${prompt}" --input "${inputPath}" --out "${outputPath}" --model google/gemini-2.5-flash-image`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
      timeout: 120000
    });
    return true;
  } catch (e) {
    console.error(`  ✗ ZenMux failed for ${charName}: ${e.message.substring(0, 100)}`);
    return false;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  let success = 0, fail = 0;

  for (const ep of EPISODES) {
    const gameDir = path.join(BASE, `ep${ep.ep}`, 'game');
    console.log(`\n=== EP${ep.ep} ===`);

    // 1. Generate left headshot
    const leftGreen = path.join(gameDir, `headshot-${ep.left.name.toLowerCase().replace(/ /g,'-')}-green.png`);
    const leftAvatar = path.join(gameDir, `avatar-${ep.left.name.toLowerCase().replace(/ /g,'-')}.png`);
    if (!fs.existsSync(leftAvatar)) {
      console.log(`  Generating ${ep.left.name} headshot...`);
      if (generateHeadshot(ep.left.name, ep.left.expr, leftGreen)) {
        const r = await chromaKeyToAvatar(leftGreen, leftAvatar);
        console.log(`  ✓ ${path.basename(leftAvatar)}: ${r.w}x${r.h} alpha=${r.alpha} ${r.kb}KB`);
        success++;
      } else { fail++; }
    } else {
      console.log(`  ✓ ${path.basename(leftAvatar)} exists, skipping`);
      success++;
    }

    // 2. Generate right headshot
    const rightGreen = path.join(gameDir, `headshot-${ep.right.name.toLowerCase().replace(/ /g,'-')}-green.png`);
    const rightAvatar = path.join(gameDir, `avatar-${ep.right.name.toLowerCase().replace(/ /g,'-')}.png`);
    if (!fs.existsSync(rightAvatar)) {
      console.log(`  Generating ${ep.right.name} headshot...`);
      if (generateHeadshot(ep.right.name, ep.right.expr, rightGreen)) {
        const r = await chromaKeyToAvatar(rightGreen, rightAvatar);
        console.log(`  ✓ ${path.basename(rightAvatar)}: ${r.w}x${r.h} alpha=${r.alpha} ${r.kb}KB`);
        success++;
      } else { fail++; }
    } else {
      console.log(`  ✓ ${path.basename(rightAvatar)} exists, skipping`);
      success++;
    }

    // 3. Process background
    const bgOut = path.join(gameDir, 'bg-scene.jpg');
    if (!fs.existsSync(bgOut)) {
      const scenePath = path.join(SCENES_DIR, ep.scene + '.png');
      if (fs.existsSync(scenePath)) {
        await sharp(scenePath).resize(800).jpeg({ quality: 55 }).toFile(bgOut);
        const bm = await sharp(bgOut).metadata();
        const bk = Math.round(fs.statSync(bgOut).size / 1024);
        console.log(`  ✓ bg-scene.jpg: ${bm.width}x${bm.height} ${bm.format} ${bk}KB`);
        success++;
      } else {
        console.error(`  ✗ Scene not found: ${scenePath}`);
        fail++;
      }
    } else {
      console.log(`  ✓ bg-scene.jpg exists, skipping`);
      success++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Success: ${success}, Fail: ${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
