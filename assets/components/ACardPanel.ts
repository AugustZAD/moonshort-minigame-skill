import { _decorator, Component, Sprite, Node, Prefab, instantiate, SpriteFrame, assetManager, ImageAsset, Texture2D } from 'cc';
import { ACardPool, ACard } from '../scripts/types/game.types';
import { ACardItem } from './ACardItem';
import { getACardDisplayConfig } from '../scripts/config/ACardConfig';

const { ccclass, property, menu } = _decorator;

/**
 * A 卡图标配置项
 */
@ccclass('ACardIconConfig')
export class ACardIconConfig {
    @property({ tooltip: '卡片 ID' })
    cardId: string = '';

    @property({ type: SpriteFrame, tooltip: '卡片图标' })
    icon: SpriteFrame | null = null;
}

/**
 * A 卡面板组件
 * 显示 A 卡池、场景图、轮次信息
 * 
 * 节点结构：
 * ACardPanel
 * ├── SceneImage (Sprite) - 场景空镜图
 * ├── CardsContainer (Node) - 卡片容器（Layout）
 * └── TurnLabel (Label) - 轮次显示（可选）
 */
@ccclass('ACardPanel')
@menu('Components/ACardPanel')
export class ACardPanel extends Component {
    @property({ type: Node, tooltip: '卡片容器' })
    cardsContainer: Node | null = null;

    @property({ type: Prefab, tooltip: 'A 卡 Item 预制体' })
    cardItemPrefab: Prefab | null = null;

    @property({ type: [ACardIconConfig], tooltip: 'A 卡图标配置（配置 9 张卡的 ID 和图标）' })
    cardIconConfigs: ACardIconConfig[] = [];

    // 图标查找 Map（缓存）
    private iconMap: Map<string, SpriteFrame> = new Map();

    private currentPool: ACardPool | null = null;
    private cardClickCallback: ((card: ACard) => void) | null = null;
    private gameController: any = null;  // GameSceneController 引用

    onLoad() {
        // 获取 GameSceneController
        this.gameController = this.node.parent?.getComponent('GameSceneController');
        if (!this.gameController) {
            console.error('[ACardPanel] 未找到 GameSceneController');
        }
        
        // 初始化图标 Map
        this.initIconMap();
    }

    /**
     * 初始化图标 Map
     */
    private initIconMap() {
        this.iconMap.clear();
        this.cardIconConfigs.forEach(config => {
            if (config.cardId && config.icon) {
                this.iconMap.set(config.cardId, config.icon);
            }
        });
        console.log('[ACardPanel] 图标配置加载完成，共', this.iconMap.size, '个卡片');
    }

    /**
     * 设置 A 卡池数据
     */
    async setACardPool(pool: ACardPool) {
        console.log('[ACardPanel] 接收到 A 卡池数据:', {
            currentTurn: pool.currentTurn,
            totalTurns: pool.totalTurns,
            previousNodeSceneImage: pool.previousNodeSceneImage,
            nextNodeSceneImage: pool.nextNodeSceneImage,
            cardsCount: pool.cards.length,
        });
        
        this.currentPool = pool;

        // 更新场景图
        await this.updateSceneImage(pool);

        // 更新卡片列表
        this.updateCardsList(pool.cards);
    }

    /**
     * 更新场景图
     * 根据轮次切换显示前一个节点或下一个节点的场景图
     */
    private async updateSceneImage(pool: ACardPool) {
        // 计算应该显示哪个场景图
        let sceneImageUrl: string | null = null;
        
        if (pool.currentTurn <= pool.totalTurns / 2) {
            // 前一半轮次：显示上一个节点的场景图
            sceneImageUrl = pool.previousNodeSceneImage;
            // 如果不存在，使用下一个节点的
            if (!sceneImageUrl) {
                sceneImageUrl = pool.nextNodeSceneImage;
            }
        } else {
            // 后一半轮次：显示下一个节点的场景图
            sceneImageUrl = pool.nextNodeSceneImage;
            // 如果不存在，使用上一个节点的
            if (!sceneImageUrl) {
                sceneImageUrl = pool.previousNodeSceneImage;
            }
        }

        // 加载场景图
        if (sceneImageUrl) {
            await this.loadSceneImage(sceneImageUrl);
        } else {
            console.warn('[ACardPanel] 没有可用的场景图，当前轮次:', pool.currentTurn, '总轮次:', pool.totalTurns);
        }
    }

    /**
     * 加载远程场景图（使用 GameSceneController 的统一渲染）
     */
    private async loadSceneImage(url: string): Promise<void> {
        if (!this.gameController) {
            console.error('[ACardPanel] GameSceneController 不存在');
            return;
        }
        
        try {
            // 使用 GameSceneController 的统一渲染（默认无蒙版）
            await this.gameController.renderImage(url);
            console.log('[ACardPanel] 场景图加载成功:', url);
        } catch (error) {
            console.error('[ACardPanel] 场景图加载失败:', error);
            throw error;
        }
    }

    /**
     * 更新卡片列表
     */
    private updateCardsList(cards: ACard[]) {
        if (!this.cardsContainer || !this.cardItemPrefab) {
            console.warn('[ACardPanel] 卡片容器或预制体未配置');
            return;
        }

        // 清空容器
        this.cardsContainer.removeAllChildren();

        // 创建卡片
        cards.forEach((card) => {
            const cardNode = instantiate(this.cardItemPrefab!);
            const cardItem = cardNode.getComponent(ACardItem);

            if (cardItem) {
                // 获取本地显示配置
                const displayConfig = getACardDisplayConfig(card.id);
                
                // 从 iconMap 获取图标
                const iconFrame = this.iconMap.get(card.id) || null;

                // 设置卡片数据（传入本地配置）
                cardItem.setCardData(card, displayConfig, iconFrame);

                // 设置点击回调
                if (this.cardClickCallback) {
                    cardItem.setClickCallback(this.cardClickCallback);
                }
            }

            this.cardsContainer.addChild(cardNode);
        });

        console.log('[ACardPanel] 已生成', cards.length, '张卡片');
    }

    /**
     * 设置卡片点击回调
     */
    setCardClickCallback(callback: (card: ACard) => void) {
        this.cardClickCallback = callback;
    }

    /**
     * 获取当前卡池
     */
    getCurrentPool(): ACardPool | null {
        return this.currentPool;
    }

    /**
     * 刷新显示（例如在购买后）
     */
    async refresh(pool: ACardPool) {
        await this.setACardPool(pool);
    }
}
