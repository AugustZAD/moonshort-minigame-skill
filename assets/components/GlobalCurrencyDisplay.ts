import { _decorator, Component, Label } from 'cc';
import { GameManager } from '../scripts/core/GameManager';
import { DataStore, UserInfoResponse } from '../scripts/core/DataStore';

const { ccclass, property, menu } = _decorator;

/**
 * 全局货币显示组件
 * 用于显示用户的全局金币（Gems）
 */
@ccclass('GlobalCurrencyDisplay')
@menu('UI/GlobalCurrencyDisplay')
export class GlobalCurrencyDisplay extends Component {
    @property({ type: Label, tooltip: '金币数量显示 Label' })
    gemsLabel: Label | null = null;

    @property({ tooltip: '是否在 onLoad 时自动加载' })
    autoLoad: boolean = true;

    @property({ tooltip: '数字前缀（如 "金币："）' })
    prefix: string = '';

    @property({ tooltip: '数字后缀（如 " Gems"）' })
    suffix: string = '';

    private currentGems: number = 0;
    private dataStore: DataStore | null = null;
    private _unsubscribe: (() => void) | null = null;

    async onLoad() {
        const gameManager = GameManager.getInstance();
        this.dataStore = gameManager.getDataStore();

        // 订阅用户信息更新（金币变化时自动刷新）
        this._unsubscribe = this.dataStore.subscribe<UserInfoResponse>('user_info', (data, isFromCache) => {
            if (this.node && this.node.isValid && typeof data.gems === 'number') {
                this.currentGems = data.gems;
                this.updateDisplay();
            }
        });

        if (this.autoLoad) {
            await this.loadGems();
        }
    }

    onDestroy() {
        this._unsubscribe?.();
    }

    /**
     * 加载并显示当前金币数量
     */
    async loadGems(): Promise<void> {
        if (!this.dataStore) return;

        try {
            // 使用 DataStore 获取用户信息（优先返回缓存）
            const response = await this.dataStore.getUserInfo();
            
            if (response && typeof response.gems === 'number') {
                this.currentGems = response.gems;
                this.updateDisplay();
                console.log('[GlobalCurrencyDisplay] 金币加载成功:', this.currentGems);
            } else {
                console.warn('[GlobalCurrencyDisplay] 响应中没有 gems 字段');
                this.currentGems = 0;
                this.updateDisplay();
            }
        } catch (error) {
            console.error('[GlobalCurrencyDisplay] 加载金币失败:', error);
            this.currentGems = 0;
            this.updateDisplay();
        }
    }

    /**
     * 更新显示
     */
    private updateDisplay(): void {
        if (!this.gemsLabel) {
            console.warn('[GlobalCurrencyDisplay] gemsLabel 未配置');
            return;
        }

        const displayText = `${this.prefix}${this.currentGems}${this.suffix}`;
        this.gemsLabel.string = displayText;
    }

    /**
     * 手动刷新金币显示
     */
    async refresh(): Promise<void> {
        await this.loadGems();
    }

    /**
     * 设置金币数量（本地更新，不调用 API）
     * @param gems 金币数量
     */
    setGems(gems: number): void {
        this.currentGems = gems;
        this.updateDisplay();
    }

    /**
     * 获取当前金币数量
     */
    getGems(): number {
        return this.currentGems;
    }

    /**
     * 增加金币数量（本地更新）
     * @param amount 增加的数量
     */
    addGems(amount: number): void {
        this.currentGems += amount;
        this.updateDisplay();
    }

    /**
     * 减少金币数量（本地更新）
     * @param amount 减少的数量
     */
    subtractGems(amount: number): void {
        this.currentGems = Math.max(0, this.currentGems - amount);
        this.updateDisplay();
    }
}
