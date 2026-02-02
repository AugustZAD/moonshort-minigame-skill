import { _decorator, Component, Node, Prefab, instantiate, Label, Button } from 'cc';
import { GameManager } from '../scripts/core/GameManager';
import { DataStore } from '../scripts/core/DataStore';
import { MallItem, MallData, MallCategory } from '../scripts/types/api.types';

const { ccclass, property, menu } = _decorator;

/**
 * 商城组件
 * 用于显示商城商品并处理购买
 */
@ccclass('MallComponent')
@menu('Components/MallComponent')
export class MallComponent extends Component {
    @property({ type: Node, tooltip: '商品项的容器节点' })
    containerNode: Node | null = null;

    @property({ type: Prefab, tooltip: '商品项预制体（需包含 name、price、description 等节点）' })
    itemPrefab: Prefab | null = null;

    @property({ type: Label, tooltip: '显示用户宝石数量的 Label' })
    gemsLabel: Label | null = null;

    @property({ type: Node, tooltip: '加载中提示节点' })
    loadingNode: Node | null = null;

    @property({ type: Node, tooltip: '错误提示节点' })
    errorNode: Node | null = null;

    @property({ tooltip: '是否自动加载' })
    autoLoad: boolean = true;

    private dataStore: DataStore | null = null;
    private isLoading: boolean = false;
    private categories: MallCategory[] = [];
    private userGems: number = 0;
    private _unsubscribeMall: (() => void) | null = null;
    private _unsubscribeUser: (() => void) | null = null;

