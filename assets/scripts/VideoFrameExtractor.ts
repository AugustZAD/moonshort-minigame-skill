import { SpriteFrame, Texture2D, ImageAsset, Size } from 'cc';

/**
 * 视频帧提取器
 * 从 MP4 视频 URL 下载并提取序列帧
 */
export class VideoFrameExtractor {
    /**
     * 从视频 URL 提取序列帧
     * @param videoUrl 视频 URL
     * @param fps 目标帧率（默认 12）
     * @param maxWidth 最大宽度（可选，用于压缩）
     * @param maxHeight 最大高度（可选，用于压缩）
     * @returns 返回 SpriteFrame 数组的 Promise
     */
    static async extractFrames(
        videoUrl: string,
        fps: number = 12,
        maxWidth?: number,
        maxHeight?: number
    ): Promise<SpriteFrame[]> {
        console.log('[VideoFrameExtractor] 开始提取视频帧:', videoUrl);
        
        try {
            // 1. 下载视频
            const videoBlob = await this.downloadVideo(videoUrl);
            
            // 2. 创建临时 video 元素
            const video = await this.createVideoElement(videoBlob);
            
            // 3. 提取帧
            const frames = await this.extractFramesFromVideo(video, fps, maxWidth, maxHeight);
            
            // 4. 清理资源
            URL.revokeObjectURL(video.src);
            video.remove();
            
            console.log('[VideoFrameExtractor] 提取完成，总帧数:', frames.length);
            return frames;
        } catch (error) {
            console.error('[VideoFrameExtractor] 提取失败:', error);
            throw error;
        }
    }

    /**
     * 下载视频文件
     */
    private static async downloadVideo(url: string): Promise<Blob> {
        console.log('[VideoFrameExtractor] 下载视频:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`下载失败: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('[VideoFrameExtractor] 视频下载完成，大小:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
        return blob;
    }

    /**
     * 创建视频元素并等待加载完成
     */
    private static async createVideoElement(videoBlob: Blob): Promise<HTMLVideoElement> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.style.display = 'none';
            video.preload = 'auto';
            video.muted = true;
            
            // 添加到 DOM（某些浏览器需要）
            document.body.appendChild(video);
            
            video.onloadedmetadata = () => {
                console.log('[VideoFrameExtractor] 视频元数据加载完成');
                console.log(`  - 尺寸: ${video.videoWidth}x${video.videoHeight}`);
                console.log(`  - 时长: ${video.duration.toFixed(2)}s`);
                resolve(video);
            };
            
            video.onerror = () => {
                reject(new Error('视频加载失败'));
            };
            
            video.src = URL.createObjectURL(videoBlob);
        });
    }

    /**
     * 从视频中提取帧
     */
    private static async extractFramesFromVideo(
        video: HTMLVideoElement,
        fps: number,
        maxWidth?: number,
        maxHeight?: number
    ): Promise<SpriteFrame[]> {
        const frames: SpriteFrame[] = [];
        const duration = video.duration;
        const interval = 1 / fps; // 每帧间隔（秒）
        const totalFrames = Math.floor(duration * fps);
        
        // 计算目标尺寸
        let targetWidth = video.videoWidth;
        let targetHeight = video.videoHeight;
        
        if (maxWidth || maxHeight) {
            const scale = Math.min(
                maxWidth ? maxWidth / video.videoWidth : 1,
                maxHeight ? maxHeight / video.videoHeight : 1,
                1 // 不放大
            );
            targetWidth = Math.floor(video.videoWidth * scale);
            targetHeight = Math.floor(video.videoHeight * scale);
        }
        
        // 创建 canvas 用于截取帧
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('无法创建 Canvas 上下文');
        }
        
        console.log('[VideoFrameExtractor] 开始提取帧...');
        console.log(`  - 目标帧数: ${totalFrames}`);
        console.log(`  - 帧率: ${fps} FPS`);
        console.log(`  - 输出尺寸: ${targetWidth}x${targetHeight}`);
        
        for (let i = 0; i < totalFrames; i++) {
            const time = i * interval;
            
            // 跳转到指定时间
            await this.seekToTime(video, time);
            
            // 绘制当前帧到 canvas
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            
            // 转换为 SpriteFrame
            const spriteFrame = await this.canvasToSpriteFrame(canvas);
            frames.push(spriteFrame);
            
            // 进度日志
            if ((i + 1) % 10 === 0 || i === totalFrames - 1) {
                console.log(`[VideoFrameExtractor] 进度: ${i + 1}/${totalFrames}`);
            }
        }
        
        // 清理
        canvas.remove();
        
        return frames;
    }

    /**
     * 视频跳转到指定时间
     */
    private static async seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
        return new Promise((resolve) => {
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                // 小延迟确保帧已渲染
                setTimeout(() => resolve(), 10);
            };
            
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
        });
    }

    /**
     * 将 Canvas 转换为 SpriteFrame
     */
    private static async canvasToSpriteFrame(canvas: HTMLCanvasElement): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas 转换失败'));
                    return;
                }
                
                // 读取 Blob 为 ArrayBuffer
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    
                    // 创建 Image
                    const img = new Image();
                    img.onload = () => {
                        // 创建 ImageAsset
                        const imageAsset = new ImageAsset(img);
                        
                        // 创建 Texture2D
                        const texture = new Texture2D();
                        texture.image = imageAsset;
                        
                        // 创建 SpriteFrame
                        const spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        spriteFrame.rect = new cc.Rect(0, 0, canvas.width, canvas.height);
                        
                        resolve(spriteFrame);
                    };
                    
                    img.onerror = () => reject(new Error('图片加载失败'));
                    img.src = URL.createObjectURL(blob);
                };
                
                reader.onerror = () => reject(new Error('读取 Blob 失败'));
                reader.readAsArrayBuffer(blob);
            }, 'image/png');
        });
    }

    /**
     * 预估提取所需时间（秒）
     * @param videoUrl 视频 URL
     * @param fps 目标帧率
     * @returns 预估时间（秒）
     */
    static async estimateExtractionTime(videoUrl: string, fps: number = 12): Promise<number> {
        try {
            const videoBlob = await this.downloadVideo(videoUrl);
            const video = await this.createVideoElement(videoBlob);
            
            const duration = video.duration;
            const totalFrames = Math.floor(duration * fps);
            
            // 清理
            URL.revokeObjectURL(video.src);
            video.remove();
            
            // 假设每帧处理需要 50ms
            return totalFrames * 0.05;
        } catch (error) {
            console.error('[VideoFrameExtractor] 预估时间失败:', error);
            return 0;
        }
    }
}
