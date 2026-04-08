#!/usr/bin/env node
/**
 * Organize 狼人 assets into per-episode folders mirroring data/test/ep{N}/ layout.
 * - Copies only needed character + scene PNGs per episode
 * - Substitutes missing scenes with same-territory fallbacks
 * - Writes script.json containing current + next episode full content
 * - Writes MANIFEST.md listing assets and substitutions
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'data', '狼人');
const SCENE_DIR = path.join(SRC_DIR, '场景');
const CHAR_DIR = path.join(SRC_DIR, '角色立绘');
const SCRIPT_FILE = 'C:/Users/49808/Downloads/complete_script_ep1_ep20.json';

// Character script-name → file name (without .png)
const CHAR_MAP = {
  'Sylvia': 'Sylvia',
  'James': 'James',
  'Kennedy': 'Kennedy Barnes',
  'Kennedy Barnes': 'Kennedy Barnes',
  'Daisy': 'Daisy',
  'Luna Miller': 'Luna Miller',
  'Huxley': 'Huxley',
  'Cynthia': 'Cynthia',
  'Elara Vance': 'Elara Vance',
  'Iris Blackwood': 'Iris Blackwood',
  'Kayden': 'Kayden',
  'Lyra': 'Lyra',
};

// Known same-territory scene substitutes for missing exact scenes
const SCENE_SUBSTITUTE = {
  '银月领地 豪宅 外小路': '银月领地 豪宅',
  '银月领地 豪宅外围': '银月领地 豪宅',
  '银月领地 豪宅 侧廊': '银月领地 豪宅 走廊',
  '中立区 溪流旁': '中立区 草地',
  '中立区 无名溪流旁': '中立区 草地',
  '河谷领地 疗养小屋': '河谷领地 豪宅',
  '河谷领地 行政室': '河谷领地 豪宅 客厅',
  '河谷领地 疗养草地': '河谷领地 豪宅',
  // 北极光领地 — no same-territory scenes available in 狼人/场景/
  // fall back to closest-type scene with a note
  '北极光领地 边界': '银月领地 东部边界',
  '北极光领地 主屋 办公室': '银月领地 豪宅 行政办公室',
  '北极光领地 北侧开阔地': '中立区 草地',
  '北极光领地 主屋 书桌': '银月领地 豪宅 Luna书房',
};

function sceneFileExists(name) {
  return fs.existsSync(path.join(SCENE_DIR, name + '.png'));
}
function charFileExists(name) {
  const mapped = CHAR_MAP[name];
  if (!mapped) return false;
  return fs.existsSync(path.join(CHAR_DIR, mapped + '.png'));
}
function resolveScene(name) {
  if (sceneFileExists(name)) return { source: name, substituted: false };
  const sub = SCENE_SUBSTITUTE[name];
  if (sub && sceneFileExists(sub)) {
    const crossTerritory = !sub.startsWith(name.split(' ')[0]);
    return { source: sub, substituted: true, crossTerritory };
  }
  return { source: null, substituted: false, missing: true };
}
function resolveChar(name) {
  if (charFileExists(name)) return { source: CHAR_MAP[name], missing: false };
  return { source: null, missing: true };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function copyFile(src, dst) {
  fs.copyFileSync(src, dst);
}

function main() {
  const data = JSON.parse(fs.readFileSync(SCRIPT_FILE, 'utf8'));
  // index by ep_num → { mainline, minor_mainline? }
  const byEp = {};
  for (const entry of data) {
    if (!byEp[entry.ep_num]) byEp[entry.ep_num] = {};
    byEp[entry.ep_num][entry.variant_kind] = entry;
  }
  const epNums = Object.keys(byEp).map(Number).sort((a, b) => a - b);

  const summary = [];
  for (const ep of epNums) {
    const epDir = path.join(SRC_DIR, `ep${ep}`);
    const bgDir = path.join(epDir, 'background');
    const chDir = path.join(epDir, 'character');
    const procDir = path.join(epDir, 'processed');
    ensureDir(bgDir);
    ensureDir(chDir);
    ensureDir(procDir);

    const variants = byEp[ep];
    const variantSummaries = [];

    // For episodes with minor_mainline, also create ep{N}_minor sibling dir.
    const variantTargets = [];
    variantTargets.push({ kind: 'mainline', dir: epDir, bgDir, chDir, procDir });
    if (variants.minor_mainline) {
      const minorDir = path.join(SRC_DIR, `ep${ep}_minor`);
      const mBg = path.join(minorDir, 'background');
      const mCh = path.join(minorDir, 'character');
      const mProc = path.join(minorDir, 'processed');
      ensureDir(mBg); ensureDir(mCh); ensureDir(mProc);
      variantTargets.push({ kind: 'minor_mainline', dir: minorDir, bgDir: mBg, chDir: mCh, procDir: mProc });
    }

    const next = byEp[ep + 1];

    for (const tgt of variantTargets) {
      const v = variants[tgt.kind];
      if (!v) continue;
      const chars = new Set(v.output.characters || []);
      const scenes = new Set(Object.keys(v.output.scene_locations || {}));

      const charReport = [];
      for (const c of [...chars].sort()) {
        const r = resolveChar(c);
        if (r.missing) {
          charReport.push(`- ❌ **${c}** — MISSING (no portrait in 狼人/角色立绘/)`);
        } else {
          copyFile(path.join(CHAR_DIR, r.source + '.png'), path.join(tgt.chDir, r.source + '.png'));
          charReport.push(`- ✅ ${c} → ${r.source}.png`);
        }
      }
      const sceneReport = [];
      for (const s of [...scenes].sort()) {
        const r = resolveScene(s);
        if (r.missing) {
          sceneReport.push(`- ❌ **${s}** — MISSING (no same-territory substitute)`);
        } else if (r.substituted) {
          const destName = `${s} [替代_${r.source}].png`;
          copyFile(path.join(SCENE_DIR, r.source + '.png'), path.join(tgt.bgDir, destName));
          const crossTag = r.crossTerritory ? ' ⚠️跨领地' : '';
          sceneReport.push(`- 🔁 ${s} → 替代 \`${r.source}.png\`${crossTag}`);
        } else {
          copyFile(path.join(SCENE_DIR, r.source + '.png'), path.join(tgt.bgDir, r.source + '.png'));
          sceneReport.push(`- ✅ ${s} → ${r.source}.png`);
        }
      }

      // script.json — this variant's current + next episode (its variants if available)
      const scriptBundle = {
        ep_num: ep,
        variant: tgt.kind,
        current: v,
        next: next
          ? {
              ep_num: ep + 1,
              mainline: next.mainline || null,
              minor_mainline: next.minor_mainline || null,
            }
          : null,
      };
      fs.writeFileSync(path.join(tgt.dir, 'script.json'), JSON.stringify(scriptBundle, null, 2), 'utf8');

      const manifest = [
        `# EP${ep}${tgt.kind === 'minor_mainline' ? '（minor_mainline 变体）' : ''} 资源清单`,
        '',
        `**变体：** \`${tgt.kind}\``,
        '',
        `**角色（${chars.size}）：**`,
        ...charReport,
        '',
        `**场景（${scenes.size}）：**`,
        ...sceneReport,
        '',
        `**剧本：** \`script.json\` 包含本集（${tgt.kind}）+ ${next ? `EP${ep + 1}（含所有变体）` : '无下一集'}`,
      ].join('\n');
      fs.writeFileSync(path.join(tgt.dir, 'MANIFEST.md'), manifest, 'utf8');

      variantSummaries.push({
        ep,
        variant: tgt.kind,
        dir: path.basename(tgt.dir),
        chars: chars.size,
        scenes: scenes.size,
      });
    }

    summary.push(...variantSummaries);
  }

  // Top-level README
  const readme = [
    '# 狼人剧本资源（按集整理）',
    '',
    '每集目录结构：',
    '```',
    'ep{N}/',
    '├── background/   # 本集所需场景（缺失用同领地近似替代，文件名含 [替代_xxx]）',
    '├── character/    # 本集所需角色立绘',
    '├── processed/    # 后续处理产物（空）',
    '├── script.json   # 本集 + 下一集完整剧情（current + next）',
    '└── MANIFEST.md   # 资源清单与替代说明',
    '```',
    '',
    '## 各集概览',
    '',
    '| 目录 | EP | 变体 | 角色 | 场景 |',
    '|------|----|------|------|------|',
    ...summary.map(
      (s) => `| \`${s.dir}/\` | ${s.ep} | ${s.variant} | ${s.chars} | ${s.scenes} |`,
    ),
  ].join('\n');
  fs.writeFileSync(path.join(SRC_DIR, 'EPISODES_README.md'), readme, 'utf8');

  console.log(`Organized ${epNums.length} episodes into ${SRC_DIR}`);
  console.log('Summary:', summary);
}

main();
