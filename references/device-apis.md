# Device API Integration Reference

Patterns for camera, microphone, and gyroscope/motion in Moonshort H5 mini-games.

**Golden rule**: every device API call must be triggered by a user gesture (button `pointerup`),
never called automatically on scene create. This is enforced by browsers and iOS WKWebView.

---

## Table of Contents
1. [Gyroscope / Device Orientation](#1-gyroscope--device-orientation)
2. [Microphone](#2-microphone)
3. [Camera](#3-camera)
4. [Graceful Degradation Checklist](#4-graceful-degradation-checklist)
5. [WebView Requirements Summary](#5-webview-requirements-summary)

---

## 1. Gyroscope / Device Orientation

### 1.1 Permission Request (iOS 13+ required)

iOS 13+ requires explicit permission for `DeviceOrientationEvent`. The call must happen
synchronously inside a user-gesture handler — async delays outside the gesture fail silently.

```javascript
async function requestGyroPermission() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    const result = await DeviceOrientationEvent.requestPermission();
    return result === 'granted';
  }
  return true; // Android and pre-iOS13: no explicit grant needed
}
```

### 1.2 Tilt Input — Phaser Scene Pattern

```javascript
// GameScene.create() — wire to a "Start" button, not directly in create()
this.tiltX = 0; // gamma: −90 to +90 (device tilts left/right)
this.tiltY = 0; // beta:  −180 to +180 (device tilts front/back)

this._onOrientation = (e) => {
  this.tiltX = e.gamma ?? 0;
  this.tiltY = e.beta  ?? 0;
};

// GameScene.shutdown() — always clean up listeners
window.removeEventListener('deviceorientation', this._onOrientation);

// Attach after permission granted:
this.startBtn.on('pointerup', async () => {
  const granted = await requestGyroPermission();
  if (granted) {
    window.addEventListener('deviceorientation', this._onOrientation);
  } else {
    this.activatePointerFallback();
  }
  this.startGame();
});

// GameScene.update(time, delta):
const speed = 5;
this.player.x += this.tiltX * speed * (delta / 16);
this.player.x  = Phaser.Math.Clamp(this.player.x, 24, W - 24);
```

### 1.3 Shake Detection — DeviceMotion

```javascript
this._onMotion = (e) => {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const magnitude = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
  if (magnitude > 20) this.onShake(); // 20 m/s² is a firm shake
};

window.addEventListener('devicemotion', this._onMotion);

// GameScene.shutdown():
window.removeEventListener('devicemotion', this._onMotion);
```

### 1.4 Pointer Fallback

```javascript
activatePointerFallback() {
  // Simulate tilt via drag — same gameplay feel, no sensor needed
  this.input.on('pointermove', (ptr) => {
    this.tiltX = ((ptr.x - W / 2) / (W / 2)) * 45; // simulate ±45°
    this.tiltY = ((ptr.y - H / 2) / (H / 2)) * 30;
  });
}
```

---

## 2. Microphone

### 2.1 Permission + Analyser Setup

```javascript
async function startMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const ctx    = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.frequencyBinCount);

    return {
      // Volume: 0–128. Typical silence ~2, speech ~15–40, shout ~60+
      getVolume() {
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (const v of timeData) sum += Math.abs(v - 128);
        return sum / timeData.length;
      },
      // Returns index of the dominant frequency bin (0–127)
      getDominantBin() {
        analyser.getByteFrequencyData(freqData);
        let maxIdx = 0;
        for (let i = 1; i < freqData.length; i++) {
          if (freqData[i] > freqData[maxIdx]) maxIdx = i;
        }
        return maxIdx;
      },
      stop() {
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
      }
    };
  } catch (e) {
    console.warn('[Mic] Permission denied or unavailable:', e);
    return null;
  }
}
```

### 2.2 Phaser Integration Pattern

```javascript
// GameScene.create() — attach to a "Start" button
this.mic = null;

this.startBtn.on('pointerup', async () => {
  this.mic = await startMicrophone();
  if (!this.mic) {
    this.showPermissionFallback('Microphone unavailable — tap the circle instead');
    this.input.on('pointerdown', () => this.onInput(40));
  }
  this.startGame();
});

// GameScene.update(time, delta):
if (this.mic) {
  const vol = this.mic.getVolume();
  if (vol > 18) this.onLoudInput(vol);  // voice detected
}

// GameScene.shutdown():
if (this.mic) { this.mic.stop(); this.mic = null; }
```

### 2.3 Voice-Controlled Mechanic Ideas
- **Blow to float**: high volume keeps object airborne; silence = fall.
- **Pitch to steer**: low pitch = left, high pitch = right.
- **Sustained note**: hold a tone to charge a meter.
- **Clap detection**: sudden spike (vol > 50) triggers an action.

### 2.4 iOS WebView Requirement
The host WKWebView must set:
- `configuration.mediaTypesRequiringUserActionForPlayback = []`
- `NSMicrophoneUsageDescription` string in `Info.plist`

---

## 3. Camera

### 3.1 Permission + Video Stream Setup

```javascript
async function startCamera(facingMode = 'user') {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 393 }, height: { ideal: 736 } },
      audio: false
    });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', ''); // required for iOS inline playback
    video.muted = true;
    await video.play();
    return { stream, video };
  } catch (e) {
    console.warn('[Camera] Permission denied or unavailable:', e);
    return null;
  }
}
```

### 3.2 Rendering Camera Feed in Phaser

```javascript
// GameScene.create()
this.camFeed    = null;
this.camTexture = null;
this.camImage   = null;

this.startBtn.on('pointerup', async () => {
  this.camFeed = await startCamera('user');
  if (this.camFeed) {
    // Create a Phaser canvas texture the same size as the game canvas
    this.camTexture = this.textures.createCanvas('cam', W, H);
    this.camImage   = this.add.image(W / 2, H / 2, 'cam');
    this.camImage.setDepth(-1); // render behind game elements
  } else {
    this.showPermissionFallback('Camera unavailable — using gesture controls');
  }
  this.startGame();
});

// GameScene.update():
if (this.camFeed && this.camTexture) {
  const ctx = this.camTexture.getContext();
  ctx.save();
  // Mirror front-facing camera (natural selfie orientation)
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(this.camFeed.video, 0, 0, W, H);
  ctx.restore();
  this.camTexture.refresh();
}

// GameScene.shutdown():
if (this.camFeed) {
  this.camFeed.stream.getTracks().forEach(t => t.stop());
  this.camFeed = null;
}
if (this.camTexture) {
  this.textures.remove('cam');
  this.camTexture = null;
}
```

### 3.3 Motion Detection via Frame Differencing

Detect how much the camera image changed since the last frame — useful for "move to dodge"
or "stay still to charge" mechanics.

```javascript
// In GameScene — initialize once
this._prevPixels = null;

getMotionScore() {
  if (!this.camTexture) return 0;
  const ctx  = this.camTexture.getContext();
  const curr = ctx.getImageData(0, 0, W, H).data;

  if (!this._prevPixels) {
    this._prevPixels = new Uint8ClampedArray(curr);
    return 0;
  }

  let diff = 0;
  // Sample every 8th pixel (R channel only) for performance
  for (let i = 0; i < curr.length; i += 32) {
    diff += Math.abs(curr[i] - this._prevPixels[i]);
  }

  // Copy current to previous (reuse buffer)
  this._prevPixels.set(curr);

  // Returns 0–255 average delta; typical still scene ~2, active movement ~20+
  return diff / (curr.length / 32);
}
```

### 3.4 Camera-Based Mechanic Ideas
- **Pose to play**: detect body movement (left/right lean) to steer.
- **Smile to score**: bright-zone detection on face region for expression reading.
- **Background isolation**: use motion delta to distinguish player from background.
- **AR overlay**: draw Phaser objects on top of the live feed (depth = -1 for feed, 0+ for game).
- **Still challenge**: penalize the player for moving (low motion = score multiplier).

### 3.5 iOS WebView Requirements
- `WKWebView.configuration.allowsInlineMediaPlayback = true`
- `NSCameraUsageDescription` string in `Info.plist`
- `playsinline` attribute on `<video>` is mandatory

### 3.6 Android WebView Requirements
- `WebChromeClient.onPermissionRequest` must be implemented and grant camera permission.
- `android:hardwareAccelerated="true"` on the host Activity.

---

## 4. Graceful Degradation Checklist

Every device-feature game must have a fully playable fallback path.

- Show a clearly labeled permission button (e.g., "Allow Camera to Play").
- If permission is denied, display a short explanation and activate the fallback immediately.
- The fallback must be mechanically equivalent — same objective, same scoring, different input.
- Never block game start due to a missing sensor.
- Wrap every `getUserMedia` and `requestPermission` call in `try/catch`.
- Remove all event listeners in `GameScene.shutdown()` (DeviceOrientation, DeviceMotion, etc.).
- Test the no-sensor path first, then layer sensor support on top.

### Fallback Map

| Feature | Primary input | Fallback input |
|---------|--------------|----------------|
| Gyroscope tilt | `DeviceOrientationEvent.gamma/beta` | Pointer drag / touch position |
| Shake | `DeviceMotionEvent` acceleration spike | Rapid tap burst |
| Microphone volume | `AnalyserNode.getByteTimeDomainData` | Tap/hold button |
| Microphone pitch | `AnalyserNode.getByteFrequencyData` | Two-button left/right |
| Camera motion | Frame differencing | Swipe gesture |
| Camera feed | `getUserMedia` video stream | Solid color background |

---

## 5. WebView Requirements Summary

| Feature | iOS WKWebView | Android WebView |
|---------|--------------|-----------------|
| Gyroscope | iOS 13+: call `DeviceOrientationEvent.requestPermission()` in gesture handler | Works without extra config (API 23+) |
| DeviceMotion | Same as above | Works without extra config |
| Microphone | `NSMicrophoneUsageDescription` in Info.plist; `mediaTypesRequiringUserActionForPlayback = []` | `RECORD_AUDIO` permission in manifest; `onPermissionRequest` in WebChromeClient |
| Camera | `NSCameraUsageDescription` in Info.plist; `allowsInlineMediaPlayback = true` | `CAMERA` permission in manifest; `onPermissionRequest` in WebChromeClient; `hardwareAccelerated = true` |

For host-side integration details, see `host/cocos-webview-integration.md`.
