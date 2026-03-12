# Cocos WebView Integration

## Purpose
This guide shows how the Moonshort host app should receive, validate, and apply mini-game settlement payloads from H5 WebView content.

## What `modifier` means

`modifier` is the numeric gameplay effect produced by the settlement grade.

It exists so the host does not need to infer effect strength from the letter grade every time. The mini-game returns both:
- `rating`: user-facing result grade
- `modifier`: machine-friendly effect value for host logic

Fixed mapping:

| Rating | Modifier | Meaning |
| --- | --- | --- |
| `S` | `+2` | strong success bonus |
| `A` | `+1` | normal success bonus |
| `B` | `0` | neutral result |
| `C` | `-1` | light penalty |
| `D` | `-2` | strong penalty |

In practice, the host should apply `modifier` to the relevant attribute check for the next round or the configured duration.

## Payload Contract

Required fields:

```json
{
  "rating": "A",
  "score": 8500,
  "attribute": "Charm",
  "modifier": 1
}
```

The host should reject payloads if:
- the rating is not `S/A/B/C/D`
- `modifier` does not match the rating
- required fields are missing or malformed

## Recommended Host Parsing

Use [cocos-settlement-handler.ts](/Users/Clock/moonshort/host/cocos-settlement-handler.ts) as the reference host adapter.

## Cocos Example

```ts
import { WebView } from 'cc';
import {
  parseMiniGameBridgeEvent,
  MODIFIER_BY_RATING,
  type MiniGameSettlement,
} from './host/cocos-settlement-handler';

webviewNode.on(WebView.EventType.JS_BRIDGE, (event: { detail: string }) => {
  let settlement: MiniGameSettlement;

  try {
    settlement = parseMiniGameBridgeEvent(event);
  } catch (error) {
    console.error('[MiniGame] Invalid settlement payload:', error);
    return;
  }

  console.log('[MiniGame] Settlement received:', settlement);

  // Apply gameplay effect. Keep host logic authoritative.
  const modifier = settlement.modifier;
  const attribute = settlement.attribute;
  applyMiniGameModifier(attribute, modifier);
  persistMiniGameResult(settlement);
});

function applyMiniGameModifier(attribute: string, modifier: number) {
  // Example only: wire this into your real save / battle / check system.
  console.log('[MiniGame] Apply modifier', attribute, modifier);
}

function persistMiniGameResult(settlement: MiniGameSettlement) {
  console.log('[MiniGame] Persist settlement', settlement);
}
```

## URL Parameters Passed Into H5

The host should pass at least:

```text
index.html?attribute=Charm&primaryColor=%23FF6B9D
```

## Host Compatibility Rules

- Treat the host as authoritative for applying gameplay consequences.
- Trust the mini-game for presentation, not for security.
- Validate that `modifier === mapping[rating]`.
- Allow extra fields, but ignore unknown fields unless explicitly supported.
- Log and discard malformed payloads.
