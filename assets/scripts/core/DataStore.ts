import { NovelsAPI } from '../api/NovelsAPI';
import { SavesAPI } from '../api/SavesAPI';
import { MallAPI } from '../api/MallAPI';
import { NotificationsAPI } from '../api/NotificationsAPI';
import { APIService } from './APIService';
import { Novel, SaveGame, MallData, Notification, PaginatedResponse, UserInfo } from '../types/api.types';

/**
 * 用户信息响应（/apiv2/auth/me 接口返回）
 */
export interface UserInfoResponse {
    id: string;
    username: string;
    gems: number;
    isActivated: boolean;
    inviteCode?: string;
    unreadMessageCount?: number;
}

/**
 * 缓存项结构
 */
interface CacheItem<T> {
    data: T;
    timestamp: number;
    version: number;
}

/**
 * 数据更新事件
 */
export type DataUpdateListener<T> = (data: T, isFromCache: boolean) => void;

/**
 * 缓存配置
 */
interface CacheConfig {
    /** 缓存过期时间（毫秒），默认 5 分钟 */
    maxAge: number;
    /** 是否持久化到 localStorage */
    persist: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 分钟
    persist: true,
};

/**
 * DataStore - 数据缓存中心
 * 
 * 策略：本地优先 + 后台刷新 (Stale-While-Revalidate)
 * 1. 先返回缓存数据（立即可用）
 * 2. 后台请求最新数据
 * 3. 数据更新后通知所有监听者
 */
export class DataStore {
    private static _instance: DataStore | null = null;

    private apiService: APIService | null = null;
    private novelsAPI: NovelsAPI | null = null;
    private savesAPI: SavesAPI | null = null;
    private mallAPI: MallAPI | null = null;
    private notificationsAPI: NotificationsAPI | null = null;

    // 内存缓存
    private cache: Map<string, CacheItem<any>> = new Map();
    
    // 数据更新监听器
    private listeners: Map<string, Set<DataUpdateListener<any>>> = new Map();

    // 正在进行的请求（防止重复请求）
    private pendingRequests: Map<string, Promise<any>> = new Map();

    // 版本号（用于判断数据是否更新）
    private version: number = 0;

    private constructor() {
        console.log('[DataStore] 初始化...');
    }

    static getInstance(): DataStore {
        if (!DataStore._instance) {
            DataStore._instance = new DataStore();
        }
        return DataStore._instance;
    }

    /**
     * 初始化 API 服务
     */
    init(apiService: APIService) {
        this.apiService = apiService;
        this.novelsAPI = new NovelsAPI(apiService);
        this.savesAPI = new SavesAPI(apiService);
        this.mallAPI = new MallAPI(apiService);
        this.notificationsAPI = new NotificationsAPI(apiService);
        console.log('[DataStore] API 服务初始化完成');
    }

    // ==================== 缓存操作 ====================

    /**
     * 获取缓存 Key（带环境前缀）
     */
    private getCacheKey(key: string): string {
        return `datastore_${key}`;
    }

    /**
     * 从缓存获取数据
     */
    private getFromCache<T>(key: string): CacheItem<T> | null {
        // 优先从内存缓存获取
        const memCache = this.cache.get(key);
        if (memCache) {
            return memCache as CacheItem<T>;
        }

        // 尝试从 localStorage 获取
        try {
            const stored = localStorage.getItem(this.getCacheKey(key));
            if (stored) {
                const item = JSON.parse(stored) as CacheItem<T>;
                // 写入内存缓存
                this.cache.set(key, item);
                return item;
            }
        } catch (e) {
            console.warn('[DataStore] 读取缓存失败:', key, e);
        }

        return null;
    }

    /**
     * 写入缓存
     */
    private setCache<T>(key: string, data: T, persist: boolean = true) {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            version: ++this.version,
        };

        // 写入内存缓存
        this.cache.set(key, item);

