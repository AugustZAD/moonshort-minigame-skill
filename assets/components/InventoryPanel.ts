import { _decorator, Component, Node, Prefab, instantiate, Layout, Button, Sprite, SpriteFrame, Color } from 'cc';
import { ItemCard, ItemData, ItemCategory } from './ItemCard';
import { GameManager } from '../scripts/core/GameManager';
import { APIService } from '../scripts/core/APIService';

const { ccclass, property, menu } = _decorator;

/**
 * 类别按钮配置
 */
@ccclass('CategoryButtonConfig')
export class CategoryButtonConfig {
    @property({ type: Node, tooltip: '按钮节点' })
    buttonNode: Node | null = null;
    
    @property({ tooltip: '类别ID' })
    categoryId: string = '';
    
    @property({ type: Sprite, tooltip: '图标 Sprite 组件' })
    iconSprite: Sprite | null = null;
    
    @property({ type: SpriteFrame, tooltip: '激活状态图标' })
    activeIcon: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame, tooltip: '普通状态图标' })
    normalIcon: SpriteFrame | null = null;
}

/**
 * 道具面板组件
 * 负责显示玩家背包、管理道具列表、按类别筛选
 * 
 * 节点结构：
 * InventoryPanel
 * ├── CategoryButtons (Node) - 类别按钮容器
 * │   ├── AllButton - 全部按钮
 * │   ├── EquipmentButton - 装备类按钮
 * │   ├── BuffButton - 增益类按钮
 * │   ├── ConsumableButton - 道具类按钮
 * │   └── DiceButton - 骰子类按钮
 * └── ItemsContainer (Node + Layout) - 道具列表容器
 */
@ccclass('InventoryPanel')
@menu('Components/InventoryPanel')
export class InventoryPanel extends Component {
    // ========== 节点引用 ==========
    @property({ type: Node, tooltip: '道具列表容器（带 Layout 组件）' })
    itemsContainer: Node | null = null;
    
    @property({ type: Prefab, tooltip: 'ItemCard 预制体' })
    itemCardPrefab: Prefab | null = null;
    
    // ========== 类别按钮配置 ==========
    @property({ type: [CategoryButtonConfig], tooltip: '类别按钮配置（5个：all/equipment/buff/consumable/dice）' })
    categoryButtons: CategoryButtonConfig[] = [
        Object.assign(new CategoryButtonConfig(), { categoryId: 'all' }),
        Object.assign(new CategoryButtonConfig(), { categoryId: 'equipment' }),
        Object.assign(new CategoryButtonConfig(), { categoryId: 'buff' }),
        Object.assign(new CategoryButtonConfig(), { categoryId: 'consumable' }),
        Object.assign(new CategoryButtonConfig(), { categoryId: 'dice' }),
    ];
    
    @property({ type: Node, tooltip: '返回按钮节点' })
    backButtonNode: Node | null = null;
    
    
    // ========== 私有属性 ==========
    private apiService: APIService | null = null;
    private currentCategory: string = 'all';  // 当前选中的类别
    private allItems: ItemData[] = [];  // 所有道具
    private playerId: number = 0;  // 玩家ID
    private isLoaded: boolean = false;  // onLoad 是否完成
    
    onLoad() {
        // 初始化 API
        const gameManager = GameManager.getInstance();
        this.apiService = gameManager.getAPI();
        
        // 绑定类别按钮事件
        this.categoryButtons.forEach((config) => {
            if (config.buttonNode) {
                let button = config.buttonNode.getComponent(Button);
                
                // 如果没有 Button 组件，自动添加
                if (!button) {
                    button = config.buttonNode.addComponent(Button);
                }
                
                // 绑定点击事件
                config.buttonNode.on('click', () => {
                    this.onCategoryButtonClick(config.categoryId);
                }, this);
            }
        });
        
        // 绑定返回按钮事件
        if (this.backButtonNode) {
            let button = this.backButtonNode.getComponent(Button);
            if (!button) {
                button = this.backButtonNode.addComponent(Button);
            }
            this.backButtonNode.on('click', this.onBackButtonClick, this);
        }
        
        // 初始化按钮状态（默认选中 'all'）
        this.updateButtonStates();
        
        this.isLoaded = true;
    }
    
    onDestroy() {
        // 清理事件（检查节点是否有效）
        this.categoryButtons.forEach(config => {
            if (config.buttonNode && config.buttonNode.isValid) {
                config.buttonNode.off('click', () => this.onCategoryButtonClick(config.categoryId), this);
            }
        });
        
        if (this.backButtonNode && this.backButtonNode.isValid) {
            this.backButtonNode.off('click', this.onBackButtonClick, this);
        }
        
        // 清空容器（检查有效性）
        if (this.itemsContainer && this.itemsContainer.isValid) {
            this.itemsContainer.removeAllChildren();
        }
        
        // 清空引用
        this.itemsContainer = null;
        this.itemCardPrefab = null;
        this.backButtonNode = null;
        this.apiService = null;
        this.allItems = [];
    }
    
