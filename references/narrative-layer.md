# Narrative & Text Presentation Reference

Patterns for text storytelling, dialogue, and animated text in Moonshort H5 mini-games.
This file covers **content presentation only** — sprites, textures, and fonts are in `sprite-assets.md`.

---

## Table of Contents
1. [Scene Flow with Narrative](#1-scene-flow-with-narrative)
2. [NarrativeScene — Typewriter Dialogue](#2-narrativescene--typewriter-dialogue)
3. [TextCardScene — Full-Screen Text Cards](#3-textcardscene--full-screen-text-cards)
4. [Text Animation Utilities](#4-text-animation-utilities)
5. [Mid-Game Story Triggers](#5-mid-game-story-triggers)
6. [Attribute-Aware Result Text](#6-attribute-aware-result-text)

---

## 1. Scene Flow with Narrative

```
BootScene (optional)
  ↓  palette fetched, assets preloaded
TextCardScene / NarrativeScene (optional)
  ↓  story intro delivered; tap to advance
GameScene
  ↓  gameplay; inline story beats fire via showStoryBeat()
ResultScene
  ↓  settlement + attribute-aware flavor text
  ↓  user taps Continue → notifyGameComplete()
  ↓  (optional) epilogue TextCardScene before restart
```

- Use **`NarrativeScene`** when a character speaks with a portrait and dialogue box.
- Use **`TextCardScene`** when you just want words on screen — chapter titles, prologues, cinematic moments.
- Both are optional and independent. Use one, both, or neither.

---

## 2. NarrativeScene — Typewriter Dialogue

Drop-in scene with portrait area, speaker name, dialogue box, and typewriter effect.
Each line: `{ speaker, text, portraitKey? }`.

```javascript
class NarrativeScene extends Phaser.Scene {
  constructor() { super('NarrativeScene'); }

  init(data) {
    this.lines     = data.lines     || [];
    this.nextScene = data.nextScene || 'GameScene';
    this.lineIndex = 0;
    this._typing   = false;
    this._fullText = '';
    this._charIdx  = 0;
  }

  create() {
    const C = COLORS;
    this.cameras.main.setBackgroundColor(C.light);

    // Portrait circle (replaced by image if portraitKey is provided)
    const portraitY = 170;
    this.portraitBg  = this.add.circle(W / 2, portraitY, 62, C.primary).setStrokeStyle(3, C.accent);
    this.portraitLbl = this.add.text(W / 2, portraitY, '✦', {
      fontFamily: FONT_TITLE, fontSize: '36px', color: C.white
    }).setOrigin(0.5);

    // Speaker name
    this.speakerText = this.add.text(W / 2, 255, '', {
      fontFamily: FONT_TITLE, fontSize: '20px', fontStyle: '700', color: C.accent
    }).setOrigin(0.5);

    // Dialogue box
    const boxX = W / 2, boxY = 450;
    this.add.rectangle(boxX, boxY, 353, 200, 0xffffff).setStrokeStyle(2.5, C.accent);
    this.dialogueText = this.add.text(boxX - 152, boxY - 85, '', {
      fontFamily: FONT_BODY, fontSize: '16px', color: '#1f2937',
      wordWrap: { width: 305, useAdvancedWrap: true }, lineSpacing: 6
    });

    // Hint + progress dots
    this.hintText = this.add.text(boxX, boxY + 82, 'Tap to continue  ▼', {
      fontFamily: FONT_BODY, fontSize: '13px', color: C.neutral
    }).setOrigin(0.5).setAlpha(0);

    this.dots = this.lines.map((_, i) =>
      this.add.circle(W / 2 + (i - (this.lines.length - 1) / 2) * 14, H - 50, 4,
        i === 0 ? C.primary : 0xd1d5db)
    );

    this.input.on('pointerdown', () => this.advance());
    this.showLine(0);
  }

  showLine(index) {
    if (index >= this.lines.length) {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start(this.nextScene));
      return;
    }
    const line = this.lines[index];
    this.speakerText.setText(line.speaker || '');
    this.dialogueText.setText('');
    this.hintText.setAlpha(0);
    this.dots.forEach((d, i) =>
      d.setFillStyle(i === index ? COLORS.primary : 0xd1d5db)
    );

    // Optional portrait image swap
    if (line.portraitKey && this.textures.exists(line.portraitKey)) {
      this.portraitBg.setVisible(false);
      this.portraitLbl.setVisible(false);
      if (!this.portraitImg) {
        this.portraitImg = this.add.image(W / 2, 170, line.portraitKey).setDisplaySize(124, 124);
      } else {
        this.portraitImg.setTexture(line.portraitKey);
      }
    }

    // Typewriter
    this._typing   = true;
    this._fullText = line.text;
    this._charIdx  = 0;
    this._typeEvent = this.time.addEvent({
      delay: 28, repeat: line.text.length - 1,
      callback: () => {
        this._charIdx++;
        this.dialogueText.setText(line.text.slice(0, this._charIdx));
        if (this._charIdx >= line.text.length) {
          this._typing = false;
          this.tweens.add({ targets: this.hintText, alpha: 1, duration: 400 });
        }
      }
    });
  }

  advance() {
    if (this._typing) {
      this._typeEvent?.remove();
      this._typing = false;
      this.dialogueText.setText(this._fullText);
      this.tweens.add({ targets: this.hintText, alpha: 1, duration: 200 });
      return;
    }
    this.lineIndex++;
    this.showLine(this.lineIndex);
  }
}
```

### Usage

```javascript
this.scene.start('NarrativeScene', {
  lines: [
    { speaker: 'Mira', text: `Tonight is your chance to prove your ${ATTRIBUTE}. I'll be watching.` },
    { speaker: 'Mira', text: "Reach the top score and I'll know you're serious. Ready?" }
  ],
  nextScene: 'GameScene'
});
```

---

## 3. TextCardScene — Full-Screen Text Cards

No portrait, no dialogue box. Pure text on screen.
Use for: chapter titles, prologues, cinematic time-skips, atmosphere text, attribute announcements.

Each card: `{ text, sub?, eyebrow?, font?, size?, color?, bgColor?, duration? }`.
- `duration` (ms): auto-advance after this time. Omit = wait for tap.
- `eyebrow`: small uppercase label above the main text.
- `sub`: secondary text below the main text.

```javascript
class TextCardScene extends Phaser.Scene {
  constructor() { super('TextCardScene'); }

  init(data) {
    this.cards     = data.cards     || [];
    this.nextScene = data.nextScene || 'GameScene';
    this.cardIndex = 0;
    this._timer    = null;
  }

  create() {
    this.input.on('pointerdown', () => this.nextCard());
    this.showCard(0);
  }

  showCard(index) {
    if (index >= this.cards.length) {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(400, () => this.scene.start(this.nextScene));
      return;
    }

    this.children.each(c => c.destroy());
    if (this._timer) { this._timer.remove(); this._timer = null; }

    const card = this.cards[index];
    this.cameras.main.setBackgroundColor(card.bgColor || '#f8fafc');

    // Eyebrow
    if (card.eyebrow) {
      const ey = this.add.text(W / 2, H / 2 - 72, card.eyebrow.toUpperCase(), {
        fontFamily: FONT_BODY, fontSize: '12px', color: COLORS.neutral, letterSpacing: 3
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: ey, alpha: 1, duration: 400, delay: 80 });
    }

    // Main text
    const main = this.add.text(W / 2, H / 2, card.text, {
      fontFamily: card.font || FONT_TITLE,
      fontSize:   card.size || '30px',
      fontStyle:  '700',
      color:      card.color || '#1f2937',
      align:      'center',
      wordWrap:   { width: 330, useAdvancedWrap: true },
      lineSpacing: 10
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: main, alpha: 1,
      y: { from: H / 2 + 12, to: H / 2 },
      duration: 500, ease: 'Quad.easeOut'
    });

    // Sub-text
    if (card.sub) {
      const sub = this.add.text(W / 2, H / 2 + main.height / 2 + 28, card.sub, {
        fontFamily: FONT_ACCENT, fontSize: '17px',
        color: COLORS.neutral, align: 'center', wordWrap: { width: 300 }
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 350 });
    }

    // Progress dots
    if (this.cards.length > 1) {
      this.cards.forEach((_, i) =>
        this.add.circle(
          W / 2 + (i - (this.cards.length - 1) / 2) * 14, H - 48, 4,
          i === index ? COLORS.primary : 0xd1d5db
        )
      );
    }

    // Auto-advance or tap hint
    if (card.duration) {
      this._timer = this.time.delayedCall(card.duration, () => this.nextCard());
    } else {
      const hint = this.add.text(W / 2, H - 72, 'Tap to continue  ▼', {
        fontFamily: FONT_BODY, fontSize: '13px', color: COLORS.neutral
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 700 });
    }
  }

  nextCard() { this.cardIndex++; this.showCard(this.cardIndex); }
}
```

### Example sequences

```javascript
// Prologue — tap to advance
this.scene.start('TextCardScene', {
  cards: [
    { eyebrow: 'Chapter 1', text: 'The night Mira asked\nfor the truth.' },
    { text: `She wanted to see your ${ATTRIBUTE}\nin action. No excuses.`, font: FONT_ACCENT, size: '24px' },
    { text: 'This is your moment.', size: '36px', color: COLORS.primaryHex }
  ],
  nextScene: 'GameScene'
});

// Cinematic time-skip — auto-advancing
this.scene.start('TextCardScene', {
  cards: [
    { text: 'Three months later...', bgColor: '#111827', color: '#ffffff', duration: 2000 },
    { text: "You still haven't forgotten that night.", bgColor: '#111827', color: '#e5e7eb', duration: 2500 }
  ],
  nextScene: 'GameScene'
});

// Attribute announcement splash — 1.8 s then straight to game
this.scene.start('TextCardScene', {
  cards: [{ eyebrow: 'Attribute Check', text: ATTRIBUTE, size: '52px', duration: 1800 }],
  nextScene: 'GameScene'
});
```

---

## 4. Text Animation Utilities

Standalone helpers callable from any scene. Add before the scene class definitions.

### fadeInText — fade + optional slide-up
```javascript
function fadeInText(scene, textObj, { delay = 0, duration = 400, slideY = 0 } = {}) {
  textObj.setAlpha(0);
  if (slideY) textObj.y += slideY;
  scene.tweens.add({
    targets: textObj, alpha: 1,
    y: textObj.y - slideY,
    delay, duration, ease: 'Quad.easeOut'
  });
  return textObj;
}
// Usage:
const t = scene.add.text(W/2, 120, 'Round Clear!', { ... }).setOrigin(0.5);
fadeInText(scene, t, { delay: 200, slideY: 16 });
```

### typewrite — character-by-character reveal
```javascript
function typewrite(scene, textObj, fullText, { charDelay = 28, onDone } = {}) {
  textObj.setText('');
  let idx = 0;
  scene.time.addEvent({
    delay: charDelay, repeat: fullText.length - 1,
    callback: () => {
      textObj.setText(fullText.slice(0, ++idx));
      if (idx >= fullText.length && onDone) onDone();
    }
  });
}
// Usage (in any scene, no NarrativeScene needed):
const lbl = this.add.text(W/2, H/2, '', { fontFamily: FONT_ACCENT, fontSize: '20px' }).setOrigin(0.5);
typewrite(this, lbl, `Your ${ATTRIBUTE} is about to be tested...`, {
  charDelay: 35,
  onDone: () => this.time.delayedCall(800, () => this.scene.start('GameScene'))
});
```

### wordReveal — word-by-word (better for long lines)
```javascript
function wordReveal(scene, textObj, fullText, { wordDelay = 110, onDone } = {}) {
  const words = fullText.split(' ');
  const shown = [];
  scene.time.addEvent({
    delay: wordDelay, repeat: words.length - 1,
    callback: () => {
      shown.push(words[shown.length]);
      textObj.setText(shown.join(' '));
      if (shown.length >= words.length && onDone) onDone();
    }
  });
}
```

### floatText — rising score / event popup
```javascript
function floatText(scene, x, y, text, color = '#34d399') {
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT_TITLE, fontSize: '22px', fontStyle: '900',
    color, stroke: '#ffffff', strokeThickness: 2
  }).setOrigin(0.5).setDepth(30);
  scene.tweens.add({
    targets: t, y: y - 56, alpha: { from: 1, to: 0 },
    duration: 900, ease: 'Quad.easeOut',
    onComplete: () => t.destroy()
  });
}
// Usage:
floatText(this, player.x, player.y - 20, '+10', '#34d399');
floatText(this, player.x, player.y - 20, '-5',  '#f87171');
floatText(this, W / 2, H / 2, 'PERFECT!', COLORS.primaryHex);
```

### showBanner — top-slide announcement bar
```javascript
function showBanner(scene, text, { bgColor = '#1f2937', textColor = '#ffffff', holdMs = 1800 } = {}) {
  const bg  = scene.add.rectangle(W/2, -40, W, 56,
    Phaser.Display.Color.HexStringToColor(bgColor).color).setDepth(25);
  const lbl = scene.add.text(W/2, -40, text, {
    fontFamily: FONT_TITLE, fontSize: '20px', fontStyle: '700', color: textColor
  }).setOrigin(0.5).setDepth(26);
  scene.tweens.add({
    targets: [bg, lbl], y: 80, duration: 350, ease: 'Back.easeOut',
    onComplete: () =>
      scene.time.delayedCall(holdMs, () =>
        scene.tweens.add({
          targets: [bg, lbl], y: -40, duration: 280, ease: 'Quad.easeIn',
          onComplete: () => { bg.destroy(); lbl.destroy(); }
        })
      )
  });
}
// Usage:
showBanner(this, '⚡ Combo x3!', { bgColor: COLORS.primaryHex });
showBanner(this, 'Time is running out...', { bgColor: '#dc2626' });
```

---

## 5. Mid-Game Story Triggers

Non-blocking text overlay that fires once at a score threshold or game event.
Gameplay continues uninterrupted; the bar auto-dismisses.

```javascript
// In GameScene.create():
this._storyFired = {};

showStoryBeat(key, text, durationMs = 2200) {
  if (this._storyFired[key]) return;
  this._storyFired[key] = true;
  const bar = this.add.rectangle(W/2, H - 90, W, 56, 0x000000, 0.72).setDepth(20);
  const lbl = this.add.text(W/2, H - 90, text, {
    fontFamily: FONT_ACCENT, fontSize: '17px', color: '#ffffff',
    align: 'center', wordWrap: { width: 340 }
  }).setOrigin(0.5).setDepth(21);
  [bar, lbl].forEach(o => o.setAlpha(0));
  this.tweens.add({ targets: [bar, lbl], alpha: 1, duration: 250 });
  this.time.delayedCall(durationMs - 300, () =>
    this.tweens.add({
      targets: [bar, lbl], alpha: 0, duration: 300,
      onComplete: () => { bar.destroy(); lbl.destroy(); }
    })
  );
}

// Trigger in addScore() or update():
if (this.score >= 30) this.showStoryBeat('mid', `${ATTRIBUTE} is building...`);
if (this.score >= 80) this.showStoryBeat('near', "Almost there. Don't stop now.");
```

### Full cutscene pause (optional)
Pause the game and briefly surface a `NarrativeScene` or `TextCardScene`:

```javascript
pauseForCutscene(cards) {
  this.scene.pause('GameScene');
  this.scene.launch('TextCardScene', {
    cards,
    nextScene: null  // special value: resume instead of start new scene
  });
  // In TextCardScene.showCard(), detect nextScene === null and call:
  //   this.scene.stop('TextCardScene');
  //   this.scene.resume('GameScene');
}
```

---

## 6. Attribute-Aware Result Text

Personalize the result screen using the `ATTRIBUTE` value.
Define `RESULT_FLAVOR` near `RATING_THRESHOLDS` at the top of the script.

```javascript
const RESULT_FLAVOR = {
  S: `Your ${ATTRIBUTE} is exceptional. This moment belongs to you.`,
  A: `Strong ${ATTRIBUTE}. You made a real impression.`,
  B: `${ATTRIBUTE} holds steady — a solid foundation to build on.`,
  C: `${ATTRIBUTE} wavered this time. The next round is yours to reclaim.`
};

// In ResultScene.create(), after the score text:
this.add.text(W / 2, 400, RESULT_FLAVOR[rating], {
  fontFamily: FONT_ACCENT, fontSize: '17px', color: '#374151',
  align: 'center', wordWrap: { width: 320 }
}).setOrigin(0.5);
```

Pass story context forward from `GameScene` when useful:

```javascript
this.scene.start('ResultScene', {
  score: this.score,
  durationMs: elapsed,
  storyBeats: Object.keys(this._storyFired)  // which moments were triggered
});
```
