import { _decorator, Component, EditBox, Label, Node, Button, EventHandler } from 'cc';
import { GameManager } from '../scripts/core/GameManager';
import { InviteAPI } from '../scripts/api/InviteAPI';

const { ccclass, property, menu } = _decorator;

/**
 * 邀请码输入组件
 * 用于注册时输入和验证邀请码
 */
@ccclass('InviteCodeInput')
@menu('Components/InviteCodeInput')
export class InviteCodeInput extends Component {
    @property({ type: EditBox, tooltip: '邀请码输入框' })
    inviteCodeInput: EditBox | null = null;

    @property({ type: Label, tooltip: '验证状态提示 Label' })
    statusLabel: Label | null = null;

    @property({ type: Button, tooltip: '确认按钮' })
    confirmButton: Button | null = null;

    @property({ type: Node, tooltip: '加载中提示节点' })
    loadingNode: Node | null = null;

    @property({ tooltip: '是否自动验证（输入6位后自动触发）' })
    autoValidate: boolean = true;

    @property({ tooltip: '邀请码长度' })
    codeLength: number = 6;

    private _inviteAPI: InviteAPI | null = null;
    private _isValidating: boolean = false;
    private _lastValidCode: string = '';
    private _isValid: boolean = false;

    // 事件回调
    private _onValidCallback: ((code: string) => void) | null = null;
    private _onInvalidCallback: ((reason: string) => void) | null = null;

    onLoad() {
        // 初始化 API
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            this._inviteAPI = new InviteAPI(gameManager.getAPI());
        }

        // 设置输入框监听
        if (this.inviteCodeInput) {
            this.inviteCodeInput.node.on('text-changed', this.onInputChanged, this);
            this.inviteCodeInput.node.on('editing-did-ended', this.onInputEnded, this);
        }

        // 隐藏加载提示
        if (this.loadingNode) {
            this.loadingNode.active = false;
        }
    }

    onDestroy() {
        if (this.inviteCodeInput) {
            this.inviteCodeInput.node.off('text-changed', this.onInputChanged, this);
            this.inviteCodeInput.node.off('editing-did-ended', this.onInputEnded, this);
        }
    }

    /**
     * 设置验证成功回调
     */
    setOnValidCallback(callback: (code: string) => void) {
        this._onValidCallback = callback;
    }

    /**
     * 设置验证失败回调
     */
    setOnInvalidCallback(callback: (reason: string) => void) {
        this._onInvalidCallback = callback;
    }

    /**
     * 获取当前输入的邀请码
     */
    getInviteCode(): string {
        return this.inviteCodeInput?.string?.trim().toUpperCase() || '';
    }

    /**
     * 检查邀请码是否有效
     */
    isValid(): boolean {
        return this._isValid && this.getInviteCode() === this._lastValidCode;
    }

    /**
     * 重置组件状态
     */
    reset() {
        if (this.inviteCodeInput) {
            this.inviteCodeInput.string = '';
        }
        this._isValid = false;
        this._lastValidCode = '';
        this.setStatus('', 'normal');
    }

    /**
     * 输入内容变化
     */
    private onInputChanged(editBox: EditBox) {
        // 转大写并限制长度
        let value = editBox.string.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > this.codeLength) {
            value = value.slice(0, this.codeLength);
        }
        
        // 更新输入框（避免触发循环）
        if (editBox.string !== value) {
            editBox.string = value;
        }

        // 重置验证状态
        if (value !== this._lastValidCode) {
            this._isValid = false;
        }

        // 自动验证
        if (this.autoValidate && value.length === this.codeLength) {
            this.validateCode();
        } else if (value.length < this.codeLength) {
            this.setStatus(`还需输入 ${this.codeLength - value.length} 位`, 'normal');
        }
    }

    /**
     * 输入结束
     */
    private onInputEnded() {
        const code = this.getInviteCode();
        if (code.length === this.codeLength && !this._isValid) {
            this.validateCode();
        }
    }

    /**
     * 确认按钮点击（供 Button 的 Click Events 调用）
     */
    onConfirmClick() {
        const code = this.getInviteCode();
        if (code.length !== this.codeLength) {
            this.setStatus(`请输入 ${this.codeLength} 位邀请码`, 'error');
            return;
        }

        if (this._isValid && code === this._lastValidCode) {
            // 已验证通过，触发回调
            this._onValidCallback?.(code);
        } else {
            // 需要验证
            this.validateCode();
        }
    }

    /**
     * 验证邀请码
     */
    async validateCode() {
        if (this._isValidating) return;

        const code = this.getInviteCode();
        if (code.length !== this.codeLength) {
            this.setStatus(`请输入 ${this.codeLength} 位邀请码`, 'error');
            return;
        }

        if (!this._inviteAPI) {
            this.setStatus('系统未初始化', 'error');
            return;
        }

        this._isValidating = true;
        this.setLoading(true);
        this.setStatus('验证中...', 'normal');

        try {
            const result = await this._inviteAPI.validateInviteCode(code);
            
            if (!this.node || !this.node.isValid) return;

            if (result.valid) {
                this._isValid = true;
                this._lastValidCode = code;
                this.setStatus('邀请码有效 ✓', 'success');
                this._onValidCallback?.(code);
            } else {
                this._isValid = false;
                this.setStatus(result.reason || '邀请码无效', 'error');
                this._onInvalidCallback?.(result.reason || '邀请码无效');
            }
        } catch (error: any) {
            if (!this.node || !this.node.isValid) return;
            
            this._isValid = false;
            const message = error.message || '验证失败，请稍后重试';
            this.setStatus(message, 'error');
            this._onInvalidCallback?.(message);
        } finally {
            this._isValidating = false;
            if (this.node && this.node.isValid) {
                this.setLoading(false);
            }
        }
    }

    /**
     * 设置状态文本
     */
    private setStatus(message: string, type: 'normal' | 'success' | 'error') {
        if (!this.statusLabel || !this.statusLabel.isValid) return;

        this.statusLabel.string = message;
        this.statusLabel.node.active = message.length > 0;

        // 根据类型设置颜色（可选，需要在编辑器中配置）
        // this.statusLabel.color = type === 'error' ? Color.RED : 
        //                          type === 'success' ? Color.GREEN : Color.WHITE;
    }

    /**
     * 设置加载状态
     */
    private setLoading(loading: boolean) {
        if (this.loadingNode && this.loadingNode.isValid) {
            this.loadingNode.active = loading;
        }
        if (this.confirmButton && this.confirmButton.isValid) {
            this.confirmButton.interactable = !loading;
        }
        if (this.inviteCodeInput && this.inviteCodeInput.isValid) {
            this.inviteCodeInput.enabled = !loading;
        }
    }
}
