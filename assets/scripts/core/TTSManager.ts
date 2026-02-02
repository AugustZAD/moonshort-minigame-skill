import { _decorator, AudioSource, AudioClip, sys, assetManager, resources } from 'cc';
import { APIConfig } from '../config/APIConfig';

/**
 * TTS 段落类型
 */
export interface TTSSegment {
    id: number;
    role: string;
    instruction: string;
    content: string;
    speaker: string;
}

/**
 * 音频缓存项
 */
interface AudioCacheItem {
    audioData: string; // Base64 编码
    audioClip?: AudioClip;
    timestamp: number;
    loading?: boolean; // 是否正在加载
    loadPromise?: Promise<string | null>; // 加载 Promise
}

/**
 * TTS 管理器
 * 
 * 功能:
 * 1. 流式预加载 - 后台逐个加载 TTS，不阻塞播放
 * 2. 按需等待 - 播放时如果当前段落未加载完成，等待它
 * 3. 缓存已合成的音频
 */
export class TTSManager {
    private static _instance: TTSManager;
    
    // 音频缓存 (segment_id -> audio data)
    private audioCache: Map<string, AudioCacheItem> = new Map();
    private maxCacheSize = 50;
    
    // 当前播放状态
    private audioSource: AudioSource | null = null;
    private isPlaying = false;
    private currentClip: AudioClip | null = null;
    private currentWebAudio: HTMLAudioElement | null = null; // Web 平台音频元素
    
    // 回调
    private onPlayFinishedCallback: (() => void) | null = null;
    
    // API 配置
    private apiBaseUrl: string = '';
    
    // 当前预加载的 segments
    private currentSegments: TTSSegment[] = [];
    
    private constructor() {
        // 从 APIConfig 获取 API 地址
        this.apiBaseUrl = APIConfig.BASE_URL;
    }
    
    /**
     * 获取单例
     */
    static getInstance(): TTSManager {
        if (!TTSManager._instance) {
            TTSManager._instance = new TTSManager();
        }
        return TTSManager._instance;
    }
    
    /**
     * 设置 AudioSource 组件
     */
    setAudioSource(source: AudioSource) {
        this.audioSource = source;
    }
    
    /**
     * 合成并播放单条文本
     */
    async synthesizeAndPlay(
        text: string,
        speaker?: string,
        instruction?: string,
        onFinished?: () => void
    ): Promise<boolean> {
        try {
            // 生成缓存键
            const cacheKey = this.generateCacheKey(text, speaker, instruction);
            
            // 检查缓存
            let audioData = this.getFromCache(cacheKey);
            
            if (!audioData) {
                // 调用 API 合成
                console.log('[TTSManager] 调用 API 合成语音...');
                const response = await this.callSynthesizeAPI({
                    text,
                    speaker,
                    instruction,
                });
                
                if (!response.success || !response.audioData) {
                    console.error('[TTSManager] 合成失败:', response.error);
                    onFinished?.();
                    return false;
                }
                
                audioData = response.audioData;
                this.addToCache(cacheKey, audioData);
            }
            
            // 播放音频
            this.onPlayFinishedCallback = onFinished || null;
            await this.playBase64Audio(audioData);
            
            return true;
        } catch (error) {
            console.error('[TTSManager] 合成播放失败:', error);
            onFinished?.();
            return false;
        }
    }
    
    /**
     * 流式预加载 TTS 段落
     * 
     * 后台逐个加载，不等待全部完成
     * 播放时如果当前段落还在加载，会等待它
     */
    startPreload(segments: TTSSegment[]): void {
        console.log('[TTSManager] 开始流式预加载', segments.length, '个段落');
        
        this.currentSegments = segments;
        
        // 为每个段落创建加载任务
        for (const segment of segments) {
            const cacheKey = `segment_${segment.id}`;
            
            // 如果已缓存或正在加载，跳过
            const existing = this.audioCache.get(cacheKey);
            if (existing?.audioData || existing?.loading) {
                continue;
            }
            
            // 创建加载 Promise
            const loadPromise = this.loadSingleSegment(segment);
            
            // 标记为正在加载
            this.audioCache.set(cacheKey, {
                audioData: '',
                timestamp: Date.now(),
                loading: true,
                loadPromise,
            });
        }
    }
    
