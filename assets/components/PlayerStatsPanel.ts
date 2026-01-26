import { _decorator, Component, Label, Sprite, Node, SpriteFrame, UITransform, instantiate, Mask, Graphics, Color } from 'cc';
import { PlayerSave } from '../scripts/types/game.types';

const { ccclass, property, menu } = _decorator;

/**
 * 玩家状态面板组件
 * 显示玩家的头像、等级、经验、HP/MP、金币等
 * 
 * 节点结构：
 * PlayerStatsPanel
 * ├── AvatarSprite - 扮演角色头像
 * ├── LevelSprite - 等级图片（根据等级显示1-12级对应的图片）
 * ├── SpiritStoneLabel - 灵石数量
 * ├── GlobalCurrencyLabel - 全局金币
 * ├── ExpContainer - 经验槽容器（10个经验槽）
 * │   ├── ExpSlot1 (Sprite)
 * │   ├── ExpSlot2 (Sprite)
 * │   └── ... (共10个)
 * ├── HPBar (Sprite, Type=SLICED 九宫格)
 * └── MPBar (Sprite, Type=SLICED 九宫格)
 */
@ccclass('PlayerStatsPanel')
@menu('Components/PlayerStatsPanel')
export class PlayerStatsPanel extends Component {
    // 头像
    @property({ type: Sprite, tooltip: '扮演角色头像' })
    avatarSprite: Sprite | null = null;

    // 等级图片（1-12级）
    @property({ type: Sprite, tooltip: '等级显示图片' })
    levelSprite: Sprite | null = null;

    @property({ type: [SpriteFrame], tooltip: '等级图片数组（索引0=1级，索引11=12级）' })
    levelSpriteFrames: SpriteFrame[] = [];

    // 货币
    @property({ type: Label, tooltip: '灵石数量' })
    spiritStoneLabel: Label | null = null;

    @property({ type: Label, tooltip: '全局金币' })
    globalCurrencyLabel: Label | null = null;

    // 经验槽（10个）
    @property({ type: Node, tooltip: '经验槽容器' })
    expContainer: Node | null = null;

    @property({ type: Node, tooltip: '经验槽填充节点模板' })
    expSlotFillNode: Node | null = null;

    @property({ type: Node, tooltip: '经验槽空节点模板' })
    expSlotEmptyNode: Node | null = null;

    // HP/MP条（九宫格裁切）
    @property({ type: Sprite, tooltip: 'HP条（九宫格）' })
    hpBar: Sprite | null = null;

    @property({ type: Sprite, tooltip: 'MP条（九宫格）' })
    mpBar: Sprite | null = null;

    @property({ tooltip: 'HP/MP条的最大宽度（默认从预制体读取，如果设置则覆盖）' })
    barMaxWidth: number = 0;

    private currentSave: PlayerSave | null = null;
    private expSlots: Node[] = [];
    private initialHPBarWidth: number = 0;
    private initialMPBarWidth: number = 0;

    onLoad() {
        // 初始化经验槽
        this.initExpSlots();
        
        // 记录HP/MP条的初始宽度
        this.recordInitialBarWidths();
        
        // 为头像设置圆形遮罩
        this.setupAvatarMask();
    }

    /**
     * 初始化经验槽（克隆节点创建10个经验槽）
     */
    private initExpSlots() {
        if (!this.expContainer) {
            console.warn('[PlayerStatsPanel] expContainer 未配置');
            return;
        }

        if (!this.expSlotFillNode || !this.expSlotEmptyNode) {
            console.warn('[PlayerStatsPanel] 经验槽模板节点未配置');
            return;
        }

        // 清空容器
        this.expContainer.removeAllChildren();
        this.expSlots = [];

        // 克隆10个经验槽（默认使用空节点）
        for (let i = 0; i < 10; i++) {
            const slotNode = instantiate(this.expSlotEmptyNode);
            slotNode.name = `ExpSlot${i + 1}`;
            slotNode.active = true; // 显示节点
            this.expContainer.addChild(slotNode);
            this.expSlots.push(slotNode);
        }

        console.log('[PlayerStatsPanel] 初始化了', this.expSlots.length, '个经验槽');
    }

