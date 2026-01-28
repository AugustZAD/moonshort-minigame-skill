import { _decorator, Component, Sprite, SpriteFrame, Texture2D, UITransform, Enum, CCInteger } from 'cc';

const { ccclass, property, menu } = _decorator;

enum FitMode {
    CONTAIN = 0,      // 完整显示，可能有留白
    COVER = 1,        // 填满容器，可能裁剪
    FIT_WIDTH = 2,    // 宽度一致
    FIT_HEIGHT = 3    // 高度一致
}

/**
 * VideoTexturePlayer（Web 专用实现）
 * - 仅支持远程 MP4（或浏览器可解码的视频）URL
 * - 使用 Canvas 将视频绘制为纹理，支持圆角裁剪
 * - 单组件渲染，避免与额外圆角组件叠加造成的开销
 */
@ccclass('VideoTexturePlayer')
@menu('Video/VideoTexturePlayer')
export class VideoTexturePlayer extends Component {
    @property({ tooltip: '远程视频 URL（mp4/webm 等浏览器可解码格式）' })
    videoUrl: string = '';

    @property({ tooltip: '是否循环播放' })
    loop: boolean = true;

    @property({ tooltip: '自动播放（加载后立即播放）' })
    autoPlay: boolean = true;

    @property({ type: Enum(FitMode), tooltip: '适配模式：0=完整显示 1=填满 2=宽度一致 3=高度一致' })
    fitMode: FitMode = FitMode.COVER;

    @property({ type: CCInteger, tooltip: '上传到纹理的帧率（FPS），用于节流，默认 12' })
    uploadFps: number = 12;

    // 内置圆角（避免额外组件叠加）
    @property({ type: CCInteger, tooltip: '圆角半径（像素）' })
    cornerRadius: number = 24;
    @property({ tooltip: '左上' }) roundTopLeft = true;
    @property({ tooltip: '右上' }) roundTopRight = true;
    @property({ tooltip: '右下' }) roundBottomRight = true;
    @property({ tooltip: '左下' }) roundBottomLeft = true;

    private sprite: Sprite | null = null;
    private uiTransform: UITransform | null = null;
    private isPlaying: boolean = false;

    private videoElement: HTMLVideoElement | null = null;
    private videoTexture: Texture2D | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private _lastUploadMs = 0;
    private _intervalMs = 1000 / 12;
    private videoAspect: number = 16 / 9; // 视频宽高比

    async onLoad() {
        this.sprite = this.getComponent(Sprite);
        if (!this.sprite) {
            console.error('[VideoTexturePlayer] 需要 Sprite 组件');
            return;
        }

        this.uiTransform = this.getComponent(UITransform) || this.node.addComponent(UITransform);
        
        // 初始化节流间隔
        this._intervalMs = 1000 / Math.max(1, this.uploadFps | 0);
        
        // 如果配置了 videoUrl，立即初始化
        if (this.videoUrl) {
            await this.initVideo(this.videoUrl);
        }
    }

    start() {
        // 自动播放
        if (this.autoPlay && this.videoElement) {
            this.play();
        }
    }

    update() {
        if (!this.isPlaying) return;
        const now = (window.performance && performance.now) ? performance.now() : Date.now();
        if (now - this._lastUploadMs < this._intervalMs) return;
        this._lastUploadMs = now;
        this.updateVideoTexture();
    }

    // 初始化视频和纹理
    private async initVideo(url: string) {
        try {
            // 创建隐藏 video
            this.videoElement = document.createElement('video');
            this.videoElement.src = url;
            this.videoElement.crossOrigin = 'anonymous';
            this.videoElement.loop = this.loop;
            this.videoElement.muted = true; // 自动播放策略
            this.videoElement.playsInline = true;
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);

            await new Promise((resolve, reject) => {
                this.videoElement!.onloadedmetadata = resolve;
                this.videoElement!.onerror = reject;
            });

            // 检查 videoElement 是否有效（可能在等待期间被 onDestroy 清理）
            if (!this.videoElement) {
                console.warn('[VideoTexturePlayer] videoElement 已被清理，跳过初始化');
                return;
            }

            // 记录视频宽高比
            const vw = this.videoElement.videoWidth || 1920;
            const vh = this.videoElement.videoHeight || 1080;
            if (vw === 0 || vh === 0) {
                console.warn('[VideoTexturePlayer] 视频尺寸为 0，使用默认比例');
                this.videoAspect = 16 / 9;
            } else {
                this.videoAspect = vw / vh;
            }

            // 根据适配模式计算目标尺寸
            const { tw, th } = this.calculateTargetSize(vw, vh);

            // Canvas + 2D 上下文
            this.canvas = document.createElement('canvas');
            this.canvas.width = tw;
            this.canvas.height = th;
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) throw new Error('无法创建 CanvasRenderingContext2D');

            // 纹理
            this.videoTexture = new Texture2D();
            this.videoTexture.reset({ width: tw, height: th, format: Texture2D.PixelFormat.RGBA8888 });
            // 防止自动释放
            (this.videoTexture as any).addRef?.();

            // 创建新的 SpriteFrame
            const spriteFrame = new SpriteFrame();
            spriteFrame.reset({
                texture: this.videoTexture
            });
            // 防止 SpriteFrame 自动释放
            (spriteFrame as any).addRef?.();
            
            this.sprite.spriteFrame = spriteFrame;
            
