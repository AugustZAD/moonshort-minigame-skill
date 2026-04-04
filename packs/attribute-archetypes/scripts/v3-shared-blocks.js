/**
 * V3 Shared Code Blocks — Reference File
 * ========================================
 * This file contains all shared V3 code blocks for the minigame-remix framework.
 * Games should inline the blocks they need; this file is the single source of truth.
 *
 * Sections:
 *   1. THEMES object (7 themes)
 *   2. Theme application functions (hexToRgba, hexToInt, applyTheme)
 *   3. Dynamic palette extraction chain (extractPalette + helpers)
 *   4. CSS animation tokens & keyframes (as CSS comment block at bottom)
 */

// ═══════════════════════════════════════════════════════════════════════════════
//  1. THEMES — 7-theme palette map
// ═══════════════════════════════════════════════════════════════════════════════

const THEMES = {
  combat:  { bg:'#1A1221', primary:'#EC4F99', primaryLight:'#F9A8D4', circleTail:'#FFE0F8', playerHp:'#4FECA2', opponentHp:'#EC4F99', gold:'#F5C842', strokeDark:'#B03A75' },
  mystery: { bg:'#0F1729', primary:'#3B82F6', primaryLight:'#93C5FD', circleTail:'#DBEAFE', playerHp:'#4FECA2', opponentHp:'#3B82F6', gold:'#F5C842', strokeDark:'#2563EB' },
  nature:  { bg:'#0F1F16', primary:'#10B981', primaryLight:'#6EE7B7', circleTail:'#D1FAE5', playerHp:'#FBBF24', opponentHp:'#10B981', gold:'#F5C842', strokeDark:'#059669' },
  dark:    { bg:'#110E1A', primary:'#8B5CF6', primaryLight:'#C4B5FD', circleTail:'#EDE9FE', playerHp:'#4FECA2', opponentHp:'#8B5CF6', gold:'#F5C842', strokeDark:'#6D28D9' },
  sweet:   { bg:'#1A1218', primary:'#FB7185', primaryLight:'#FECDD3', circleTail:'#FFF1F2', playerHp:'#A78BFA', opponentHp:'#FB7185', gold:'#F5C842', strokeDark:'#E11D48' },
  ocean:   { bg:'#0B1620', primary:'#06B6D4', primaryLight:'#67E8F9', circleTail:'#CFFAFE', playerHp:'#4FECA2', opponentHp:'#06B6D4', gold:'#F5C842', strokeDark:'#0891B2' },
  energy:  { bg:'#1A140E', primary:'#F97316', primaryLight:'#FDBA74', circleTail:'#FFF7ED', playerHp:'#4FECA2', opponentHp:'#F97316', gold:'#F5C842', strokeDark:'#C2410C' }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  2. Theme application functions
// ═══════════════════════════════════════════════════════════════════════════════

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function hexToInt(hex) { return parseInt(hex.slice(1), 16); }

function applyTheme(T) {
  const s = document.documentElement.style;
  Object.entries(T).forEach(([k, v]) => s.setProperty('--' + k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), v));
  [10, 20, 30, 50].forEach(a => s.setProperty('--primary-' + a, hexToRgba(T.primary, a / 100)));
  s.setProperty('--white-20', 'rgba(255,255,255,.20)');
  s.setProperty('--white-30', 'rgba(255,255,255,.30)');
  s.setProperty('--white-50', 'rgba(255,255,255,.50)');
  s.setProperty('--black-15', 'rgba(0,0,0,.15)');
  s.setProperty('--black-25', 'rgba(0,0,0,.25)');
  document.body.style.background = T.bg;
  document.querySelector('#game-shell').style.background = T.bg;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  3. Dynamic palette extraction (from ui-visual-language.md section 3.6)
// ═══════════════════════════════════════════════════════════════════════════════

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h, s, l = (mx + mn) / 2;
  if (mx === mn) { h = s = 0; } else {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h /= 360;
  function hf(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [Math.round(hf(p, q, h + 1/3) * 255),
          Math.round(hf(p, q, h)       * 255),
          Math.round(hf(p, q, h - 1/3) * 255)];
}

function toHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v))
    .toString(16).padStart(2, '0').toUpperCase()).join('');
}

function colorDist(a, b) {
  return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
}

function bell(x, center, width) {
  const d = (x - center) / width;
  return Math.exp(-d * d / 2);
}

function hueBonus(h) {
  if (h >= 300 || h <= 15)  return 1.28;
  if (h >= 260 && h < 300)  return 1.22;
  if (h >= 140 && h < 190)  return 1.20;
  if (h >= 190 && h < 260)  return 1.15;
  if (h >= 15  && h < 80)   return 0.65;
  return 1.0;
}

function kmeans(pixels, k, iterations) {
  let centers = [];
  const seen = new Set();
  while (centers.length < k) {
    const i = Math.floor(Math.random() * pixels.length);
    if (!seen.has(i)) { seen.add(i); centers.push(pixels[i].slice()); }
  }
  for (let t = 0; t < iterations; t++) {
    const clusters = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let md = Infinity, bi = 0;
      for (let j = 0; j < k; j++) {
        const d = colorDist(p, centers[j]);
        if (d < md) { md = d; bi = j; }
      }
      clusters[bi].push(p);
    }
    for (let j = 0; j < k; j++) {
      if (!clusters[j].length) continue;
      const n = clusters[j].length;
      centers[j] = [
        Math.round(clusters[j].reduce((s, p) => s + p[0], 0) / n),
        Math.round(clusters[j].reduce((s, p) => s + p[1], 0) / n),
        Math.round(clusters[j].reduce((s, p) => s + p[2], 0) / n),
      ];
    }
  }
  return centers;
}

