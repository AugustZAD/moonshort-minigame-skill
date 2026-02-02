import { _decorator, Component, Label, Sprite, SpriteFrame, Texture2D, ImageAsset, assetManager, Color } from 'cc';
import { GameManager } from '../scripts/core/GameManager';
import { UserInfo } from '../scripts/types/api.types';

const { ccclass, property, menu } = _decorator;

/**
 * 用户信息显示组件
 * 显示用户头像、名称和邮箱
 */
@ccclass('UserProfileComponent')
@menu('Components/UserProfileComponent')
export class UserProfileComponent extends Component {
    @property({ type: Label, tooltip: '用户名称 Label' })
    nameLabel: Label | null = null;

    @property({ type: Label, tooltip: '用户邮箱 Label' })
    emailLabel: Label | null = null;

    @property({ type: Sprite, tooltip: '用户头像 Sprite' })
    avatarSprite: Sprite | null = null;

    @property({ type: SpriteFrame, tooltip: '默认头像图片（无头像时显示）' })
    defaultAvatarFrame: SpriteFrame | null = null;

    @property({ tooltip: '默认邮箱占位符' })
    defaultEmail: string = 'example@mob-ai.com';

    @property({ tooltip: '默认名称占位符' })
    defaultName: string = 'Guest';

    @property({ type: Color, tooltip: '默认头像颜色（当无默认图片时使用）' })
    defaultAvatarColor: Color = new Color(128, 128, 128, 255);

    private userInfo: UserInfo | null = null;

    onLoad() {
        this.refresh();
    }

    onEnable() {
        this.refresh();
    }

    /**
     * 刷新用户信息显示
     */
    public refresh() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.warn('[UserProfileComponent] GameManager 未初始化');
            this.renderDefault();
            return;
        }

        const auth = gameManager.getAuth();
        if (!auth.isAuthenticated()) {
            console.log('[UserProfileComponent] 用户未登录，显示默认信息');
            this.renderDefault();
            return;
        }

        this.userInfo = auth.getUserInfo();
        this.render();
    }

    /**
     * 渲染用户信息
     */
    private render() {
        if (!this.userInfo) {
            this.renderDefault();
            return;
        }

        // 渲染名称：优先 googleName，其次 username
        if (this.nameLabel) {
            this.nameLabel.string = this.userInfo.googleName || this.userInfo.username || this.defaultName;
        }

        // 渲染邮箱：优先 googleEmail，其次默认值
        if (this.emailLabel) {
            this.emailLabel.string = this.userInfo.googleEmail || this.defaultEmail;
        }

        // 渲染头像：优先 googleAvatar，其次灰色占位
        this.loadAvatar(this.userInfo.googleAvatar);
    }

    /**
     * 渲染默认信息（未登录状态）
     */
    private renderDefault() {
        if (this.nameLabel) {
            this.nameLabel.string = this.defaultName;
        }

        if (this.emailLabel) {
            this.emailLabel.string = this.defaultEmail;
        }

        this.setDefaultAvatar();
    }

    /**
     * 加载头像图片
     */
    private loadAvatar(avatarUrl: string | null | undefined) {
        if (!this.avatarSprite) return;

        if (!avatarUrl) {
            this.setDefaultAvatar();
            return;
        }

        // 加载远程头像
        assetManager.loadRemote<ImageAsset>(avatarUrl, (err, imageAsset) => {
            if (err) {
                console.warn('[UserProfileComponent] 头像加载失败:', err);
                this.setDefaultAvatar();
                return;
            }

            if (!this.avatarSprite || !this.avatarSprite.isValid) return;

            const spriteFrame = new SpriteFrame();
            const texture = new Texture2D();
            texture.image = imageAsset;
            spriteFrame.texture = texture;
            this.avatarSprite.spriteFrame = spriteFrame;
            this.avatarSprite.color = Color.WHITE;
        });
    }

    /**
     * 设置默认头像
     */
    private setDefaultAvatar() {
        if (!this.avatarSprite) return;

        // 优先使用配置的默认头像图片
        if (this.defaultAvatarFrame) {
            this.avatarSprite.spriteFrame = this.defaultAvatarFrame;
            this.avatarSprite.color = this.defaultAvatarColor;
            return;
        }

        // 如果没有配置默认图片，隐藏 Sprite 并打印警告
        console.warn('UserProfileComponent: defaultAvatarFrame 未配置，请在编辑器中设置一个纯白色图片作为默认头像');
        this.avatarSprite.spriteFrame = null;
    }

    /**
     * 获取当前用户信息
     */
    public getUserInfo(): UserInfo | null {
        return this.userInfo;
    }

    /**
     * 检查是否已登录
     */
    public isLoggedIn(): boolean {
        return this.userInfo !== null;
    }
}
