import { _decorator, Component, Label, Sprite, SpriteFrame, Node, Button, Color } from 'cc';

const { ccclass, property, menu } = _decorator;

/**
 * 道具稀有度
 */
export enum ItemRarity {
    COMMON = 'common',      // 普通
    FINE = 'fine',          // 精良
    EPIC = 'epic',          // 史诗
    LEGENDARY = 'legendary' // 传说
}

/**
 * 装备槽位
 */
export enum EquipmentSlot {
    WEAPON = 'weapon',       // 武器
    HEADPIECE = 'headpiece', // 头饰
    CLOTHING = 'clothing',   // 服饰
    ACCESSORY = 'accessory'  // 手饰
}

/**
 * 道具大类别（用于图标分类）
 */
export type ItemCategory = 'equipment' | 'buff' | 'consumable' | 'dice';

/**
 * 道具数据接口（从后端接收）
 */
export interface ItemData {
    id: string;
    type: 'equipment' | 'consumable';
    name: string;
    rarity: ItemRarity;
    category: ItemCategory;  // 后端返回的大类别
    
    // 装备特有
    slot?: EquipmentSlot;
    attribute?: 'combat' | 'intelligence' | 'charisma' | 'will';
    bonus?: number;
    
    // 消耗品特有
    effectType?: string;
    effect?: any;
    
    // 盲盒相关
    isRevealed?: boolean;
    revealedName?: string;
    
    // 持有数量（前端计算）
    count?: number;
}

/**
 * 稀有度背景配置
 */
@ccclass('ItemRarityBackgroundConfig')
export class ItemRarityBackgroundConfig {
    @property({ tooltip: '稀有度' })
    rarity: string = '';
    
    @property({ type: SpriteFrame, tooltip: '背景图' })
    backgroundFrame: SpriteFrame | null = null;
}

/**
 * 道具图标配置（类别+稀有度组合）
 */
@ccclass('ItemIconConfig')
export class ItemIconConfig {
    @property({ tooltip: '配置ID（weapon/headpiece/clothing/accessory/hp_restore...）' })
    configId: string = '';
    
    @property({ type: SpriteFrame, tooltip: '图标1（主图标）' })
    iconFrame1: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame, tooltip: '图标2（副图标）' })
    iconFrame2: SpriteFrame | null = null;
}

/**
 * 道具卡片组件
 * 用于显示单个装备或消耗品的信息
 * 
 * 节点结构：
 * ItemCard
 * ├── Background (Sprite) - 背景（根据稀有度变色）
 * ├── CategoryIcon (Sprite) - 类别图标（底层）
 * ├── ItemIcon (Sprite) - 道具图标（上层）
 * ├── Name (Label) - 道具名称
 * └── CountLabel (Label) - 数量显示（x{num}，如 x2、x3）
 */
@ccclass('ItemCard')
@menu('Components/ItemCard')
export class ItemCard extends Component {
    // ========== 节点引用 ==========
    @property({ type: Sprite, tooltip: '背景精灵（根据稀有度变色）' })
    backgroundSprite: Sprite | null = null;
    
    @property({ type: Sprite, tooltip: '类别图标（底层，iconFrame1）' })
    categoryIconSprite: Sprite | null = null;
    
    @property({ type: Sprite, tooltip: '道具图标（上层，iconFrame2）' })
    itemIconSprite: Sprite | null = null;
    
    @property({ type: Label, tooltip: '道具名称' })
    nameLabel: Label | null = null;
    
    @property({ type: Label, tooltip: '数量显示（x{num}，如 x2、x3）' })
    countLabel: Label | null = null;
    
    @property({ type: Button, tooltip: '卡片按钮（可选）' })
    itemButton: Button | null = null;
    
    // ========== 图标资源配置 ==========
    @property({ type: [ItemIconConfig], tooltip: '道具大类别图标配置（4个：equipment/buff/consumable/dice）' })
    itemIcons: ItemIconConfig[] = [
        Object.assign(new ItemIconConfig(), { configId: 'equipment' }),    // 装备类
        Object.assign(new ItemIconConfig(), { configId: 'buff' }),         // 增益类
        Object.assign(new ItemIconConfig(), { configId: 'consumable' }),   // 道具类
        Object.assign(new ItemIconConfig(), { configId: 'dice' }),         // 骰子类
    ];
    
