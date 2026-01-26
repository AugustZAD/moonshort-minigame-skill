import { _decorator, Component, Label, Sprite, assetManager, ImageAsset, SpriteFrame, Texture2D } from 'cc';
import { Novel } from '../../scripts/types/api.types';
import { VideoTexturePlayer } from './VideoTexturePlayer';

const { ccclass, property, menu } = _decorator;

/**
 * 小说列表项组件
 * 处理封面图加载、视频播放等逻辑
 */
@ccclass('NovelItemComponent')
@menu('Components/NovelItemComponent')
export class NovelItemComponent extends Component {
    @property({ type: Sprite, tooltip: '封面图 Sprite 节点' })
    coverSprite: Sprite | null = null;

    @property({ type: Label, tooltip: '标题 Label 节点' })
    titleLabel: Label | null = null;

    @property({ type: Label, tooltip: '描述 Label 节点' })
    descriptionLabel: Label | null = null;

    @property({ type: Label, tooltip: '第一章标题 Label 节点' })
    firstChapterLabel: Label | null = null;

    @property({ type: VideoTexturePlayer, tooltip: 'Intro 视频播放器节点' })
    videoPlayer: VideoTexturePlayer | null = null;

    @property({ type: SpriteFrame, tooltip: '默认封面图（资源）' })
    defaultCoverImage: SpriteFrame | null = null;

    @property({ tooltip: '默认视频 URL（本地或远程）' })
    defaultVideoUrl: string = '';

    private novelData: Novel | null = null;

    /**
     * 设置小说数据并渲染
     */
    public setData(novel: Novel) {
        this.novelData = novel;
        this.render();
    }

    /**
     * 获取小说数据
     */
    public getData(): Novel | null {
        return this.novelData;
    }

    /**
     * 渲染小说信息
     */
    private render() {
        if (!this.novelData) return;

        // 渲染标题
        if (this.titleLabel) {
            this.titleLabel.string = this.novelData.title;
        }

        // 渲染描述
        if (this.descriptionLabel) {
            this.descriptionLabel.string = this.novelData.description || '';
        }

        // 渲染第一章标题
        if (this.firstChapterLabel) {
            this.firstChapterLabel.string = this.novelData.firstChapterTitle || '未设置标题';
        }

        // 加载封面图
        this.loadCoverImage(this.novelData.coverImage);

        // 加载视频
        this.loadVideo(this.novelData.firstNodeIntroVideo);
    }

    /**
     * 加载封面图
     */
    private loadCoverImage(coverUrl: string | null) {
        if (!this.coverSprite) return;

        if (!coverUrl) {
            // 使用默认封面
            this.setDefaultCover();
            return;
        }

        // 加载远程图片
        assetManager.loadRemote<ImageAsset>(coverUrl, (err, imageAsset) => {
            if (err) {
                console.error('[NovelItemComponent] 封面图加载失败:', err);
                this.setDefaultCover();
                return;
            }

            if (!this.coverSprite) return;

            const spriteFrame = new SpriteFrame();
            const texture = new Texture2D();
            texture.image = imageAsset;
            spriteFrame.texture = texture;
            this.coverSprite.spriteFrame = spriteFrame;
        });
    }

    /**
     * 设置默认封面图
     */
    private setDefaultCover() {
        if (!this.coverSprite) return;

        if (this.defaultCoverImage) {
            this.coverSprite.spriteFrame = this.defaultCoverImage;
        } else {
            console.warn('[NovelItemComponent] 未设置默认封面图');
        }
    }

    /**
     * 加载视频
     */
    private async loadVideo(videoUrl: string | null) {
        if (!this.videoPlayer) return;

        const url = videoUrl || this.defaultVideoUrl;

        if (!url) {
            console.warn('[NovelItemComponent] 无视频 URL，跳过视频加载');
            this.videoPlayer.node.active = false;
            return;
        }

        // VideoTexturePlayer 只支持远程 URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            console.warn('[NovelItemComponent] VideoTexturePlayer 仅支持远程 URL，跳过:', url);
            this.videoPlayer.node.active = false;
            return;
        }

        this.videoPlayer.node.active = true;
        
        try {
            // 设置视频 URL
            await this.videoPlayer.setVideoUrl(url);
        } catch (err) {
            console.error('[NovelItemComponent] 视频加载失败:', err);
            this.videoPlayer.node.active = false;
        }
    }

    /**
     * 播放视频
     */
    public playVideo() {
        if (this.videoPlayer && this.videoPlayer.node.active) {
            this.videoPlayer.play();
        }
    }

    /**
     * 暂停视频
     */
    public pauseVideo() {
        if (this.videoPlayer) {
            this.videoPlayer.pause();
        }
    }

    /**
     * 停止视频
     */
    public stopVideo() {
        if (this.videoPlayer) {
            this.videoPlayer.stop();
        }
    }
}
