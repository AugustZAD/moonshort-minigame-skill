import { APIService } from './APIService';
import { AuthManager } from './AuthManager';

/**
 * 游戏管理器 - 全局单例（自动初始化）
 * 不需要在场景中挂载，首次访问时自动创建
 */
export class GameManager {
    private static _instance: GameManager | null = null;
    
    private _apiService: APIService;
    private _authManager: AuthManager;

    /**
     * 私有构造函数，防止外部实例化
     */
    private constructor() {
        console.log('[GameManager] 初始化...');

        // 创建 API 服务
        this._apiService = new APIService();

        // 创建认证管理器
        this._authManager = new AuthManager(this._apiService);

        // 设置 Token 提供者
        this._apiService.setTokenProvider(() => {
            return this._authManager.getToken();
        });

        console.log('[GameManager] 初始化完成');
        
        // 检查登录状态
        if (this._authManager.isAuthenticated()) {
            console.log('[GameManager] 用户已登录:', this._authManager.getUserInfo());
        } else {
            console.log('[GameManager] 用户未登录');
        }
    }

    /**
     * 获取单例实例（懒加载，首次访问时自动创建）
     */
    static getInstance(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }

    /**
     * 获取 API 服务
     */
    getAPI(): APIService {
        return this._apiService;
    }

    /**
     * 获取认证管理器
     */
    getAuth(): AuthManager {
        return this._authManager;
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn(): boolean {
        return this._authManager.isAuthenticated();
    }

    /**
     * 重置单例（仅用于测试）
     */
    static reset(): void {
        GameManager._instance = null;
    }
}
