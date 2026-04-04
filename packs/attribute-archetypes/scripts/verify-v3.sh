#!/bin/bash
# V3 Quality Check Script
PASS=0; FAIL=0
for f in "$@"; do
  echo "━━━ Checking: $f ━━━"
  errors=0
  # 1. THEMES object
  if ! grep -qE "(const|var|let)\s+THEMES\s*=" "$f"; then echo "  ✗ Missing THEMES object"; errors=$((errors+1)); fi
  # 2. All 7 themes
  for theme in combat mystery nature dark sweet ocean energy; do
    if ! grep -q "${theme}:" "$f"; then echo "  ✗ Missing theme: $theme"; errors=$((errors+1)); fi
  done
  # 3. applyTheme
  if ! grep -q "function applyTheme" "$f"; then echo "  ✗ Missing applyTheme"; errors=$((errors+1)); fi
  # 4. resolveTheme
  if ! grep -q "resolveTheme" "$f"; then echo "  ✗ Missing resolveTheme"; errors=$((errors+1)); fi
  # 5. Animation tokens
  if ! grep -q "\-\-ease-spring" "$f"; then echo "  ✗ Missing --ease-spring"; errors=$((errors+1)); fi
  if ! grep -q "\-\-duration-fast" "$f"; then echo "  ✗ Missing --duration-fast"; errors=$((errors+1)); fi
  # 6. text-shadow stroke
  if ! grep -q "text-shadow" "$f"; then echo "  ✗ Missing text-shadow stroke"; errors=$((errors+1)); fi
  # 7. cover-layer
  if ! grep -q "cover-layer" "$f"; then echo "  ✗ Missing cover-layer"; errors=$((errors+1)); fi
  # 8. extractPalette
  if ! grep -q "extractPalette" "$f"; then echo "  ✗ Missing extractPalette"; errors=$((errors+1)); fi
  # 9. Hardcoded old theme hex outside THEMES block
  # Extract line numbers of THEMES block boundaries
  themes_start=$(grep -nE "(const|var|let)\s+THEMES\s*=" "$f" | head -1 | cut -d: -f1)
  if [ -n "$themes_start" ]; then
    # Find the closing brace of THEMES (next line with only "}" or "};" at same indent)
    themes_end=$(awk -v start="$themes_start" 'NR>start && /^[[:space:]]*\};?[[:space:]]*$/ {print NR; exit}' "$f")
    if [ -z "$themes_end" ]; then
      themes_end=$((themes_start + 200))
    fi
    # Count occurrences of old sweet-theme hex outside THEMES block
    ec4_count=$(awk -v s="$themes_start" -v e="$themes_end" 'NR<s || NR>e' "$f" | grep -oi "#EC4F99" | wc -l)
    f47_count=$(awk -v s="$themes_start" -v e="$themes_end" 'NR<s || NR>e' "$f" | grep -oi "#F472B6" | wc -l)
    total_hardcoded=$((ec4_count + f47_count))
    if [ "$total_hardcoded" -gt 0 ]; then
      echo "  ⚠ Hardcoded old theme hex outside THEMES: #EC4F99×${ec4_count} #F472B6×${f47_count}"
    fi
  fi
  # Result
  if [ "$errors" -eq 0 ]; then echo "  ✓ ALL CHECKS PASSED"; PASS=$((PASS+1));
  else echo "  ✗ $errors issues found"; FAIL=$((FAIL+1)); fi
  echo ""
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASS: $PASS  FAIL: $FAIL  TOTAL: $(($PASS+$FAIL))"