    /**
     * 记录HP/MP条的初始宽度
     */
    private recordInitialBarWidths() {
        // 记录HP条初始宽度
        if (this.hpBar) {
            const hpTransform = this.hpBar.getComponent(UITransform);
            if (hpTransform) {
                this.initialHPBarWidth = this.barMaxWidth > 0 ? this.barMaxWidth : hpTransform.width;
                console.log('[PlayerStatsPanel] HP条最大宽度:', this.initialHPBarWidth);
            }
        }

        // 记录MP条初始宽度
        if (this.mpBar) {
            const mpTransform = this.mpBar.getComponent(UITransform);
            if (mpTransform) {
                this.initialMPBarWidth = this.barMaxWidth > 0 ? this.barMaxWidth : mpTransform.width;
                console.log('[PlayerStatsPanel] MP条最大宽度:', this.initialMPBarWidth);
            }
        }
    }

    /**
     * 更新玩家状态显示
     */
    updatePlayerState(save: PlayerSave) {
        this.currentSave = save;

        // 更新等级图片
        this.updateLevel(save.level);

        // 更新经验槽
        this.updateExpSlots(save.experience, save.expForLevelUp);

        // 更新HP条
        this.updateHPBar(save.hp, save.maxHp);

        // 更新MP条
        this.updateMPBar(save.mp, save.maxMp);

        // 更新灵石
        if (this.spiritStoneLabel) {
            this.spiritStoneLabel.string = save.spiritStone.toString();
        }

        // TODO: 更新全局金币（需要从其他地方获取）
        // if (this.globalCurrencyLabel) {
        //     this.globalCurrencyLabel.string = '0';
        // }
    }

    /**
     * 更新等级图片（1-12级）
     */
    private updateLevel(level: number) {
        if (!this.levelSprite || this.levelSpriteFrames.length === 0) {
            return;
        }

        // 等级范围 1-12，对应索引 0-11
        const index = Math.max(0, Math.min(level - 1, 11));
        
        if (this.levelSpriteFrames[index]) {
            this.levelSprite.spriteFrame = this.levelSpriteFrames[index];
        } else {
            console.warn('[PlayerStatsPanel] 等级', level, '的图片未配置');
        }
    }

    /**
     * 更新经验槽（10个槽，自左向右填充）
     */
    private updateExpSlots(exp: number, expForLevelUp: number) {
        if (this.expSlots.length === 0 || !this.expSlotFillNode || !this.expSlotEmptyNode) {
            return;
        }

        // 计算应该填充几个槽
        const progress = expForLevelUp > 0 ? exp / expForLevelUp : 0;
        const filledCount = Math.floor(progress * 10);

        // 更新每个槽的显示（通过替换节点）
        for (let i = 0; i < this.expSlots.length; i++) {
            const oldSlot = this.expSlots[i];
            let newSlot: Node;
            
            if (i < filledCount) {
                // 填充：克隆填充节点
                newSlot = instantiate(this.expSlotFillNode);
            } else {
                // 空：克隆空节点
                newSlot = instantiate(this.expSlotEmptyNode);
            }
            
            newSlot.name = oldSlot.name;
            newSlot.active = true; // 显示节点
            const index = oldSlot.getSiblingIndex();
            oldSlot.removeFromParent();
            oldSlot.destroy();
            
            this.expContainer!.insertChild(newSlot, index);
            this.expSlots[i] = newSlot;
        }
    }