    /**
     * 加载单个段落
     */
    private async loadSingleSegment(segment: TTSSegment): Promise<string | null> {
        const cacheKey = `segment_${segment.id}`;
        
        try {
            console.log(`[TTSManager] 加载段落 ${segment.id}: ${segment.content.slice(0, 20)}...`);
            
            const response = await this.callSynthesizeAPI({
                text: segment.content,
                speaker: segment.speaker,
                instruction: segment.instruction,
            });
            
            if (!response.success || !response.audioData) {
                console.error(`[TTSManager] 段落 ${segment.id} 加载失败:`, response.error);
                this.audioCache.set(cacheKey, {
                    audioData: '',
                    timestamp: Date.now(),
                    loading: false,
                });
                return null;
            }
            
            // 检查音频数据是否有效
            if (response.audioData.length < 1000) {
                console.warn(`[TTSManager] 段落 ${segment.id} 音频数据太短 (${response.audioData.length}), 可能无效`);
            }
            
            console.log(`[TTSManager] 段落 ${segment.id} 加载完成, 大小: ${response.audioData.length}`);
            
            // 更新缓存
            this.audioCache.set(cacheKey, {
                audioData: response.audioData,
                timestamp: Date.now(),
                loading: false,
            });
            
            return response.audioData;
        } catch (error) {
            console.error(`[TTSManager] 段落 ${segment.id} 加载异常:`, error);
            this.audioCache.set(cacheKey, {
                audioData: '',
                timestamp: Date.now(),
                loading: false,
            });
            return null;
        }
    }
    
    /**
     * 播放段落 - 如果未加载完成则等待
     */
    async playSegment(segmentId: number, onFinished?: () => void): Promise<boolean> {
        const cacheKey = `segment_${segmentId}`;
        const cached = this.audioCache.get(cacheKey);
        
        // 如果正在加载，等待加载完成
        if (cached?.loading && cached.loadPromise) {
            console.log(`[TTSManager] 段落 ${segmentId} 正在加载，等待...`);
            await cached.loadPromise;
        }
        
        // 再次获取（可能已更新）
        const audioData = this.audioCache.get(cacheKey)?.audioData;
        
        if (!audioData || audioData.length < 100) {
            console.warn(`[TTSManager] 段落 ${segmentId} 无有效音频数据`);
            onFinished?.();
            return false;
        }
        
        this.onPlayFinishedCallback = onFinished || null;
        await this.playBase64Audio(audioData);
        return true;
    }
    
    /**
     * 兼容旧 API - 批量预加载 (内部转为流式)
     */
    async preloadSegments(segments: TTSSegment[]): Promise<Map<number, string>> {
        // 启动流式预加载
        this.startPreload(segments);
        
        // 返回空 Map，实际数据通过 playSegment 按需获取
        return new Map();
    }
    
    /**
     * 停止播放
     */
    stop() {
        // 停止 Web 平台音频
        if (this.currentWebAudio) {
            this.currentWebAudio.pause();
            this.currentWebAudio.currentTime = 0;
            this.currentWebAudio = null;
        }
        
        // 停止原生平台音频
        if (this.audioSource && this.isPlaying) {
            this.audioSource.stop();
        }
        
        this.isPlaying = false;
        this.onPlayFinishedCallback = null;
    }
    
