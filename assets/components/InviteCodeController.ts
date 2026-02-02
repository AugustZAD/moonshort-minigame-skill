import { _decorator, Component, Node, Label, director, EditBox } from 'cc';
import { GameManager } from '../scripts/core/GameManager';
import { InviteAPI } from '../scripts/api/InviteAPI';

const { ccclass, property, menu } = _decorator;

/**
 * 邀请码输入页面控制组件
 * 
 * UI 结构：
 * - 一个透明的 EditBox 覆盖在上面，用于接收输入（点击弹出键盘）
 * - 6个 Label 用于展示单个字符
 * - 一个错误提示 Label
 * 
 * 行为：
 * - 输入长度从5变成6时自动尝试激活
 * - 可通过 handleDone 手动触发激活
 * - 成功跳转到 index，失败显示错误提示
 */
@ccclass('InviteCodeController')
@menu('Components/InviteCodeController')
export class InviteCodeController extends Component {
    @property({ type: EditBox, tooltip: '透明输入框（覆盖在上面，用于接收输入）' })
    hiddenInput: EditBox | null = null;

    @property({ type: [Label], tooltip: '6个字符展示 Label（按顺序）' })
    charLabels: Label[] = [];

    @property({ type: Label, tooltip: '错误提示 Label' })
    errorLabel: Label | null = null;

    @property({ type: Node, tooltip: '加载中提示节点（可选）' })
    loadingNode: Node | null = null;

    @property({ tooltip: '激活成功后跳转的场景' })
    successSceneName: string = 'index';

    @property({ tooltip: '空字符占位符' })
    placeholderChar: string = '_';

    @property({ tooltip: '错误提示文案' })
    errorMessage: string = 'Invite code error, please try again.';

    private inviteAPI: InviteAPI | null = null;
    private isLoading: boolean = false;
    private lastLength: number = 0;
    private isRedirecting: boolean = false;

    onLoad() {
        // 初始化 API
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            this.inviteAPI = new InviteAPI(gameManager.getAPI());
        }

        // 设置输入框监听
        if (this.hiddenInput) {
            this.hiddenInput.node.on('text-changed', this.onTextChanged, this);
            this.hiddenInput.node.on('editing-did-ended', this.onEditingEnded, this);
        }

        // 初始化显示
        this.updateCharLabels('');
        this.hideError();

        if (this.loadingNode) {
            this.loadingNode.active = false;
        }

