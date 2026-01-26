/**
 * A 卡前端配置
 * 包含所有展示相关的内容：名称、图标、效果描述
 * 后端只负责逻辑计算，前端负责所有展示内容
 */

export interface ACardDisplayConfig {
    id: string;              // 卡片 ID，用于匹配后端
    name: string;            // 卡片名称
    shortEffect: string;     // 简要效果，如 "Recover HP & MP"
    description: string;     // 详细描述
    iconIndex: number;       // 图标索引（对应 ACardPanel.cardIcons 数组）
}

/**
 * A 卡展示配置表
 * 9 张卡片的完整配置
 */
export const ACARD_DISPLAY_CONFIG: ACardDisplayConfig[] = [
    // ========== 自我提升 ==========
    {
        id: 'meditation',
        name: '冥想修炼',
        shortEffect: '提升属性 & 获得经验',
        description: '获得 AvgAExp 经验\n战斗或智力检定+1，持续1回合',
        iconIndex: 0,
    },
    {
        id: 'enlightenment',
        name: '天人感悟',
        shortEffect: '提升智力 & 获得经验',
        description: '获得 AvgAExp * 0.5 经验\n智力检定+2，持续1回合',
        iconIndex: 1,
    },
    {
        id: 'body-refining',
        name: '锤炼己身',
        shortEffect: '大量经验',
        description: '获得 AvgAExp * 1.5 经验',
        iconIndex: 2,
    },
    {
        id: 'rest',
        name: '休整',
        shortEffect: 'Recover HP & MP',
        description: '恢复HP = 30 + (等级 - 1) × 1\n恢复MP = 15 + (等级 - 1) × 1',
        iconIndex: 3,
    },

    // ========== 资源筹备 ==========
    {
        id: 'commission',
        name: '委托',
        shortEffect: '获得灵石 & 经验',
        description: '10% 几率 -20% 当前HP\n获得 AvgAExp 经验\n灵石 + 50',
        iconIndex: 4,
    },
    {
        id: 'explore',
        name: '探秘',
        shortEffect: '高风险高回报',
        description: '20% 几率 -50% 当前HP\n获得 AvgAExp 经验\n50%获得 灵石 + 150',
        iconIndex: 5,
    },

    // ========== 社交情报 ==========
    {
        id: 'gather-intel',
        name: '打听情报',
        shortEffect: '获得情报优势',
        description: '获得 AvgAExp * 0.8 经验\n下个B卡可直接成功1次非战斗检定',
        iconIndex: 6,
    },
    {
        id: 'social',
        name: '社交应酬',
        shortEffect: '提升魅力 & 获得经验',
        description: '获得 AvgAExp 经验\n魅力检定+1，持续 2 回合',
        iconIndex: 7,
    },
    {
        id: 'key-person',
        name: '关键人物',
        shortEffect: '角色对话 & 魅力提升',
        description: '和角色聊天\n获得 AvgAExp 经验\n魅力检定+2，持续 1 回合',
        iconIndex: 8,
    },
];

/**
 * 根据 ID 获取 A 卡展示配置
 */
export function getACardDisplayConfig(id: string): ACardDisplayConfig | null {
    return ACARD_DISPLAY_CONFIG.find(config => config.id === id) || null;
}

/**
 * 获取所有 A 卡配置的 Map（用于快速查找）
 */
export function getACardDisplayConfigMap(): Map<string, ACardDisplayConfig> {
    const map = new Map<string, ACardDisplayConfig>();
    ACARD_DISPLAY_CONFIG.forEach(config => {
        map.set(config.id, config);
    });
    return map;
}
