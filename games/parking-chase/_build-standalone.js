const fs = require('fs');
const path = require('path');
const ROOT = 'D:/nick/MobAI/minigame-remix';
let html = fs.readFileSync(path.join(ROOT, 'games/parking-chase/index-freesound.html'), 'utf8');

// 1. Inline Phaser
html = html.replace(
  '<script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>',
  '<script>' + fs.readFileSync(path.join(ROOT, 'games/parking-chase/phaser.min.js'), 'utf8') + '</script>'
);

// 2. Images → base64
const imgs = {
  bg:    { p: 'data/ep5/background/20260320-121814.jpg', m: 'image/jpeg' },
  aiden: { p: 'data/ep5/processed/aiden_tense2_transparent.png', m: 'image/png' },
  avery: { p: 'data/ep5/processed/avery_tense3_transparent.png', m: 'image/png' },
};
for (const [k, v] of Object.entries(imgs)) {
  const b64 = 'data:' + v.m + ';base64,' + fs.readFileSync(path.join(ROOT, v.p)).toString('base64');
  html = html.replace("BASE + '/" + v.p + "'", "'" + b64 + "'");
}
html = html.replace(/const BASE = \(\(\) => \{[\s\S]*?\}\)\(\);\n\n/, '');

// 3. Audio → base64
const audioDir = path.join(ROOT, 'games/parking-chase/audio');
for (const name of ['heartbeat','rain','alert','bgm_main','success','fail','tick','footstep']) {
  const b64 = 'data:audio/mpeg;base64,' + fs.readFileSync(path.join(audioDir, name + '.mp3')).toString('base64');
  html = html.replace(/https:\/\/cdn\.freesound\.org\/previews\/[^']+/, b64);
}

// 4. fetch → base64 decode
html = html.replace(
  `    const promises = Object.entries(urls).map(async ([key, url]) => {\n      try {\n        const resp = await fetch(url);\n        if (!resp.ok) throw new Error(resp.status);\n        const buf = await resp.arrayBuffer();\n        this._buffers[key] = await this._ctx.decodeAudioData(buf);\n      } catch (e) { console.warn('FreesoundAudio: failed to load ' + key, e); }\n    });\n    await Promise.all(promises);`,
  `    const decodeDataUri = (uri) => {\n      const b64 = uri.split(',')[1]; const bin = atob(b64);\n      const u8 = new Uint8Array(bin.length);\n      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);\n      return u8.buffer;\n    };\n    const promises = Object.entries(urls).map(async ([key, uri]) => {\n      try { this._buffers[key] = await this._ctx.decodeAudioData(decodeDataUri(uri));\n      } catch (e) { console.warn('FreesoundAudio: decode failed ' + key, e); }\n    });\n    await Promise.all(promises);`
);

// 5. BootScene: addBase64 + blocking audio (base64 decode is fast, no network)
html = html.replace(
  `    this.load.image('bg',    IMG.bg);\n    this.load.image('aiden', IMG.aiden);\n    this.load.image('avery', IMG.avery);\n  }\n  create() {\n    // Load audio then start game — use flag + update loop for reliable transition\n    this._ready = false;\n    audio.loadAll().then(() => { this._ready = true; }).catch(() => { this._ready = true; });\n  }\n  update() {\n    if (this._ready) this.scene.start('Game');\n  }`,
  `    // Images loaded via addBase64 in create()\n  }\n  create() {\n    let n = 0;\n    const onTex = () => { if (++n >= 3) {\n      this.textures.off('addtexture', onTex);\n      this._ready = true;\n    }};\n    this.textures.on('addtexture', onTex);\n    ['bg','aiden','avery'].forEach(k => this.textures.addBase64(k, IMG[k]));\n    audio.loadAll().catch(() => {});\n  }\n  update() {\n    if (this._ready) this.scene.start('Game');\n  }`
);

const out = path.join(ROOT, 'games/parking-chase/index-standalone.html');
fs.writeFileSync(out, html);
console.log('OK: ' + (fs.statSync(out).size / 1024 / 1024).toFixed(2) + ' MB');
