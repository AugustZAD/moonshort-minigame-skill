/**
 * 游戏工具函数
 * 复制自后端 game-utils.ts
 */

export type Attribute = "combat" | "intelligence" | "charisma" | "will";

export type CheckDifficulty = "简单" | "普通" | "挑战" | "困难" | "地狱";

export const DC_VALUES: Record<CheckDifficulty, number> = {
  简单: 8,
  普通: 12,
  挑战: 16,
  困难: 20,
  地狱: 24,
};

/**
 * 计算属性调整值
 */
export function calculateAttributeModifier(attributeValue: number): number {
  return Math.floor((attributeValue - 10) / 2);
}

/**
 * 投骰子 (d20)
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * 执行检定
 * @param attributeValue 属性值
 * @param tempModifier 临时修正值
 * @param dc 难度值
 * @returns 检定结果
 */
export function performCheck(
  attributeValue: number,
  tempModifier: number,
  dc: number
): { success: boolean; roll: number; modifier: number; total: number } {
  const roll = rollDice();
  const attributeModifier = calculateAttributeModifier(attributeValue);
  const total = roll + attributeModifier + tempModifier;

  return {
    success: total >= dc,
    roll,
    modifier: attributeModifier + tempModifier,
    total,
  };
}

/**
 * 获取临时修正值总和
 * @param tempModifiers 临时修正值数组
 * @param attr 属性类型
 * @returns 总修正值
 */
export function getTempModifierValue(
  tempModifiers: Array<{ attribute: Attribute; value: number }>,
  attr: Attribute
): number {
  return tempModifiers
    .filter((m) => m.attribute === attr)
    .reduce((sum, m) => sum + m.value, 0);
}
