import { _decorator, Component, Label } from 'cc';
import { GameManager } from '../scripts/core/GameManager';
import { DataStore, UserInfoResponse } from '../scripts/core/DataStore';
import { UserInfo } from '../scripts/types/api.types';

const { ccclass, property, menu } = _decorator;

/**
 * 用户信息组件
 * 用于显示用户的基本信息（用户名、宝石数量等）
 */
@ccclass('UserInfoComponent')
@menu('Components/UserInfoComponent')
export class UserInfoComponent extends Component {
    @property({ type: Label, tooltip: '用户名 Label' })
    usernameLabel: Label | null = null;

    @property({ type: Label, tooltip: '宝石数量 Label' })
    gemsLabel: Label | null = null;

    @property({ type: Label, tooltip: '用户 ID Label（可选）' })
    userIdLabel: Label | null = null;

    @property({ tooltip: '是否自动加载' })
    autoLoad: boolean = true;

    @property({ tooltip: '宝石数量前缀文本' })
    gemsPrefix: string = '宝石: ';

    private userInfo: UserInfo | null = null;
    private dataStore: DataStore | null = null;
    private _unsubscribe: (() => void) | null = null;

    onLoad() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('[UserInfoComponent] GameManager 未初始化');
            return;
        }

        this.dataStore = gameManager.getDataStore();

        // 订阅用户信息更新
        this._unsubscribe = this.dataStore.subscribe<UserInfoResponse>('user_info', (data, isFromCache) => {
            if (this.node && this.node.isValid) {
                this.userInfo = {
                    id: data.id,
                    username: data.username,
                    gems: data.gems,
                    isActivated: data.isActivated,
                    inviteCode: data.inviteCode,
                };
                this.updateDisplay();
            }
        });

        if (this.autoLoad) {
            this.loadUserInfo();
        }
    }

    onDestroy() {
        this._unsubscribe?.();
    }

    /**
     * 加载用户信息
     */
    async loadUserInfo() {
        if (!this.dataStore) {
            console.error('[UserInfoComponent] DataStore 未初始化');
            return;
        }

        try {
            // 使用 DataStore 获取用户信息
            const data = await this.dataStore.getUserInfo();
            this.userInfo = {
                id: data.id,
                username: data.username,
                gems: data.gems,
                isActivated: data.isActivated,
                inviteCode: data.inviteCode,
            };
            this.updateDisplay();
        } catch (error) {
            console.warn('[UserInfoComponent] 获取用户信息失败:', error);
        }
    }

    /**
     * 更新显示
     */
    private updateDisplay() {
        if (!this.userInfo) return;

        // 用户名
        if (this.usernameLabel) {
            this.usernameLabel.string = this.userInfo.username;
        }

        // 宝石数量
        if (this.gemsLabel) {
            this.gemsLabel.string = `${this.gemsPrefix}${this.userInfo.gems}`;
        }

        // 用户 ID
        if (this.userIdLabel) {
            this.userIdLabel.string = this.userInfo.id;
        }
    }

    /**
     * 刷新用户信息
     */
    async refresh() {
        if (this.dataStore) {
            this.dataStore.invalidateUserInfo();
        }
        await this.loadUserInfo();
    }

    /**
     * 更新宝石数量（用于其他组件更新）
     */
    updateGems(gems: number) {
        if (this.userInfo) {
            this.userInfo.gems = gems;
            
            if (this.gemsLabel) {
                this.gemsLabel.string = `${this.gemsPrefix}${gems}`;
            }

            // 同步到 AuthManager
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.getAuth().updateUserInfo({ gems });
            }
        }
    }

    /**
     * 获取用户信息
     */
    getUserInfo(): UserInfo | null {
        return this.userInfo;
    }
}
