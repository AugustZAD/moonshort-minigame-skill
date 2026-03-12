# MiniGame Settlement Contract

## Scope
This contract defines how every H5 mini-game sends settlement results back to host containers (iOS/Android/WebView/iframe).

## Host -> Game Input (URL Query)

Required by convention:
- `attribute`: string
- `primaryColor`: hex color string (for theme seed)

Example:

```text
index.html?attribute=Charm&primaryColor=%23FF6B9D
```

## Game -> Host Output (Required Payload)

Every game must send JSON with these required fields:

```json
{
  "rating": "A",
  "score": 8500,
  "attribute": "Charm",
  "modifier": 1
}
```

Field rules:
- `rating`: one of `S`, `A`, `B`, `C`, `D`
- `score`: numeric score for this mini-game run
- `attribute`: echoed attribute context used by host scenario
- `modifier`: mapped by rating
  - `S => 2`
  - `A => 1`
  - `B => 0`
  - `C => -1`
  - `D => -2`

`modifier` is the machine-friendly gameplay effect value for the host. The host can apply it directly to the relevant attribute check instead of re-deriving effect strength from the letter grade.

## Allowed Extension Fields

Games may include additional fields for analytics and replay:

```json
{
  "rating": "S",
  "score": 13200,
  "attribute": "Wisdom",
  "modifier": 2,
  "gameId": "tap-rhythm",
  "durationMs": 30125,
  "moves": 48,
  "seed": "2026-03-12T14:00:00Z"
}
```

These fields are optional and must not break the required 4-field compatibility.

## Transport Function (Required)

```javascript
function notifyGameComplete(result) {
  const payload = JSON.stringify(result);

  if (window.webkit?.messageHandlers?.jsBridge) {
    window.webkit.messageHandlers.jsBridge.postMessage(payload);
    return;
  }
  if (window.jsBridge?.postMessage) {
    window.jsBridge.postMessage(payload);
    return;
  }
  if (window.parent !== window) {
    window.parent.postMessage(payload, '*');
    return;
  }
  console.log('[GameComplete]', result);
}
```

## Trigger Timing Rule

- Settlement must be sent when user confirms completion in final settlement screen.
- Do not auto-send before user acknowledgment.
- Use `S/A/B/C/D` only. No custom labels such as `SS`, `F`, `Perfect`, `Fail`.
