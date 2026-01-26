/**
 * 游戏系统类型定义
 */

/**
 * 游戏阶段
 */
export enum GamePhase {
    A_CARD = 'A_CARD',  // 准备阶段，选择 A 卡
    B_CARD = 'B_CARD',  // 剧情阶段，处理 B 卡
    TRANSITION = 'TRANSITION', // 过渡叙事
}

/**
 * 临时修改器（Buff/Debuff）
 */
export interface TempModifier {
    attribute: 'combat' | 'intelligence' | 'charisma' | 'will';
    value: number;
    duration: number; // 剩余回合数
    source: string;   // 来源描述
}

/**
 * 玩家存档（完整）
 */
export interface PlayerSave {
    id: number;
    novelId: string;
    novelTitle?: string;
    userId: string;
    
    // 游戏阶段
    gamePhase: GamePhase;
    
    // 扮演角色信息
    roleplayCharacterName?: string | null;
    roleplayCharacter?: string | null;
    roleplayCharacterAvatar?: string | null;
    
    // 四维属性
    combat: number;
    intelligence: number;
    charisma: number;
    will: number;
    
    // 等级经验
    level: number;
    experience: number;
    expForLevelUp: number;
    
    // HP/MP
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    
    // 货币
    spiritStone: number;
    
    // 进度
    currentNodeIndex: number;
    prepTurnsRemaining: number;
    lastBCardResult?: string | null;
    
    // 道具/装备/buff
    inventory: any[];
    equippedItems: Record<string, any>;
    pastInfluences: any[];
    tempModifiers: TempModifier[];
    
    saveName?: string | null;
    updatedAt: string;
    createdAt?: string;
}

/**
 * 存档列表项（简化）
 */
export interface SaveListItem {
    id: number;
    novelId: string;
    novelTitle?: string;
    level: number;
    currentNodeIndex: number;
    saveName?: string | null;
    updatedAt: string;
}

/**
 * B 卡原始数据
 */
export interface BCardData {
    nodeIndex: number;
    nodeType: 'NORMAL' | 'HIGHLIGHT';
    nodeName: string;
    description: string;
    rawContent: string;
    introVideoUrl?: string | null;
    endingVideoUrl?: string | null;
}

/**
 * B 卡解析后的抉择
 */
export interface ParsedDecision {
    title: string;
    options: ParsedOption[];
}

/**
 * 解析后的选项
 */
export interface ParsedOption {
    text: string;
    checkAttr?: 'intelligence' | 'charisma' | 'combat' | 'will';
    checkDC?: number;
    hpChange?: number;
    mpChange?: number;
}

/**
 * 叙事段落
 */
export interface NarrativeSegment {
    type: 'speaking' | 'thinking' | 'narration';
    speaker?: string;  // speaking 时的说话者名字
    content: string;   // 内容文本
}

/**
 * B 卡富化数据（AI 解析后）
 */
export interface EnrichedBCard {
    nodeIndex: number;
    nodeType: 'daily' | 'highlight';
    nodeName: string;
    decisions: ParsedDecision[];
    firstNarrative?: NarrativeSegment[];  // 结构化叙事数组
    introVideoUrl?: string | null;
    endingVideoUrl?: string | null;
    optionVideos?: Array<{ decisionIndex: number; optionIndex: number; videoUrl: string }>;
    decisionSceneImages?: Array<{ decisionIndex: number; sceneImageUrl: string }>;  // 每个抉择的场景空镜图
}

/**
 * 检定结果
 */
export interface CheckResult {
    optionIndex: number;
    attribute?: string;
    roll: number;
    dc: number;
    success: boolean;
}

/**
 * B 卡结算结果
 */
export interface BCardEvaluationResult {
    resultType: 'perfect' | 'normal' | 'failure';
    narrative: string;
    influences: any[];
    rewards: {
        experience: number;
        spiritStone: number;
        items: any[];
    };
    playerUpdates: {
        experience: number;
        level: number;
        levelUp: boolean;
        maxHp: number;
        maxMp: number;
    };
}

/**
 * A 卡定义（后端返回）
 * 注：name/description 字段可选，前端优先使用本地配置
 */
export interface ACard {
    id: string;
    name?: string;
    path: '自我提升' | '资源筹备' | '社交情报';
    description?: string;
    stoneCost: number;
    canAfford: boolean;
}

/**
 * A 卡池
 */
export interface ACardPool {
    cards: ACard[];
    grouped: {
        自我提升: ACard[];
        资源筹备: ACard[];
        社交情报: ACard[];
    };
    playerLevel: number;
    playerSpiritStone: number;
    currentTurn: number;
    totalTurns: number;
    previousNodeSceneImage: string | null;
    nextNodeSceneImage: string | null;
}

/**
 * A 卡选择结果
 */
export interface ACardSelectResult {
    id: number;
    cardSelected: {
        id: string;
        name: string;
        path: string;
    };
    effects: {
        experience: number;
        hp: number;
        mp: number;
        spiritStone: number;
        level: number;
        levelUp: boolean;
    };
    prepTurnsRemaining: number;
    tempModifiers: TempModifier[];
}

/**
 * 过渡叙事
 */
export interface TransitionNarrative {
    narrative: string;
    nextNodeIndex: number;
    nextNodeType: 'NORMAL' | 'HIGHLIGHT' | null;
}

/**
 * 创建存档请求
 */
export interface CreateSaveRequest {
    novelId: string;
    combat: number;
    intelligence: number;
    charisma: number;
    will: number;
}