    /**
     * 是否正在播放
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }
    
    /**
     * 检查指定段落是否已加载完成
     */
    isSegmentReady(segmentId: number): boolean {
        const cacheKey = `segment_${segmentId}`;
        const cached = this.audioCache.get(cacheKey);
        
        // 已加载完成且有有效数据
        if (cached && !cached.loading && cached.audioData && cached.audioData.length > 100) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 清空缓存
     */
    clearCache() {
        this.audioCache.clear();
    }
    
    // ============ 私有方法 ============
    
    /**
     * 调用合成 API
     */
    private async callSynthesizeAPI(body: {
        text?: string;
        speaker?: string;
        instruction?: string;
        segments?: TTSSegment[];
        narrativeText?: string;
    }): Promise<{
        success: boolean;
        audioData?: string;
        audioList?: Array<{ id: number; audioData: string }>;
        segments?: TTSSegment[];
        error?: string;
    }> {
        const url = `${this.apiBaseUrl}/api/tts/synthesize`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        
        return await response.json();
    }
    
    /**
     * 播放 Base64 编码的音频
     */
    private async playBase64Audio(base64Data: string): Promise<void> {
        if (!this.audioSource) {
            console.error('[TTSManager] AudioSource 未设置');
            this.onPlayFinished();
            return;
        }
        
        try {
            // Web 平台: 使用 Web Audio API
            if (sys.isBrowser) {
                await this.playBase64AudioWeb(base64Data);
            } else {
                // 原生平台: 使用 Cocos AudioClip
                await this.playBase64AudioNative(base64Data);
            }
        } catch (error) {
            console.error('[TTSManager] 播放失败:', error);
            this.onPlayFinished();
        }
    }
    
    /**
     * Web 平台播放 (使用 Audio 元素)
     */
    private async playBase64AudioWeb(base64Data: string): Promise<void> {
        return new Promise((resolve) => {
            // 调试: 检查 Base64 数据
            console.log('[TTSManager] 播放音频, Base64 长度:', base64Data?.length || 0);
            
            if (!base64Data || base64Data.length < 100) {
                console.error('[TTSManager] Base64 数据无效或太短');
                this.onPlayFinished();
                resolve();
                return;
            }
            
            // 停止之前的音频
            if (this.currentWebAudio) {
                this.currentWebAudio.pause();
                this.currentWebAudio = null;
            }
            
            const audio = new Audio(`data:audio/mp3;base64,${base64Data}`);
            this.currentWebAudio = audio; // 保存引用
            
            audio.onended = () => {
                console.log('[TTSManager] 音频播放结束');
                this.currentWebAudio = null;
                this.isPlaying = false;
                this.onPlayFinished();
                resolve();
            };
            
            audio.onerror = (e) => {
                console.error('[TTSManager] Web 音频播放错误:', e);
                this.currentWebAudio = null;
                this.isPlaying = false;
                this.onPlayFinished();
                resolve();
            };
            
            this.isPlaying = true;
            console.log('[TTSManager] 开始播放...');
            audio.play().catch((e) => {
                console.error('[TTSManager] 播放启动失败:', e);
                this.currentWebAudio = null;
                this.isPlaying = false;
                this.onPlayFinished();
                resolve();
            });
        });
    }
    
    /**
     * 原生平台播放 (转存文件后加载)
     */
    private async playBase64AudioNative(base64Data: string): Promise<void> {
        try {
            // 检查 jsb 是否可用
            if (typeof jsb === 'undefined' || !jsb.fileUtils) {
                console.error('[TTSManager] jsb.fileUtils 不可用');
                this.onPlayFinished();
                return;
            }
            
            // 生成临时文件路径
            const writablePath = jsb.fileUtils.getWritablePath();
            const tempFileName = `tts_${Date.now()}.mp3`;
            const tempFilePath = `${writablePath}${tempFileName}`;
            
            console.log('[TTSManager] 写入临时文件:', tempFilePath);
            
            // Base64 解码并写入文件
            const binaryData = this.base64ToArrayBuffer(base64Data);
            const uint8Array = new Uint8Array(binaryData);
            
            // 写入文件
            const success = jsb.fileUtils.writeDataToFile(uint8Array, tempFilePath);
            if (!success) {
                console.error('[TTSManager] 写入文件失败');
                this.onPlayFinished();
                return;
            }
            
            // 加载并播放
            assetManager.loadRemote<AudioClip>(tempFilePath, { ext: '.mp3' }, (err, clip) => {
                if (err || !clip) {
                    console.error('[TTSManager] 加载音频失败:', err);
                    this.cleanupTempFile(tempFilePath);
                    this.onPlayFinished();
                    return;
                }
                
                if (!this.audioSource) {
                    console.error('[TTSManager] AudioSource 未设置');
                    this.cleanupTempFile(tempFilePath);
                    this.onPlayFinished();
                    return;
                }
                
                this.currentClip = clip;
                this.audioSource.clip = clip;
                this.audioSource.loop = false;
                this.isPlaying = true;
                
                // 监听播放完成
                this.audioSource.node.once('ended', () => {
                    console.log('[TTSManager] 原生音频播放结束');
                    this.isPlaying = false;
                    this.cleanupTempFile(tempFilePath);
                    this.onPlayFinished();
                });
                
                console.log('[TTSManager] 原生平台开始播放...');
                this.audioSource.play();
            });
        } catch (error) {
            console.error('[TTSManager] 原生平台播放失败:', error);
            this.onPlayFinished();
        }
    }
    
    /**
     * Base64 转 ArrayBuffer
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    /**
     * 清理临时文件
     */
    private cleanupTempFile(filePath: string) {
        try {
            if (typeof jsb !== 'undefined' && jsb.fileUtils) {
                jsb.fileUtils.removeFile(filePath);
            }
        } catch (e) {
            // 忽略清理错误
        }
    }
    
    /**
     * 播放完成回调
     */
    private onPlayFinished() {
        this.isPlaying = false;
        if (this.onPlayFinishedCallback) {
            const callback = this.onPlayFinishedCallback;
            this.onPlayFinishedCallback = null;
            callback();
        }
    }
    
    /**
     * 生成缓存键
     */
    private generateCacheKey(text: string, speaker?: string, instruction?: string): string {
        return `${text}_${speaker || 'default'}_${instruction || 'none'}`;
    }
    
    /**
     * 从缓存获取
     */
    private getFromCache(key: string): string | null {
        const item = this.audioCache.get(key);
        if (item) {
            // 更新访问时间
            item.timestamp = Date.now();
            return item.audioData;
        }
        return null;
    }
    
    /**
     * 添加到缓存
     */
    private addToCache(key: string, audioData: string) {
        // 超出容量时清理最旧的
        if (this.audioCache.size >= this.maxCacheSize) {
            let oldestKey: string | null = null;
            let oldestTime = Infinity;
            
            for (const [k, v] of this.audioCache) {
                if (v.timestamp < oldestTime) {
                    oldestTime = v.timestamp;
                    oldestKey = k;
                }
            }
            
            if (oldestKey) {
                this.audioCache.delete(oldestKey);
            }
        }
        
        this.audioCache.set(key, {
            audioData,
            timestamp: Date.now(),
        });
    }
}

// 导出单例获取方法
export function getTTSManager(): TTSManager {
    return TTSManager.getInstance();
}
