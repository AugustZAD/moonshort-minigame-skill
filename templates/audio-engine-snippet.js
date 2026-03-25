/**
 * Moonshort Audio Engine — Web Audio API Synthesizer
 *
 * Zero-dependency, inline-able audio system for H5 mini-games.
 * All sounds are synthesized procedurally — no external files needed.
 *
 * Usage in games:
 *   const audio = new MoonAudio();
 *   audio.tap();        // UI tap feedback
 *   audio.success();    // Achievement / correct action
 *   audio.fail();       // Wrong action / penalty
 *   audio.alert();      // Danger approaching
 *   audio.swoosh();     // Movement / dodge
 *   audio.heartbeat();  // Tension pulse
 *   audio.rain();       // Ambient rain (looping)
 *   audio.bgm('tense'); // Start BGM loop: 'tense' | 'romantic' | 'action' | 'mystery'
 *   audio.stopBgm();    // Fade out BGM
 *   audio.stopAll();    // Stop everything
 *
 * Integration with build pipeline:
 *   CTX.audioConfig = { bgmStyle: 'tense', rain: true, heartbeat: true }
 *   The game reads CTX.audioConfig and calls appropriate methods.
 */

class MoonAudio {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._bgmNodes = [];
    this._ambientNodes = [];
    this._unlocked = false;
  }

  /** Lazy-init AudioContext (must be after user gesture on mobile) */
  _ensure() {
    if (this._ctx) return this._ctx;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._master = this._ctx.createGain();
    this._master.gain.value = 0.6;
    this._master.connect(this._ctx.destination);
    return this._ctx;
  }

  /** Resume context after user gesture (call from first tap handler) */
  unlock() {
    if (this._unlocked) return;
    this._ensure();
    if (this._ctx.state === 'suspended') this._ctx.resume();
    this._unlocked = true;
  }

  // ─── SFX ──────────────────────────────────────────────────────────────

  /** Short click/tap — crisp high-freq ping */
  tap() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(this._master);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** Success chime — ascending two-note */
  success() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    [523, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
      osc.connect(gain).connect(this._master);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.3);
    });
  }

  /** Failure buzz — low dissonant */
  fail() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.25);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(this._master);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Alert/danger — quick descending sweep */
  alert() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(this._master);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Swoosh — noise burst with filter sweep */
  swoosh() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const bufLen = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.15);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(filter).connect(gain).connect(this._master);
    src.start(t);
  }

  /** Heartbeat — double low thump */
  heartbeat() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    [0, 0.18].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, t + offset);
      osc.frequency.exponentialRampToValueAtTime(30, t + offset + 0.15);
      gain.gain.setValueAtTime(0.35, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.2);
      osc.connect(gain).connect(this._master);
      osc.start(t + offset);
      osc.stop(t + offset + 0.2);
    });
  }

  /** Countdown tick */
  tick() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain).connect(this._master);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // ─── Ambient Loops ────────────────────────────────────────────────────

  /** Rain ambience — continuous filtered noise */
  rain() {
    const ctx = this._ensure();
    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    src.connect(filter).connect(gain).connect(this._master);
    src.start();
    this._ambientNodes.push({ src, gain });
    return { src, gain };
  }

  // ─── BGM ──────────────────────────────────────────────────────────────

  /**
   * Procedural BGM loop based on mood.
   * Uses simple chord progressions with oscillators.
   * @param {'tense'|'romantic'|'action'|'mystery'} style
   */
  bgm(style) {
    this.stopBgm();
    const ctx = this._ensure();

    const PROGRESSIONS = {
      tense:    [[130.81, 155.56, 196.00], [123.47, 146.83, 185.00], [116.54, 138.59, 174.61], [123.47, 146.83, 185.00]],
      romantic: [[261.63, 329.63, 392.00], [293.66, 349.23, 440.00], [246.94, 311.13, 369.99], [261.63, 329.63, 392.00]],
      action:   [[164.81, 196.00, 246.94], [174.61, 220.00, 261.63], [146.83, 174.61, 220.00], [155.56, 196.00, 246.94]],
      mystery:  [[146.83, 174.61, 220.00], [138.59, 164.81, 207.65], [130.81, 155.56, 196.00], [138.59, 174.61, 220.00]],
    };

    const chords = PROGRESSIONS[style] || PROGRESSIONS.tense;
    const beatDuration = style === 'action' ? 0.8 : 1.2;
    const loopLen = chords.length * beatDuration;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1);
    masterGain.connect(this._master);

    const schedule = () => {
      const now = ctx.currentTime;
      chords.forEach((chord, ci) => {
        const chordTime = now + ci * beatDuration;
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = style === 'romantic' ? 'sine' : style === 'action' ? 'sawtooth' : 'triangle';
          osc.frequency.value = freq;
          env.gain.setValueAtTime(0, chordTime);
          env.gain.linearRampToValueAtTime(0.08, chordTime + 0.05);
          env.gain.setValueAtTime(0.08, chordTime + beatDuration * 0.7);
          env.gain.linearRampToValueAtTime(0, chordTime + beatDuration);
          osc.connect(env).connect(masterGain);
          osc.start(chordTime);
          osc.stop(chordTime + beatDuration);
        });

        // Bass note (root, one octave down)
        const bass = ctx.createOscillator();
        const bassEnv = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.value = chord[0] / 2;
        bassEnv.gain.setValueAtTime(0, chordTime);
        bassEnv.gain.linearRampToValueAtTime(0.12, chordTime + 0.03);
        bassEnv.gain.setValueAtTime(0.12, chordTime + beatDuration * 0.5);
        bassEnv.gain.linearRampToValueAtTime(0, chordTime + beatDuration);
        bass.connect(bassEnv).connect(masterGain);
        bass.start(chordTime);
        bass.stop(chordTime + beatDuration);
      });
    };

    // Schedule first loop immediately
    schedule();

    // Re-schedule every loop cycle
    const intervalId = setInterval(() => {
      if (!this._ctx || this._ctx.state === 'closed') {
        clearInterval(intervalId);
        return;
      }
      schedule();
    }, loopLen * 1000);

    this._bgmNodes.push({ masterGain, intervalId });
  }

  /** Fade out and stop BGM */
  stopBgm(fadeMs) {
    const fade = (fadeMs || 500) / 1000;
    const ctx = this._ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const node of this._bgmNodes) {
      if (node.intervalId) clearInterval(node.intervalId);
      if (node.masterGain) {
        node.masterGain.gain.linearRampToValueAtTime(0, t + fade);
      }
    }
    this._bgmNodes = [];
  }

  /** Stop all audio (BGM + ambient) */
  stopAll() {
    this.stopBgm(200);
    for (const node of this._ambientNodes) {
      try { node.src.stop(); } catch (_) {}
    }
    this._ambientNodes = [];
  }

  /** Set master volume (0-1) */
  setVolume(v) {
    this._ensure();
    this._master.gain.value = Math.max(0, Math.min(1, v));
  }
}
