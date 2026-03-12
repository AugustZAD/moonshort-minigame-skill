# Compatibility Checklist

Use this checklist before treating a generated mini-game as production-ready.

- [ ] Single HTML file, no build step required
- [ ] Uses Phaser 3 CDN
- [ ] Reads `attribute` and `primaryColor` from URL query params
- [ ] Uses fixed canvas size `393 x 736`
- [ ] Final settlement screen has one primary confirmation CTA
- [ ] Settlement is sent only from that final CTA
- [ ] Payload includes `rating`, `score`, `attribute`, `modifier`
- [ ] Rating enum is exactly `S / A / B / C / D`
- [ ] Modifier mapping is exactly `+2 / +1 / 0 / -1 / -2`
- [ ] Host validates `modifier === mapping[rating]`
- [ ] Host can discard malformed bridge payloads safely
- [ ] `notifyGameComplete` uses iOS -> Android -> iframe -> console fallback order
- [ ] No host-specific logic outside the bridge function
- [ ] Game remains playable in iframe or WebView context