    /**
     * 更新HP条（通过调整宽度）
     */
    private updateHPBar(hp: number, maxHp: number) {
        if (!this.hpBar) {
            console.warn('[PlayerStatsPanel] HP条组件未配置');
            return;
        }

        const progress = maxHp > 0 ? hp / maxHp : 0;
        const transform = this.hpBar.getComponent(UITransform);
        
        if (transform) {
            if (this.initialHPBarWidth === 0) {
                console.warn('[PlayerStatsPanel] HP条最大宽度未初始化，使用当前宽度');
                this.initialHPBarWidth = transform.width;
            }
            const newWidth = this.initialHPBarWidth * Math.max(0, Math.min(progress, 1));
            transform.width = newWidth;
            console.log(`[PlayerStatsPanel] 更新HP条: ${hp}/${maxHp} (${(progress * 100).toFixed(1)}%) 宽度: ${newWidth}`);
        } else {
            console.warn('[PlayerStatsPanel] HP条没有UITransform组件');
        }
    }

    /**
     * 更新MP条（通过调整宽度）
     */
    private updateMPBar(mp: number, maxMp: number) {
        if (!this.mpBar) {
            console.warn('[PlayerStatsPanel] MP条组件未配置');
            return;
        }

        const progress = maxMp > 0 ? mp / maxMp : 0;
        const transform = this.mpBar.getComponent(UITransform);
        
        if (transform) {
            if (this.initialMPBarWidth === 0) {
                console.warn('[PlayerStatsPanel] MP条最大宽度未初始化，使用当前宽度');
                this.initialMPBarWidth = transform.width;
            }
            const newWidth = this.initialMPBarWidth * Math.max(0, Math.min(progress, 1));
            transform.width = newWidth;
            console.log(`[PlayerStatsPanel] 更新MP条: ${mp}/${maxMp} (${(progress * 100).toFixed(1)}%) 宽度: ${newWidth}`);
        } else {
            console.warn('[PlayerStatsPanel] MP条没有UITransform组件');
        }
    }

    /**
     * 为头像设置圆形遮罩
     * Mask 必须在父节点上，Sprite 是子节点
     */
    private setupAvatarMask() {
        if (!this.avatarSprite) {
            return;
        }

        const spriteNode = this.avatarSprite.node;
        const parentNode = spriteNode.parent;
        
        if (!parentNode) {
            console.warn('[PlayerStatsPanel] 头像节点没有父节点，无法设置 Mask');
            return;
        }
        
        // 在父节点上添加 Mask 组件
        let mask = parentNode.getComponent(Mask);
        if (!mask) {
            mask = parentNode.addComponent(Mask);
        }
        
        // 设置 Mask 类型为 Graphics
        mask.type = Mask.Type.GRAPHICS_STENCIL;
        
        // 在父节点上添加 Graphics 组件
        let graphics = parentNode.getComponent(Graphics);
        if (!graphics) {
            graphics = parentNode.addComponent(Graphics);
        }
        
        // 获取父节点尺寸
        const transform = parentNode.getComponent(UITransform);
        if (!transform) {
            console.warn('[PlayerStatsPanel] 父节点没有 UITransform 组件');
            return;
        }
        
        // 绘制圆形（以节点中心为圆心）
        const radius = Math.min(transform.width, transform.height) / 2;
        graphics.clear();
        graphics.fillColor = Color.WHITE;
        graphics.circle(0, 0, radius);
        graphics.fill();
        
        console.log(`[PlayerStatsPanel] 已为头像父节点设置圆形遮罩，半径: ${radius}`);
    }

    /**
     * 设置头像
     */
    setAvatar(spriteFrame: SpriteFrame | null) {
        if (this.avatarSprite && spriteFrame) {
            this.avatarSprite.spriteFrame = spriteFrame;
        }
    }

    /**
     * 获取当前存档
     */
    getCurrentSave(): PlayerSave | null {
        return this.currentSave;
    }

    /**
     * 设置HP/MP条的最大宽度
     * 可在运行时动态调整最大宽度
     */
    setBarMaxWidth(maxWidth: number) {
        this.barMaxWidth = maxWidth;
        this.initialHPBarWidth = maxWidth;
        this.initialMPBarWidth = maxWidth;
        console.log('[PlayerStatsPanel] 设置HP/MP条最大宽度为:', maxWidth);
        
        // 如果当前有存档数据，重新更新显示
        if (this.currentSave) {
            this.updatePlayerState(this.currentSave);
        }
    }
}