        // 1秒后检查激活状态
        this.scheduleOnce(() => {
            this.checkActivationStatus();
        }, 1);
    }

    onDestroy() {
        if (this.hiddenInput) {
            this.hiddenInput.node.off('text-changed', this.onTextChanged, this);
            this.hiddenInput.node.off('editing-did-ended', this.onEditingEnded, this);
        }
    }

    /**
     * 输入内容变化
     */
    private onTextChanged(editBox: EditBox) {
        // 只保留字母数字（大小写均可），限制6位
        let value = editBox.string.replace(/[^A-Za-z0-9]/g, '');
        if (value.length > 6) {
            value = value.slice(0, 6);
        }

        // 更新输入框（避免循环触发）
        if (editBox.string !== value) {
            editBox.string = value;
            return; // 会再次触发 onTextChanged
        }

        // 更新字符展示
        this.updateCharLabels(value);

        // 隐藏错误提示（用户正在输入）
        this.hideError();

        // 检查是否从5位变成6位，自动提交
        if (this.lastLength === 5 && value.length === 6) {
            this.doActivate(value);
        }

        this.lastLength = value.length;
    }

    /**
     * 输入结束（键盘收起）
     */
    private onEditingEnded() {
        // 可选：输入结束时也可以尝试提交
    }

    /**
     * 更新6个字符 Label 的显示
     */
    private updateCharLabels(code: string) {
        for (let i = 0; i < 6; i++) {
            if (i < this.charLabels.length && this.charLabels[i] && this.charLabels[i].isValid) {
                if (i < code.length) {
                    this.charLabels[i].string = code[i];
                } else {
                    this.charLabels[i].string = this.placeholderChar;
                }
            }
        }
    }

    /**
     * 获取当前输入的邀请码
     */
    private getInviteCode(): string {
        return this.hiddenInput?.string?.trim() || '';
    }

    /**
     * 手动触发激活（供 Button Click Events 调用）
     */
    handleDone() {
        if (this.isLoading) return;

        const code = this.getInviteCode();
        if (code.length !== 6) {
            this.showError('Please enter 6 characters.');
            return;
        }

        this.doActivate(code);
    }

    /**
     * 检查激活状态，已激活则跳转首页
     */
    private async checkActivationStatus() {
        if (!this.node || !this.node.isValid || this.isRedirecting) return;

        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        try {
            // 直接从后端获取状态
            const api = gameManager.getAPI();
            const response = await api.get('/apiv2/auth/me');
            
            if (!this.node || !this.node.isValid || this.isRedirecting) return;

            if (response.isActivated) {
                console.log('[InviteCodeController] 账户已激活，跳转首页');
                this.isRedirecting = true;
                director.loadScene(this.successSceneName);
            }
        } catch (e) {
            // 忽略检查失败
        }
    }

    /**
     * 执行激活请求
     */
    private async doActivate(inviteCode: string) {
        if (this.isLoading || !this.inviteAPI) return;

        this.isLoading = true;
        this.setLoading(true);
        this.hideError();

        try {
            const result = await this.inviteAPI.activateAccount(inviteCode);

            if (!this.node || !this.node.isValid) return;

            console.log('[InviteCodeController] 激活成功:', result.message);

            // 刷新用户信息
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                try {
                    await gameManager.getAuth().refreshUserInfo();
                } catch (e) {
                    // 忽略刷新失败
                }
            }

            // 等待一会再跳转
            this.isRedirecting = true;
            this.scheduleOnce(() => {
                if (this.node && this.node.isValid) {
                    director.loadScene(this.successSceneName);
                }
            }, 0.5);

        } catch (error: any) {
            if (!this.node || !this.node.isValid || this.isRedirecting) return;

            // 如果是"账户已激活"错误，直接跳转首页
            if (error.message?.includes('已激活')) {
                console.log('[InviteCodeController] 账户已激活，跳转首页');
                this.isRedirecting = true;
                director.loadScene(this.successSceneName);
                return;
            }

            console.error('[InviteCodeController] 激活失败:', error.message);
            this.showError(this.errorMessage);
        } finally {
            this.isLoading = false;
            if (this.node && this.node.isValid) {
                this.setLoading(false);
            }
        }
    }

    /**
     * 显示错误提示
     */
    private showError(message: string) {
        if (this.errorLabel && this.errorLabel.isValid) {
            this.errorLabel.string = message;
            this.errorLabel.node.active = true;
        }
    }

    /**
     * 隐藏错误提示
     */
    private hideError() {
        if (this.errorLabel && this.errorLabel.isValid) {
            this.errorLabel.node.active = false;
        }
    }

    /**
     * 设置加载状态
     */
    private setLoading(loading: boolean) {
        if (this.loadingNode && this.loadingNode.isValid) {
            this.loadingNode.active = loading;
        }
        if (this.hiddenInput && this.hiddenInput.isValid) {
            this.hiddenInput.enabled = !loading;
        }
    }

    /**
     * 清空输入
     */
    clearInput() {
        if (this.hiddenInput) {
            this.hiddenInput.string = '';
        }
        this.lastLength = 0;
        this.updateCharLabels('');
        this.hideError();
    }

    /**
     * 聚焦输入框（弹出键盘）
     */
    focusInput() {
        if (this.hiddenInput && this.hiddenInput.isValid) {
            this.hiddenInput.focus();
        }
    }
}