    @property({ type: [ItemRarityBackgroundConfig], tooltip: '稀有度背景配置（4个：common/fine/epic/legendary）' })
    rarityBackgrounds: ItemRarityBackgroundConfig[] = [
        Object.assign(new ItemRarityBackgroundConfig(), { rarity: 'common' }),
        Object.assign(new ItemRarityBackgroundConfig(), { rarity: 'fine' }),
        Object.assign(new ItemRarityBackgroundConfig(), { rarity: 'epic' }),
        Object.assign(new ItemRarityBackgroundConfig(), { rarity: 'legendary' }),
    ];
    
    // ========== 私有属性 ==========
    private itemData: ItemData | null = null;
    private itemIconMap1: Map<string, SpriteFrame> = new Map();
    private itemIconMap2: Map<string, SpriteFrame> = new Map();
    
    // ========== 稀有度文本配置 ==========
    private readonly RARITY_LABELS: Record<string, string> = {
        'common': '普通',
        'fine': '精良',
        'epic': '史诗',
        'legendary': '传说',
    };
    
    // ========== 类别文本配置 ==========
    private readonly SLOT_LABELS: Record<string, string> = {
        'weapon': '武器',
        'headpiece': '头饰',
        'clothing': '服饰',
        'accessory': '手饰',
    };
    
    private readonly ATTRIBUTE_LABELS: Record<string, string> = {
        'combat': '战斗',
        'intelligence': '智力',
        'charisma': '魅力',
        'will': '意志',
    };
    
    onLoad() {
        // 绑定点击事件
        if (this.itemButton) {
            this.itemButton.node.on('click', this.onItemClick, this);
        }
    }
    
    onDestroy() {
        // 清理事件（检查节点是否有效）
        if (this.itemButton && this.itemButton.node && this.itemButton.node.isValid) {
            this.itemButton.node.off('click', this.onItemClick, this);
        }
        
        // 清空引用
        this.itemData = null;
        this.itemButton = null;
        this.backgroundSprite = null;
        this.categoryIconSprite = null;
        this.itemIconSprite = null;
        this.nameLabel = null;
        this.countLabel = null;
        
        // 清空映射表
        this.itemIconMap1.clear();
        this.itemIconMap2.clear();
        
        // 清空回调
        if (this.node && this.node.isValid) {
            delete this.node['__itemClickCallback'];
        }
    }
    
    /**
     * 初始化图标映射表（延迟初始化）
     */
    private initIconMaps() {
        if (this.itemIconMap1.size > 0 || this.itemIconMap2.size > 0) {
            return; // 已初始化
        }
        
        this.itemIcons.forEach((config) => {
            if (config.configId) {
                if (config.iconFrame1) {
                    this.itemIconMap1.set(config.configId, config.iconFrame1);
                }
                if (config.iconFrame2) {
                    this.itemIconMap2.set(config.configId, config.iconFrame2);
                }
            }
        });
        
        // 只在首次初始化时检查
        if (this.itemIconMap1.size === 0 || this.itemIconMap2.size === 0) {
            console.warn('[ItemCard] 图标配置不完整:', {
                类别图标: this.itemIconMap1.size,
                道具图标: this.itemIconMap2.size,
                itemIcons数组长度: this.itemIcons.length
            });
        }
    }
    
    /**
     * 设置道具数据并更新显示
     */
    setItemData(data: ItemData) {
        this.initIconMaps(); // 延迟初始化
        this.itemData = data;
        this.updateDisplay();
    }
    
    /**
     * 更新显示
     */
    private updateDisplay() {
        if (!this.itemData) return;
        
        const item = this.itemData;
        
        // 1. 更新背景（根据稀有度）
        this.updateBackground(item.rarity);
        
        // 2. 更新图标（根据类别）
        this.updateIcon(item);
        
        // 3. 更新名称
        this.updateName(item);
        
        // 4. 更新数量
        this.updateCount(item.count || 1);
    }
    
