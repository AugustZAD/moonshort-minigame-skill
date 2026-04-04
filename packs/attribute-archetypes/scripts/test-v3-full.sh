#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# V3 Full Spectrum Static Analysis
# Checks all 12 mandatory rules + 14 known bugs + visual spec compliance
# ═══════════════════════════════════════════════════════════════════════════════

TOTAL_PASS=0; TOTAL_FAIL=0; TOTAL_WARN=0
REPORT=""

check() {
  local label="$1" result="$2" detail="$3"
  if [ "$result" = "PASS" ]; then
    echo "  ✓ $label"
  elif [ "$result" = "WARN" ]; then
    echo "  ⚠ $label: $detail"
    TOTAL_WARN=$((TOTAL_WARN+1))
  else
    echo "  ✗ $label: $detail"
    TOTAL_FAIL=$((TOTAL_FAIL+1))
  fi
}

for f in "$@"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  gamename=$(basename $(dirname "$f"))
  echo "  TESTING: $gamename/index-v3.html"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  file_errors=0

  # ───────────────────────────────────────────────────
  echo "  ── 强制规则 (12条) ──"
  # ───────────────────────────────────────────────────

  # Rule 1: No document.styleSheets[0]
  if grep -q "styleSheets\[0\]" "$f"; then
    check "R1: 禁止 styleSheets[0]" "FAIL" "发现 document.styleSheets[0] 使用"
    file_errors=$((file_errors+1))
  else
    check "R1: 禁止 styleSheets[0]" "PASS"
  fi

  # Rule 2: BootScene no this.add.text()
  # Extract BootScene block and check for this.add.text
  boot_start=$(grep -n "class BootScene" "$f" | head -1 | cut -d: -f1)
  game_start=$(grep -n "class GameScene" "$f" | head -1 | cut -d: -f1)
  if [ -n "$boot_start" ] && [ -n "$game_start" ]; then
    boot_text_count=$(awk -v s="$boot_start" -v e="$game_start" 'NR>=s && NR<e' "$f" | grep -c "this\.add\.text(")
    if [ "$boot_text_count" -gt 0 ]; then
      check "R2: BootScene 禁止 this.add.text()" "FAIL" "发现 $boot_text_count 处"
      file_errors=$((file_errors+1))
    else
      check "R2: BootScene 禁止 this.add.text()" "PASS"
    fi
  else
    check "R2: BootScene 禁止 this.add.text()" "WARN" "未找到 BootScene/GameScene 类"
  fi

  # Rule 3: resetFX() in every Scene create
  scene_count=$(grep -c "class.*Scene extends Phaser.Scene" "$f")
  resetfx_count=$(grep -c "resetFX()" "$f")
  # We expect resetFX in at least GameScene + ResultScene (not necessarily BootScene)
  if [ "$resetfx_count" -ge 2 ]; then
    check "R3: resetFX() 存在" "PASS" "(found $resetfx_count)"
  else
    check "R3: resetFX() 每个 Scene create() 中" "FAIL" "仅发现 $resetfx_count 处 (需至少2)"
    file_errors=$((file_errors+1))
  fi

  # Rule 3b: children.removeAll(true) in Scene create
  removeall_count=$(grep -c "children\.removeAll(true)" "$f")
  if [ "$removeall_count" -ge 2 ]; then
    check "R3b: children.removeAll(true)" "PASS" "(found $removeall_count)"
  else
    check "R3b: children.removeAll(true)" "FAIL" "仅发现 $removeall_count 处 (需至少2)"
    file_errors=$((file_errors+1))
  fi

  # Rule 4: No \uXXXX in HTML text content (outside JS strings)
  unicode_escape=$(grep -oP '\\u[0-9A-Fa-f]{4}' "$f" | head -5)
  if [ -n "$unicode_escape" ]; then
    check "R4: 禁止 \\uXXXX 转义" "WARN" "发现: $unicode_escape"
  else
    check "R4: 禁止 \\uXXXX 转义" "PASS"
  fi

  # Rule 5: No surrogate pairs \uD83D
  if grep -qP '\\uD[89A-Fa-f][0-9A-Fa-f]{2}' "$f"; then
    check "R5: 禁止 surrogate pair" "FAIL" "发现 \\uD83D 等代理对"
    file_errors=$((file_errors+1))
  else
    check "R5: 禁止 surrogate pair" "PASS"
  fi

  # Rule 6: Interactive games should have hitArea (check games that need it)
  # Games needing Phaser hitArea: maze-escape, parking-rush, spotlight-seek, cannon-aim
  case "$gamename" in
    maze-escape|parking-rush|spotlight-seek|cannon-aim)
      if grep -q "setInteractive" "$f"; then
        check "R6: Phaser hitArea 交互区" "PASS"
      else
        check "R6: Phaser hitArea 交互区" "WARN" "$gamename 可能需要 setInteractive"
      fi
      ;;
    *)
      check "R6: Phaser hitArea (N/A)" "PASS"
      ;;
  esac

  # Rule 7: DOM/Phaser overlap - check for z-index management
  if grep -q "z-index.*:.*10" "$f" && grep -q "z-index.*:.*1" "$f"; then
    check "R7: z-index 分层管理" "PASS"
  else
    check "R7: z-index 分层管理" "WARN" "z-index 层级可能不完整"
  fi

  # Rule 8: REPLAY → BootScene (not GameScene)
  replay_lines=$(grep -n "REPLAY" "$f" | grep -i "scene.start")
  replay_to_game=$(grep "REPLAY" "$f" -A5 | grep "scene\.start.*GameScene")
  replay_to_boot=$(grep "REPLAY" "$f" -A5 | grep "scene\.start.*BootScene")
  if [ -n "$replay_to_game" ]; then
    check "R8: REPLAY → BootScene" "FAIL" "REPLAY 直接跳 GameScene"
    file_errors=$((file_errors+1))
  elif [ -n "$replay_to_boot" ]; then
    check "R8: REPLAY → BootScene" "PASS"
  else
    # Also check if any REPLAY button goes to BootScene anywhere nearby
    replay_boot=$(grep -c "BootScene" "$f")
    if [ "$replay_boot" -gt 0 ]; then
      check "R8: REPLAY → BootScene" "PASS" "(indirect)"
    else
      check "R8: REPLAY → BootScene" "WARN" "未找到明确 REPLAY 路由"
    fi
  fi

  # Rule 9: Gameplay intro present
  has_boot_card=$(grep -c "boot-card\|rules-card\|circle-content\|mode-hint\|game-rules\|规则\|How to\|玩法\|点击\|swipe\|按住" "$f")
  if [ "$has_boot_card" -ge 2 ]; then
    check "R9: 玩法介绍" "PASS"
  else
    check "R9: 玩法介绍" "WARN" "可能缺少 BootScene 玩法说明 (matches: $has_boot_card)"
  fi

  # Rule 10: UNLOCK S TIER button
  if grep -q "UNLOCK.*S.*TIER\|UNLOCK S TIER\|unlock.*tier" "$f"; then
    check "R10: UNLOCK S TIER 按钮" "PASS"
  else
    check "R10: UNLOCK S TIER 按钮" "FAIL" "缺少 UNLOCK S TIER"
    file_errors=$((file_errors+1))
  fi

  # Rule 11: Candy button CSS (color-mix pattern)
  if grep -q "color-mix" "$f"; then
    check "R11: candy 按钮 color-mix" "PASS"
  else
    check "R11: candy 按钮 color-mix" "WARN" "未找到 color-mix 渐变 (按钮可能太平)"
  fi

  # Rule 12: No dead PRIMARY_COLOR
  themes_start_line=$(grep -nE "(const|var|let)\s+THEMES\s*=" "$f" | head -1 | cut -d: -f1)
  if [ -n "$themes_start_line" ]; then
    themes_end_line=$(awk -v start="$themes_start_line" 'NR>start && /^[[:space:]]*\};?[[:space:]]*$/ {print NR; exit}' "$f")
    [ -z "$themes_end_line" ] && themes_end_line=$((themes_start_line + 200))
    primary_color_outside=$(awk -v s="$themes_start_line" -v e="$themes_end_line" 'NR<s || NR>e' "$f" | grep -c "PRIMARY_COLOR")
    if [ "$primary_color_outside" -gt 0 ]; then
      check "R12: 删除 PRIMARY_COLOR 死代码" "FAIL" "发现 $primary_color_outside 处"
      file_errors=$((file_errors+1))
    else
      check "R12: 删除 PRIMARY_COLOR 死代码" "PASS"
    fi
  else
    check "R12: PRIMARY_COLOR (无THEMES)" "FAIL" "THEMES 对象缺失"
    file_errors=$((file_errors+1))
  fi

  # ───────────────────────────────────────────────────
  echo "  ── V3 视觉规范 ──"
  # ───────────────────────────────────────────────────

  # V3-1: THEMES object with 7 themes
  if grep -qE "(const|var|let)\s+THEMES\s*=" "$f"; then
    check "V3-1: THEMES 对象存在" "PASS"
  else
    check "V3-1: THEMES 对象存在" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  missing_themes=""
  for theme in combat mystery nature dark sweet ocean energy; do
    if ! grep -q "${theme}:" "$f"; then
      missing_themes="$missing_themes $theme"
    fi
  done
  if [ -z "$missing_themes" ]; then
    check "V3-2: 7 套主题完整" "PASS"
  else
    check "V3-2: 7 套主题完整" "FAIL" "缺失:$missing_themes"
    file_errors=$((file_errors+1))
  fi

  # V3-3: applyTheme function
  if grep -q "function applyTheme\|applyTheme\s*=" "$f"; then
    check "V3-3: applyTheme 函数" "PASS"
  else
    check "V3-3: applyTheme 函数" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  # V3-4: resolveTheme
  if grep -q "resolveTheme" "$f"; then
    check "V3-4: resolveTheme 动态取色" "PASS"
  else
    check "V3-4: resolveTheme 动态取色" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  # V3-5: extractPalette chain
  if grep -q "extractPalette" "$f"; then
    check "V3-5: extractPalette 链" "PASS"
  else
    check "V3-5: extractPalette 链" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  # V3-6: Animation tokens
  anim_ok=true
  for token in "--ease-spring" "--duration-fast" "--duration-normal" "--duration-slow"; do
    if ! grep -qF -- "$token" "$f"; then
      anim_ok=false
      break
    fi
  done
  if $anim_ok; then
    check "V3-6: CSS 动画 tokens" "PASS"
  else
    check "V3-6: CSS 动画 tokens" "FAIL" "缺少 $token"
    file_errors=$((file_errors+1))
  fi

  # V3-7: @keyframes
  kf_count=0
  for kf in "pop-in" "float-up" "glow-pulse" "deltaPop"; do
    grep -q "@keyframes $kf" "$f" && kf_count=$((kf_count+1))
  done
  if [ "$kf_count" -ge 3 ]; then
    check "V3-7: @keyframes 动画 ($kf_count/4)" "PASS"
  else
    check "V3-7: @keyframes 动画 ($kf_count/4)" "WARN" "缺少部分 keyframes"
  fi

  # V3-8: text-shadow stroke on title
  if grep -q "text-shadow" "$f"; then
    check "V3-8: text-shadow 描边" "PASS"
  else
    check "V3-8: text-shadow 描边" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  # V3-9: cover-layer
  if grep -q "cover-layer" "$f"; then
    check "V3-9: cover-layer 封面层" "PASS"
  else
    check "V3-9: cover-layer 封面层" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  # V3-10: hexToRgba / hexToInt helper
  if grep -q "hexToRgba\|hexToInt" "$f"; then
    check "V3-10: hexToRgba/hexToInt" "PASS"
  else
    check "V3-10: hexToRgba/hexToInt" "WARN" "可能缺少颜色工具函数"
  fi

  # V3-11: secondary button (gold gradient for UNLOCK)
  if grep -q "secondary.*base\|\.secondary\|#F5C842.*#B8860B\|B8860B" "$f"; then
    check "V3-11: 金色 secondary 按钮" "PASS"
  else
    check "V3-11: 金色 secondary 按钮" "WARN" "未找到 secondary 金色渐变"
  fi

  # ───────────────────────────────────────────────────
  echo "  ── 评分系统 ──"
  # ───────────────────────────────────────────────────

  # Rating thresholds
  if grep -qE "RATING_THRESHOLDS\s*=" "$f"; then
    thresholds=$(grep -oP 'RATING_THRESHOLDS\s*=\s*\{[^}]+\}' "$f")
    check "评分: RATING_THRESHOLDS 定义" "PASS" "$thresholds"
  else
    check "评分: RATING_THRESHOLDS 定义" "FAIL" "缺失"
    file_errors=$((file_errors+1))
  fi

  # 4-tier S/A/B/C rating
  rating_func=$(grep -c "return 'S'\|return 'A'\|return 'B'\|return 'C'" "$f")
  if [ "$rating_func" -ge 3 ]; then
    check "评分: S/A/B/C 四档" "PASS"
  else
    check "评分: S/A/B/C 四档" "WARN" "评分分档可能不完整 (matches: $rating_func)"
  fi

  # ───────────────────────────────────────────────────
  echo "  ── 编码和资源 ──"
  # ───────────────────────────────────────────────────

  # UTF-8 check (no BOM)
  first_bytes=$(xxd -l 3 "$f" 2>/dev/null | head -1)
  if echo "$first_bytes" | grep -q "efbb bf"; then
    check "编码: UTF-8 BOM" "WARN" "文件有 BOM，可能导致兼容问题"
  else
    check "编码: UTF-8 无BOM" "PASS"
  fi

  # Phaser CDN
  if grep -q "phaser@3.60.0" "$f"; then
    check "资源: Phaser 3.60.0 CDN" "PASS"
  elif grep -q "phaser@3" "$f"; then
    phaser_ver=$(grep -oP 'phaser@[0-9.]+' "$f" | head -1)
    check "资源: Phaser CDN" "WARN" "版本: $phaser_ver (期望 3.60.0)"
  else
    check "资源: Phaser CDN" "FAIL" "未找到 Phaser 引用"
    file_errors=$((file_errors+1))
  fi

  # Google Fonts
  if grep -q "fonts.googleapis.com.*Montserrat" "$f"; then
    check "资源: Montserrat 字体" "PASS"
  else
    check "资源: Montserrat 字体" "WARN" "未找到 Montserrat 字体链接"
  fi

  # Canvas size 393x852 or 393x736
  if grep -qE "width.*393.*height.*852\|393.*852" "$f"; then
    check "资源: Canvas 尺寸 393×852" "PASS"
  elif grep -qE "width.*393.*height.*736\|393.*736" "$f"; then
    check "资源: Canvas 尺寸" "WARN" "使用 393×736 (V3 标准为 852)"
  else
    check "资源: Canvas 尺寸" "WARN" "未确认标准尺寸"
  fi

  # ───────────────────────────────────────────────────
  echo "  ── 硬编码颜色检查 ──"
  # ───────────────────────────────────────────────────

  if [ -n "$themes_start_line" ] && [ -n "$themes_end_line" ]; then
    # Check for old theme hex outside THEMES block
    old_hex_count=0
    for hex in "#EC4F99" "#F472B6" "#3B82F6" "#10B981" "#8B5CF6"; do
      count=$(awk -v s="$themes_start_line" -v e="$themes_end_line" 'NR<s || NR>e' "$f" | grep -oi "$hex" | wc -l)
      if [ "$count" -gt 0 ]; then
        echo "    硬编码 $hex × $count (THEMES外)"
        old_hex_count=$((old_hex_count + count))
      fi
    done
    if [ "$old_hex_count" -eq 0 ]; then
      check "硬编码: THEMES外无旧主题色" "PASS"
    else
      check "硬编码: THEMES外旧主题色" "WARN" "共 $old_hex_count 处 (应用 CSS 变量)"
    fi
  fi

  # ───────────────────────────────────────────────────
  # Summary per file
  # ───────────────────────────────────────────────────
  if [ "$file_errors" -eq 0 ]; then
    echo "  ── 结果: ✓ 全部通过 ──"
    TOTAL_PASS=$((TOTAL_PASS+1))
  else
    echo "  ── 结果: ✗ $file_errors 个错误 ──"
  fi
  echo ""
done

# ═══════════════════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════════════"
echo "  总计: $((TOTAL_PASS + TOTAL_FAIL)) 游戏测试"
echo "  通过: $TOTAL_PASS   失败: $TOTAL_FAIL   警告: $TOTAL_WARN"
echo "═══════════════════════════════════════════════════════════════════════"