        // 持久化到 localStorage
        if (persist) {
            try {
                localStorage.setItem(this.getCacheKey(key), JSON.stringify(item));
            } catch (e) {
                console.warn('[DataStore] 写入缓存失败:', key, e);
            }
        }
    }

    /**
     * 检查缓存是否过期
     */
    private isCacheExpired(item: CacheItem<any>, maxAge: number): boolean {
        return Date.now() - item.timestamp > maxAge;
    }

    /**
     * 清除指定缓存
     */
    clearCache(key: string) {
        this.cache.delete(key);
        try {
            localStorage.removeItem(this.getCacheKey(key));
        } catch (e) {
            // ignore
        }
    }

    /**
     * 清除所有缓存
     */
    clearAllCache() {
        this.cache.clear();
        // 清除 localStorage 中所有 datastore_ 开头的 key
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('datastore_'));
            keys.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            // ignore
        }
    }

    // ==================== 监听器操作 ====================

    /**
     * 订阅数据更新
     */
    subscribe<T>(key: string, listener: DataUpdateListener<T>): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key)!.add(listener);

        // 返回取消订阅函数
        return () => {
            this.listeners.get(key)?.delete(listener);
        };
    }

    /**
     * 通知所有监听者
     */
    private notify<T>(key: string, data: T, isFromCache: boolean) {
        const listeners = this.listeners.get(key);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data, isFromCache);
                } catch (e) {
                    console.error('[DataStore] 监听器执行错误:', e);
                }
            });
        }
    }

    // ==================== 核心数据获取方法 ====================

    /**
     * 通用数据获取（支持 SWR 策略）
     * 
     * @param key 缓存 key
     * @param fetcher 数据获取函数
     * @param config 缓存配置
     * @returns 数据（优先返回缓存）
     */
    async fetchWithSWR<T>(
        key: string,
        fetcher: () => Promise<T>,
        config: Partial<CacheConfig> = {}
    ): Promise<T> {
        const { maxAge, persist } = { ...DEFAULT_CONFIG, ...config };

        // 1. 尝试从缓存获取
        const cached = this.getFromCache<T>(key);
        
        if (cached) {
            // 有缓存，先返回缓存数据
            this.notify(key, cached.data, true);

            // 如果缓存未过期，直接返回
            if (!this.isCacheExpired(cached, maxAge)) {
                return cached.data;
            }

            // 缓存已过期，后台刷新
            this.revalidate(key, fetcher, persist);
            return cached.data;
        }

        // 2. 没有缓存，需要等待请求完成
        return this.revalidate(key, fetcher, persist);
    }

    /**
     * 重新验证/刷新数据
     */
    private async revalidate<T>(
        key: string,
        fetcher: () => Promise<T>,
        persist: boolean
    ): Promise<T> {
        // 防止重复请求
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key) as Promise<T>;
        }

        const request = (async () => {
            try {
                const data = await fetcher();
                
                // 更新缓存
                this.setCache(key, data, persist);
                
                // 通知监听者（新数据）
                this.notify(key, data, false);
                
                return data;
            } finally {
                this.pendingRequests.delete(key);
            }
        })();

        this.pendingRequests.set(key, request);
        return request;
    }

    /**
     * 强制刷新数据
     */
    async forceRefresh<T>(
        key: string,
        fetcher: () => Promise<T>,
        persist: boolean = true
    ): Promise<T> {
        this.clearCache(key);
        return this.revalidate(key, fetcher, persist);
    }

    // ==================== 业务数据方法 ====================

    /**
     * 获取小说列表
     */
    async getNovels(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Novel>> {
        if (!this.novelsAPI) throw new Error('DataStore 未初始化');

        const key = `novels_${page}_${limit}`;
        return this.fetchWithSWR(key, () => this.novelsAPI!.getList(page, limit));
    }

    /**
     * 获取小说详情
     */
    async getNovelDetail(novelId: string): Promise<Novel> {
        if (!this.novelsAPI) throw new Error('DataStore 未初始化');

        const key = `novel_${novelId}`;
        return this.fetchWithSWR(key, () => this.novelsAPI!.getDetail(novelId));
    }

    /**
     * 获取存档列表
     */
    async getSaves(novelId?: string): Promise<SaveGame[]> {
        if (!this.savesAPI) throw new Error('DataStore 未初始化');

        const key = novelId ? `saves_${novelId}` : 'saves_all';
        return this.fetchWithSWR(key, () => this.savesAPI!.getList(novelId));
    }

    /**
     * 获取商城数据
     */
    async getMallData(): Promise<MallData> {
        if (!this.mallAPI) throw new Error('DataStore 未初始化');

        return this.fetchWithSWR('mall', () => this.mallAPI!.getItems());
    }

    /**
     * 获取通知列表
     */
    async getNotifications(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Notification>> {
        if (!this.notificationsAPI) throw new Error('DataStore 未初始化');

        const key = `notifications_${page}_${limit}`;
        return this.fetchWithSWR(key, () => this.notificationsAPI!.getList(page, limit));
    }

    /**
     * 获取用户信息（金币、用户名等）
     */
    async getUserInfo(): Promise<UserInfoResponse> {
        if (!this.apiService) throw new Error('DataStore 未初始化');

        return this.fetchWithSWR(
            'user_info',
            () => this.apiService!.get<UserInfoResponse>('/apiv2/auth/me'),
            { maxAge: 2 * 60 * 1000 } // 用户信息 2 分钟过期
        );
    }

    /**
     * 获取浏览历史
     */
    async getHistory(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Novel>> {
        if (!this.novelsAPI) throw new Error('DataStore 未初始化');

        const key = `history_${page}_${limit}`;
        return this.fetchWithSWR(key, () => this.novelsAPI!.getHistory(page, limit));
    }

    // ==================== 预加载 ====================

    /**
     * 预加载所有核心数据
     * 在进入游戏前调用，提前加载常用数据
     */
    async preloadAll(): Promise<void> {
        console.log('[DataStore] 开始预加载数据...');

        const tasks: Promise<any>[] = [];

        // 首先预加载用户信息（金币、用户名等）
        if (this.apiService) {
            tasks.push(
                this.getUserInfo().catch(e => console.warn('[DataStore] 预加载用户信息失败:', e))
            );
        }

        // 并行预加载其他数据
        if (this.novelsAPI) {
            tasks.push(
                this.getNovels(1, 20).catch(e => console.warn('[DataStore] 预加载小说失败:', e))
            );
            tasks.push(
                this.getHistory(1, 20).catch(e => console.warn('[DataStore] 预加载历史失败:', e))
            );
        }

        if (this.savesAPI) {
            tasks.push(
                this.getSaves().catch(e => console.warn('[DataStore] 预加载存档失败:', e))
            );
        }

        if (this.mallAPI) {
            tasks.push(
                this.getMallData().catch(e => console.warn('[DataStore] 预加载商城失败:', e))
            );
        }

        if (this.notificationsAPI) {
            tasks.push(
                this.getNotifications(1, 20).catch(e => console.warn('[DataStore] 预加载通知失败:', e))
            );
        }

        await Promise.all(tasks);
        console.log('[DataStore] 预加载完成');
    }

    /**
     * 预加载指定小说相关数据
     */
    async preloadNovelData(novelId: string): Promise<void> {
        console.log('[DataStore] 预加载小说数据:', novelId);

        await Promise.all([
            this.getNovelDetail(novelId).catch(e => console.warn('[DataStore] 预加载小说详情失败:', e)),
            this.getSaves(novelId).catch(e => console.warn('[DataStore] 预加载存档失败:', e)),
        ]);
    }

    // ==================== 数据变更（写操作后刷新缓存）====================

    /**
     * 创建存档后刷新缓存
     */
    invalidateSaves(novelId?: string) {
        this.clearCache(novelId ? `saves_${novelId}` : 'saves_all');
        this.clearCache('saves_all');
    }

    /**
     * 小说操作后刷新缓存
     */
    invalidateNovel(novelId: string) {
        this.clearCache(`novel_${novelId}`);
    }

    /**
     * 用户信息变更后刷新缓存（如购买商品后金币变化）
     */
    invalidateUserInfo() {
        this.clearCache('user_info');
    }

    /**
     * 商城数据变更后刷新缓存
     */
    invalidateMall() {
        this.clearCache('mall');
    }

    /**
     * 历史记录变更后刷新缓存
     */
    invalidateHistory() {
        // 清除所有历史缓存
        this.cache.forEach((_, key) => {
            if (key.startsWith('history_')) {
                this.clearCache(key);
            }
        });
    }

    /**
     * 重置单例（仅用于测试）
     */
    static reset(): void {
        DataStore._instance = null;
    }
}