    /**
     * 更新背景（根据稀有度设置不同背景图）
     */
    private updateBackground(rarity: ItemRarity) {
        if (!this.backgroundSprite) return;
        
        // 从配置数组中查找对应稀有度的背景图
        const config = this.rarityBackgrounds.find(bg => bg.rarity === rarity);
        if (config && config.backgroundFrame) {
            this.backgroundSprite.spriteFrame = config.backgroundFrame;
        }
    }
    
    /**
     * 更新图标（根据后端返回的 category 获取）
     */
    private updateIcon(item: ItemData) {
        // 直接使用后端返回的 category
        const iconKey = item.category;
        
        // 设置类别图标（iconFrame1）
        if (this.categoryIconSprite) {
            const categoryIcon = this.itemIconMap1.get(iconKey);
            if (categoryIcon) {
                this.categoryIconSprite.spriteFrame = categoryIcon;
            } else {
                console.warn(`[ItemCard] ✗ 未找到类别图标: ${iconKey}, 可用: [${Array.from(this.itemIconMap1.keys()).join(', ')}]`);
            }
        }
        
        // 设置道具图标（iconFrame2）
        if (this.itemIconSprite) {
            const itemIcon = this.itemIconMap2.get(iconKey);
            if (itemIcon) {
                this.itemIconSprite.spriteFrame = itemIcon;
            } else {
                console.warn(`[ItemCard] ✗ 未找到道具图标: ${iconKey}, 可用: [${Array.from(this.itemIconMap2.keys()).join(', ')}]`);
            }
        }
    }
    
    /**
     * 更新名称
     */
    private updateName(item: ItemData) {
        if (!this.nameLabel) return;
        
        // 如果未揭示，显示盲盒名称
        if (!item.isRevealed) {
            const rarityLabel = this.RARITY_LABELS[item.rarity] || item.rarity;
            const typeLabel = item.type === 'equipment' ? '装备' : '消耗品';
            this.nameLabel.string = `🎁 ${rarityLabel}${typeLabel}盲盒`;
        } else {
            // 已揭示，显示真实名称
            // 如果后端有返回 revealedName，优先使用
            // 否则如果有 name，使用 name
            // 如果都没有，生成默认名称（类别+稀有度）
            if (item.revealedName) {
                this.nameLabel.string = item.revealedName;
            } else if (item.name) {
                this.nameLabel.string = item.name;
            } else {
                this.nameLabel.string = this.generateDefaultName(item);
            }
        }
    }
    
    /**
     * 生成默认名称（当后端没有返回名称时）
     */
    private generateDefaultName(item: ItemData): string {
        const rarityLabel = this.RARITY_LABELS[item.rarity] || '';
        
        if (item.type === 'equipment' && item.slot) {
            const slotLabel = this.SLOT_LABELS[item.slot] || item.slot;
            return `${rarityLabel}${slotLabel}`;
        } else if (item.type === 'consumable') {
            return `${rarityLabel}消耗品`;
        }
        
        return '未知道具';
    }
    
    /**
     * 更新数量
     */
    private updateCount(count: number) {
        if (!this.countLabel) return;
        
        if (count > 1) {
            this.countLabel.node.active = true;
            this.countLabel.string = `x${count}`;
        } else {
            this.countLabel.node.active = false;
        }
    }
    
    /**
     * 获取道具数据
     */
    getItemData(): ItemData | null {
        return this.itemData;
    }
    
    /**
     * 设置点击回调
     */
    setClickCallback(callback: (item: ItemData) => void) {
        this.node['__itemClickCallback'] = callback;
    }
    
    /**
     * 卡片点击处理
     */
    public onItemClick() {
        const callback = this.node['__itemClickCallback'];
        if (callback && this.itemData) {
            callback(this.itemData);
        }
    }
    
    /**
     * 设置按钮可用性
     */
    setInteractable(interactable: boolean) {
        if (this.itemButton) {
            this.itemButton.interactable = interactable;
        }
    }
}