    onLoad() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('[MallComponent] GameManager 未初始化');
            return;
        }

        this.dataStore = gameManager.getDataStore();

        // 订阅商城数据更新
        this._unsubscribeMall = this.dataStore.subscribe<MallData>('mall', (data, isFromCache) => {
            if (!isFromCache && this.node && this.node.isValid) {
                this.categories = data.categories;
                this.userGems = data.userGems;
                this.updateGemsDisplay();
                this.renderCategories();
            }
        });

        // 订阅用户信息更新（金币变化）
        this._unsubscribeUser = this.dataStore.subscribe('user_info', (data: any, isFromCache) => {
            if (!isFromCache && this.node && this.node.isValid && typeof data.gems === 'number') {
                this.userGems = data.gems;
                this.updateGemsDisplay();
            }
        });

        if (this.autoLoad) {
            this.loadMall();
        }
    }

    /**
     * 加载商城数据
     */
    async loadMall() {
        if (this.isLoading || !this.dataStore) {
            return;
        }

        this.setLoadingState(true);
        this.hideErrorState();

        try {
            const data = await this.dataStore.getMallData();
            
            this.categories = data.categories;
            this.userGems = data.userGems;

            this.updateGemsDisplay();
            this.renderCategories();

        } catch (error) {
            console.error('[MallComponent] 加载失败:', error);
            this.showErrorState();
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * 更新宝石显示
     */
    private updateGemsDisplay() {
        if (this.gemsLabel) {
            this.gemsLabel.string = `${this.userGems}`;
        }
    }

    /**
     * 渲染商品分类
     */
    private renderCategories() {
        if (!this.containerNode || !this.itemPrefab) {
            console.error('[MallComponent] containerNode 或 itemPrefab 未配置');
            return;
        }

        // 清空容器
        this.containerNode.removeAllChildren();

        // 为每个分类创建商品列表
        for (const category of this.categories) {
            // 可以创建分类标题节点
            this.renderCategoryItems(category);
        }
    }

    /**
     * 渲染分类下的商品
     */
    private renderCategoryItems(category: MallCategory) {
        if (!this.containerNode || !this.itemPrefab) {
            return;
        }

        for (const item of category.items) {
            const itemNode = instantiate(this.itemPrefab);
            this.containerNode.addChild(itemNode);

            // 设置数据
            this.setItemData(itemNode, item);

            // 绑定购买按钮
            const buyButton = itemNode.getChildByName('BuyButton');
            if (buyButton) {
                const btn = buyButton.getComponent(Button);
                if (btn) {
                    buyButton.on(Button.EventType.CLICK, () => {
                        this.onBuyClick(item);
                    }, this);
                }
            }
        }
    }

    /**
     * 设置商品数据
     */
    private setItemData(itemNode: Node, item: MallItem) {
        // 商品名称
        const nameLabel = itemNode.getChildByName('Name')?.getComponent(Label);
        if (nameLabel) {
            nameLabel.string = item.name;
        }

        // 商品描述
        const descLabel = itemNode.getChildByName('Description')?.getComponent(Label);
        if (descLabel) {
            descLabel.string = item.description;
        }

        // 价格
        const priceLabel = itemNode.getChildByName('Price')?.getComponent(Label);
        if (priceLabel) {
            priceLabel.string = `${item.price}`;
        }

        // 稀有度（可选）
        const rarityLabel = itemNode.getChildByName('Rarity')?.getComponent(Label);
        if (rarityLabel) {
            const rarityText = this.getRarityText(item.rarity);
            rarityLabel.string = rarityText;
        }

        // 类型（可选）
        const typeLabel = itemNode.getChildByName('Type')?.getComponent(Label);
        if (typeLabel) {
            const typeText = this.getTypeText(item.type);
            typeLabel.string = typeText;
        }

        // 效果
        const effectLabel = itemNode.getChildByName('Effect')?.getComponent(Label);
        if (effectLabel) {
            effectLabel.string = item.effect;
        }
    }

    /**
     * 获取稀有度文本
     */
    private getRarityText(rarity: string): string {
        const rarityMap: Record<string, string> = {
            'common': '普通',
            'uncommon': '优秀',
            'rare': '稀有',
            'epic': '史诗',
            'legendary': '传说',
        };
        return rarityMap[rarity] || rarity;
    }

    /**
     * 获取类型文本
     */
    private getTypeText(type: string): string {
        const typeMap: Record<string, string> = {
            'consumable': '消耗品',
            'blindbox': '盲盒',
            'equipment': '装备',
        };
        return typeMap[type] || type;
    }

    /**
     * 购买按钮点击事件
     */
    private async onBuyClick(item: MallItem) {
        if (!this.dataStore) return;

        // 检查宝石是否足够
        if (this.userGems < item.price) {
            console.warn('[MallComponent] 宝石不足');
            // TODO: 显示提示
            return;
        }

        console.log('[MallComponent] 购买商品:', item.name);

        try {
            const gameManager = GameManager.getInstance();
            const apiService = gameManager.getAPI();
            const result = await apiService.post<{ success: boolean; message: string }>(
                '/apiv2/mall/purchase',
                { itemId: item.id, quantity: 1 }
            );
            console.log('[MallComponent] 购买成功:', result.message);
            
            // 刷新用户信息缓存（金币变化）
            this.dataStore.invalidateUserInfo();
            // 重新加载用户信息
            this.dataStore.getUserInfo();

            // 触发自定义事件
            this.node.emit('item-purchased', item);

        } catch (error: any) {
            console.error('[MallComponent] 购买失败:', error);
            // TODO: 显示错误提示
        }
    }

    /**
     * 刷新商城
     */
    refresh() {
        this.loadMall();
    }

    /**
     * 设置加载状态
     */
    private setLoadingState(loading: boolean) {
        this.isLoading = loading;
        if (this.loadingNode) {
            this.loadingNode.active = loading;
        }
    }

    /**
     * 隐藏错误状态
     */
    private hideErrorState() {
        if (this.errorNode) {
            this.errorNode.active = false;
        }
    }

    /**
     * 显示错误状态
     */
    private showErrorState() {
        if (this.errorNode) {
            this.errorNode.active = true;
        }
    }

    /**
     * 获取当前宝石数量
     */
    getUserGems(): number {
        return this.userGems;
    }

    onDestroy() {
        this._unsubscribeMall?.();
        this._unsubscribeUser?.();
        if (this.containerNode) {
            this.containerNode.removeAllChildren();
        }
    }
}
