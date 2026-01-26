import { _decorator, Component, Label, Sprite, SpriteFrame, Node, Button, EventHandler } from 'cc';
import { ACard } from '../scripts/types/game.types';
import { ACardDisplayConfig } from '../scripts/config/ACardConfig';

const { ccclass, property, menu } = _decorator;

/**
 * A 卡项组件
 * 显示单张 A 卡的信息：图标、名称、简要效果、详细描述、消耗
 * 
 * 节点结构：
 * ACardItem
 * ├── Icon (Sprite) - 卡片图标
 * ├── Name (Label) - 卡片名称
 * ├── ShortEffect (Label) - 简要效果
 * ├── Description (Label) - 详细描述
 * └── CostContainer (Node) - 消耗容器
 *     ├── FreeContainer (Node) - Free 容器（当成本为 0 时显示）
 *     └── CostLabel (Label) - 金额显示（当成本 > 0 时显示）
 */
@ccclass('ACardItem')
@menu('Components/ACardItem')
export class ACardItem extends Component {
    @property({ type: Sprite, tooltip: '卡片图标' })
    iconSprite: Sprite | null = null;

    @property({ type: Label, tooltip: '卡片名称' })
    nameLabel: Label | null = null;

    @property({ type: Label, tooltip: '简要效果' })
    shortEffectLabel: Label | null = null;

    @property({ type: Label, tooltip: '详细描述' })
    descriptionLabel: Label | null = null;

    @property({ type: Node, tooltip: '消耗容器' })
    costContainer: Node | null = null;

    @property({ type: Node, tooltip: 'Free 容器（stoneCost = 0 时显示）' })
    freeContainer: Node | null = null;

    @property({ type: Label, tooltip: '金额显示（stoneCost > 0 时显示）' })
    costLabel: Label | null = null;

    @property({ type: Button, tooltip: '卡片按钮' })
    cardButton: Button | null = null;

    private cardData: ACard | null = null;

    onLoad() {
        // 手动绑定点击事件（如果编辑器中没配置）
        if (this.cardButton) {
            this.cardButton.node.on('click', this.onCardClick, this);
            console.log('[ACardItem] 点击事件已绑定');
        }
    }

    onDestroy() {
        // 清理事件（检查节点是否有效）
        if (this.cardButton && this.cardButton.node && this.cardButton.node.isValid) {
            this.cardButton.node.off('click', this.onCardClick, this);
        }
        
        // 清空引用
        this.cardData = null;
        this.cardButton = null;
        this.iconSprite = null;
        this.nameLabel = null;
        this.shortEffectLabel = null;
        this.descriptionLabel = null;
        this.costContainer = null;
        this.freeContainer = null;
        this.costLabel = null;
        
        // 清空回调
        if (this.node && this.node.isValid) {
            delete this.node['__cardClickCallback'];
        }
    }

    /**
     * 设置卡片数据
     */
    setCardData(card: ACard, displayConfig: ACardDisplayConfig | null, iconFrame: SpriteFrame | null) {
        this.cardData = card;

        // 设置图标
        if (this.iconSprite && iconFrame) {
            this.iconSprite.spriteFrame = iconFrame;
        }

        // 设置名称（优先使用本地配置）
        if (this.nameLabel) {
            this.nameLabel.string = displayConfig?.name || card.name;
        }

        // 设置简要效果
        if (this.shortEffectLabel && displayConfig) {
            this.shortEffectLabel.string = displayConfig.shortEffect;
        }

        // 设置详细描述（优先使用本地配置）
        if (this.descriptionLabel) {
            this.descriptionLabel.string = displayConfig?.description || card.description || '';
        }

        // 设置消耗显示
        this.updateCostDisplay(card.stoneCost);

        // 设置按钮可用性
        if (this.cardButton) {
            this.cardButton.interactable = card.canAfford;
        }
    }

    /**
     * 更新消耗显示
     * - stoneCost === 0: 显示 FreeContainer
     * - stoneCost > 0: 显示 CostLabel 并设置金额
     */
    private updateCostDisplay(stoneCost: number) {
        if (!this.freeContainer || !this.costLabel) {
            return;
        }

        if (stoneCost === 0) {
            // 显示 Free 容器，隐藏金额
            this.freeContainer.active = true;
            this.costLabel.node.active = false;
        } else {
            // 隐藏 Free 容器，显示金额
            this.freeContainer.active = false;
            this.costLabel.node.active = true;
            this.costLabel.string = stoneCost.toString();
        }
    }

    /**
     * 获取卡片数据
     */
    getCardData(): ACard | null {
        return this.cardData;
    }

    /**
     * 设置点击回调
     */
    setClickCallback(callback: (card: ACard) => void) {
        // 直接保存回调
        this.node['__cardClickCallback'] = callback;
        console.log('[ACardItem] callback 已设置为', this.cardData?.id);
    }

    /**
     * 卡片点击处理（public 供 Button 组件调用）
     */
    public onCardClick() {
        console.log('[ACardItem] 卡片被点击:', this.cardData?.id);
        
        const callback = this.node['__cardClickCallback'];
        if (callback && this.cardData) {
            console.log('[ACardItem] 调用 callback');
            callback(this.cardData);
        } else {
            console.warn('[ACardItem] callback 或 cardData 为 null', {
                hasCallback: !!callback,
                hasCardData: !!this.cardData
            });
        }
    }
}