            // 设置 Sprite 为 CUSTOM 模式，保持节点原始尺寸
            this.sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            
            console.log('[VideoTexturePlayer] 视频初始化完成, 节点尺寸:', this.uiTransform?.width, 'x', this.uiTransform?.height, ', Canvas尺寸:', tw, 'x', th);
        } catch (e) {
            console.error('[VideoTexturePlayer] 初始化失败:', e);
        }
    }

    // 计算目标纹理尺寸（根据适配模式）
    private calculateTargetSize(videoWidth: number, videoHeight: number): { tw: number; th: number } {
        if (!this.uiTransform) {
            return { tw: videoWidth, th: videoHeight };
        }

        // 简化逻辑：Canvas 尺寸始终等于节点尺寸
        // 视频会在 drawImage 时自动缩放填满 Canvas
        const nodeWidth = this.uiTransform.width;
        const nodeHeight = this.uiTransform.height;

        return {
            tw: Math.max(1, Math.floor(nodeWidth)),
            th: Math.max(1, Math.floor(nodeHeight))
        };
    }

    // 每帧上传纹理，并做圆角裁剪
    private async updateVideoTexture() {
        if (!this.videoElement || !this.canvas || !this.ctx || !this.videoTexture) return;
        if (this.videoElement.paused || this.videoElement.ended) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const rMax = Math.min(this.cornerRadius, Math.floor(Math.min(w, h) / 2));

        // 绘制带圆角的当前视频帧
        this.ctx.clearRect(0, 0, w, h);
        if (rMax > 0 && (this.roundTopLeft || this.roundTopRight || this.roundBottomRight || this.roundBottomLeft)) {
            this.ctx.save();
            this.buildRoundedPath(this.ctx, w, h, rMax, this.roundTopLeft, this.roundTopRight, this.roundBottomRight, this.roundBottomLeft);
            this.ctx.clip();
            this.ctx.drawImage(this.videoElement, 0, 0, w, h);
            this.ctx.restore();
        } else {
            this.ctx.drawImage(this.videoElement, 0, 0, w, h);
        }

        // 直接上传 Canvas 到纹理（避免拷贝像素）
        try {
            if (typeof (this.videoTexture as any).uploadData === 'function') {
                (this.videoTexture as any).uploadData(this.canvas);
            } else {
                // 退回 ImageAsset 路径（Cocos 3.x 不同版本 API 可能不同）
                const ImageAsset = (await import('cc')).ImageAsset;
                if (ImageAsset) {
                    const ia = new ImageAsset(this.canvas);
                    this.videoTexture.image = ia;
                }
            }
        } catch (e) {
            console.warn('[VideoTexturePlayer] uploadData 失败:', e);
        }
    }

    private buildRoundedPath(ctx: CanvasRenderingContext2D, w: number, h: number, r: number,
        tl: boolean, tr: boolean, br: boolean, bl: boolean) {
        const rtl = tl ? r : 0;
        const rtr = tr ? r : 0;
        const rbr = br ? r : 0;
        const rbl = bl ? r : 0;

        ctx.beginPath();
        ctx.moveTo(rtl, 0);
        ctx.lineTo(w - rtr, 0);
        if (rtr) ctx.quadraticCurveTo(w, 0, w, rtr); else ctx.lineTo(w, 0);
        ctx.lineTo(w, h - rbr);
        if (rbr) ctx.quadraticCurveTo(w, h, w - rbr, h); else ctx.lineTo(w, h);
        ctx.lineTo(rbl, h);
        if (rbl) ctx.quadraticCurveTo(0, h, 0, h - rbl); else ctx.lineTo(0, h);
        ctx.lineTo(0, rtl);
        if (rtl) ctx.quadraticCurveTo(0, 0, rtl, 0); else ctx.lineTo(0, 0);
        ctx.closePath();
    }

    // 控制
    play() {
        if (!this.videoElement) {
            console.warn('[VideoTexturePlayer] videoElement 未初始化，无法播放');
            return;
        }
        
        // 确保视频已准备好
        if (this.videoElement.readyState < 2) {
            console.warn('[VideoTexturePlayer] 视频未准备好，等待加载...');
            this.videoElement.addEventListener('canplay', () => {
                this.videoElement?.play().catch(err => {
                    console.error('[VideoTexturePlayer] play 失败:', err);
                });
                this.isPlaying = true;
            }, { once: true });
            return;
        }
        
        this.videoElement.play().catch(err => {
            console.error('[VideoTexturePlayer] play 失败:', err);
        });
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
        if (this.videoElement) this.videoElement.pause();
    }

    stop() {
        this.isPlaying = false;
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
        }
    }

    async setVideoUrl(url: string) {
        this.videoUrl = url;
        this.stop();
        this.cleanup();
        
        try {
            await this.initVideo(url);
            // 延迟一帧再播放，确保初始化完成
            if (this.autoPlay) {
                this.scheduleOnce(() => {
                    this.play();
                }, 0.05);
            }
        } catch (error) {
            console.error('[VideoTexturePlayer] setVideoUrl 失败:', error);
        }
    }

    private cleanup() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.remove();
            this.videoElement = null;
        }
        
        // 释放 SpriteFrame
        if (this.sprite && this.sprite.spriteFrame) {
            const sf = this.sprite.spriteFrame;
            (sf as any).decRef?.();
            (sf as any).destroy?.();
            this.sprite.spriteFrame = null;
        }
        
        // 释放纹理
        if (this.videoTexture) {
            (this.videoTexture as any).decRef?.();
            (this.videoTexture as any).destroy?.();
            this.videoTexture = null;
        }
        
        this.canvas = null;
        this.ctx = null;
    }

    onDestroy() { this.cleanup(); }
}