function extractPalette(imageData) {
  const pixels = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] < 128) continue;
    const [, s, l] = rgbToHsl(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
    if (l < 0.03 || l > 0.98) continue;
    pixels.push([imageData.data[i], imageData.data[i+1], imageData.data[i+2]]);
  }
  if (pixels.length < 5) return null;

  const k = Math.min(12, Math.max(5, Math.floor(pixels.length / 4)));
  const clusters = kmeans(pixels, k, 32);

  const ann = clusters.map(rgb => {
    const [h, s, l] = rgbToHsl(...rgb);
    const score = Math.pow(s + .05, .55) * bell(l, .57, .21) * hueBonus(h);
    return { rgb, h, s, l, score };
  });

  const lights = ann.filter(c => c.l > 0.84).sort((a, b) => b.l - a.l);
  const darks  = ann.filter(c => c.l < 0.22).sort((a, b) => a.l - b.l);
  const mids   = ann.filter(c => c.l >= 0.22 && c.l <= 0.84)
                    .sort((a, b) => b.score - a.score);

  const sel = [];
  for (const c of mids) {
    if (sel.length >= 3) break;
    let close = false;
    for (const v of sel) {
      const hd = Math.min(Math.abs(c.h - v.h), 360 - Math.abs(c.h - v.h));
      if (hd < 50 && Math.abs(c.l - v.l) < 0.25) { close = true; break; }
    }
    if (!close) sel.push(c);
  }

  const boosted = sel.map(c => {
    const ns = Math.min(Math.max(c.s, 0.74), 0.92);
    return { ...c, rgb: hslToRgb(c.h, ns, c.l), s: ns };
  });

  const primary = boosted[0] || { h: 327, s: .83, l: .61, rgb: [236, 79, 153] };

  const nw = lights.length ? lights[0]
           : { rgb: hslToRgb(primary.h, .18, .94), h: primary.h, s: .18, l: .94 };
  const nb = darks.length  ? darks[0]
           : { rgb: hslToRgb(primary.h, .07, .11), h: primary.h, s: .07, l: .11 };

  const getSecondary = (acc) => {
    if (!boosted[2]) {
      const newL = acc.l > 0.55 ? Math.max(acc.l - 0.15, 0.35) : Math.min(acc.l + 0.15, 0.70);
      const rgb = hslToRgb(acc.h, acc.s * 0.9, newL);
      return toHex(...rgb);
    }
    return toHex(...boosted[2].rgb);
  };

  return {
    primary:   toHex(...primary.rgb),
    accent:    toHex(...(boosted[1]?.rgb || primary.rgb)),
    secondary: getSecondary(boosted[1] || primary),
    surface:   toHex(...nw.rgb),
    text:      toHex(...nb.rgb),
    bgDark:    toHex(...hslToRgb(primary.h, .10, .10)),
  };
}

// ── Palette-to-theme helpers ────────────────────────────────────────────────

function darken(hex, amount) {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
  const f = 1 - amount;
  return '#' + [r, g, b].map(c => Math.round(c * f).toString(16).padStart(2, '0')).join('');
}

function paletteToTheme(p) {
  return {
    bg: p.bgDark,
    primary: p.primary,
    primaryLight: p.surface,
    circleTail: p.surface,
    playerHp: p.accent,
    opponentHp: p.primary,
    gold: '#F5C842',
    strokeDark: darken(p.primary, 0.25)
  };
}

async function extractFromCover(url) {
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = c.height = 80;
  c.getContext('2d').drawImage(img, 0, 0, 80, 80);
  return extractPalette(c.getContext('2d').getImageData(0, 0, 80, 80));
}

async function resolveTheme(defaultThemeId) {
  if (CTX.coverImage) {
    try {
      const palette = await extractFromCover(CTX.coverImage);
      if (palette) {
        const rgb = palette.primary.slice(1).match(/../g).map(h => parseInt(h, 16));
        const [, ps, pl] = rgbToHsl(...rgb);
        if (pl > 0.40 && pl < 0.75 && ps > 0.60) return paletteToTheme(palette);
      }
    } catch(e) { console.warn('Dynamic palette failed:', e); }
  }
  return THEMES[CTX.theme || new URLSearchParams(location.search).get('theme') || defaultThemeId];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  4. CSS Animation Tokens & Keyframes
//     Inline this block inside <style> in each game's HTML.
// ═══════════════════════════════════════════════════════════════════════════════
/*
:root {
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --ease-out: cubic-bezier(.25, 1, .5, 1);
  --ease-in: cubic-bezier(.5, 0, 1, .75);
  --duration-fast: 150ms;
  --duration-normal: 280ms;
  --duration-slow: 450ms;
}
@keyframes pop-in { from { opacity:0; transform:scale(.85) } to { opacity:1; transform:scale(1) } }
@keyframes float-up { 0% { opacity:0; transform:translateY(0) } 30% { opacity:1 } 100% { opacity:0; transform:translateY(-40px) } }
@keyframes glow-pulse { 0%,100% { box-shadow:0 0 12px 2px var(--primary-20) } 50% { box-shadow:0 0 28px 6px var(--primary-30) } }
@keyframes deltaPop { 0% { opacity:1; transform:translateY(0) } 60% { opacity:1; transform:translateY(-6px) } 100% { opacity:0; transform:translateY(-14px) } }
*/