    /**
     * 设置存档ID并加载道具
     */
    async setPlayer(playerId: number) {
        this.playerId = playerId;
        
        // 等待 onLoad 完成
        if (!this.isLoaded) {
            let waitCount = 0;
            while (!this.isLoaded && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            
            if (!this.isLoaded) {
                console.error('[InventoryPanel] 等待 onLoad 超时！');
                return;
            }
        }
        
        await this.loadItems();
    }
    
    /**
     * 从服务器加载道具
     */
    async loadItems(category?: string) {
        if (!this.apiService || !this.playerId) {
            console.warn('[InventoryPanel] API 或玩家ID未初始化');
            return;
        }
        
        try {
            const params: Record<string, string> = {};
            if (category && category !== 'all') {
                params.category = category;
            }
            
            const url = `/apiv2/saves/${this.playerId}/inventory`;
            const response = await this.apiService.get<ItemData[]>(url, params);
            
            // 统计类别分布
            const categoryCount: Record<string, number> = {};
            response.forEach(item => {
                const cat = item.category || 'unknown';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
            
            console.log('[InventoryPanel] 加载完成:', response.length, '个道具');
            console.log('[InventoryPanel] 类别分布:', categoryCount);
            console.log('[InventoryPanel] 前3个道具:', response.slice(0, 3).map(i => ({ category: i.category, rarity: i.rarity })));
            
            this.allItems = response;
            this.renderItems(response);
        } catch (error) {
            console.error('[InventoryPanel] 加载道具失败:', error);
        }
    }
    
    /**
     * 渲染道具列表
     */
    private renderItems(items: ItemData[]) {
        if (!this.itemsContainer || !this.itemCardPrefab) {
            console.warn('[InventoryPanel] 容器或预制体未配置');
            return;
        }
        
        this.itemsContainer.removeAllChildren();
        
        if (items.length === 0) {
            return;
        }
        
        // 道具去重并计算数量
        const itemMap = new Map<string, ItemData>();
        items.forEach(item => {
            const existing = itemMap.get(item.id);
            if (existing) {
                existing.count = (existing.count || 1) + 1;
            } else {
                itemMap.set(item.id, { ...item, count: 1 });
            }
        });
        
        // 创建道具卡片
        itemMap.forEach((item) => {
            const cardNode = instantiate(this.itemCardPrefab!);
            const itemCard = cardNode.getComponent(ItemCard);
            
            if (itemCard) {
                itemCard.setItemData(item);
                itemCard.setClickCallback((clickedItem) => {
                    this.onItemClick(clickedItem);
                });
            }
            
            this.itemsContainer!.addChild(cardNode);
        });
        
        // 刷新布局
        const layout = this.itemsContainer.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }
    }
    
    /**
     * 类别按钮点击事件
     */
    private async onCategoryButtonClick(categoryId: string) {
        console.log(`[InventoryPanel] 切换类别: ${this.currentCategory} -> ${categoryId}`);
        
        this.currentCategory = categoryId;
        this.updateButtonStates();
        
        const filterCategory = categoryId === 'all' ? undefined : categoryId;
        await this.loadItems(filterCategory);
    }
    
    /**
     * 更新按钮状态（切换 active/normal 图标）
     */
    private updateButtonStates() {
        this.categoryButtons.forEach(config => {
            if (!config.iconSprite) return;
            
            const isActive = config.categoryId === this.currentCategory;
            
            if (isActive && config.activeIcon) {
                config.iconSprite.spriteFrame = config.activeIcon;
            } else if (!isActive && config.normalIcon) {
                config.iconSprite.spriteFrame = config.normalIcon;
            }
        });
    }
    
    /**
     * 道具点击事件
     */
    private onItemClick(item: ItemData) {
        console.log('[InventoryPanel] 道具点击:', item.name || item.revealedName || item.category);
        this.node.emit('item-selected', item);
    }
    
    /**
     * 返回按钮点击事件
     */
    private onBackButtonClick() {
        console.log('[InventoryPanel] 点击返回按钮');
        this.node.emit('inventory-close');
    }
    
    
    /**
     * 刷新当前类别的道具列表
     */
    async refresh() {
        await this.loadItems(this.currentCategory === 'all' ? undefined : this.currentCategory);
    }
    
    /**
     * 获取当前选中的类别
     */
    getCurrentCategory(): string {
        return this.currentCategory;
    }
}
