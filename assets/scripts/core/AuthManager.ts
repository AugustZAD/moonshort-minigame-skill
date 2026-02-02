import { sys } from 'cc';
import { StorageKeys, APIConfig } from '../config/APIConfig';
import { UserInfo, LoginResponse, RefreshTokenResponse, ApiError } from '../types/api.types';
import { APIService } from './APIService';

/**
 * 认证管理器 - 管理用户认证状态和 Token
 */
export class AuthManager {
    private apiService: APIService;
    private token: string | null = null;
    private tokenExpiresAt: Date | null = null;
    private userInfo: UserInfo | null = null;
    private refreshing: boolean = false;

    constructor(apiService: APIService) {
        this.apiService = apiService;
        this.loadFromStorage();
    }

    /**
     * 从本地存储加载认证信息
     */
    private loadFromStorage() {
        try {
            const token = sys.localStorage.getItem(StorageKeys.TOKEN);
            const expiresAtStr = sys.localStorage.getItem(StorageKeys.TOKEN_EXPIRES_AT);
            const userInfoStr = sys.localStorage.getItem(StorageKeys.USER_INFO);

            if (token && expiresAtStr) {
                this.token = token;
                this.tokenExpiresAt = new Date(expiresAtStr);
                
                // 如果 token 已过期，清理
                if (this.tokenExpiresAt < new Date()) {
                    this.clearAuth();
                    return;
                }
            }

            if (userInfoStr) {
                this.userInfo = JSON.parse(userInfoStr);
            }
        } catch (error) {
            console.error('[AuthManager] 加载认证信息失败:', error);
            this.clearAuth();
        }
    }

    /**
     * 保存认证信息到本地存储
     */
    private saveToStorage() {
        try {
            if (this.token && this.tokenExpiresAt) {
                sys.localStorage.setItem(StorageKeys.TOKEN, this.token);
                sys.localStorage.setItem(StorageKeys.TOKEN_EXPIRES_AT, this.tokenExpiresAt.toISOString());
            }

            if (this.userInfo) {
                sys.localStorage.setItem(StorageKeys.USER_INFO, JSON.stringify(this.userInfo));
            }
        } catch (error) {
            console.error('[AuthManager] 保存认证信息失败:', error);
        }
    }

    /**
     * 清理认证信息
     */
    private clearAuth() {
        this.token = null;
        this.tokenExpiresAt = null;
        this.userInfo = null;
        
        sys.localStorage.removeItem(StorageKeys.TOKEN);
        sys.localStorage.removeItem(StorageKeys.TOKEN_EXPIRES_AT);
        sys.localStorage.removeItem(StorageKeys.USER_INFO);
    }

    /**
     * 登录
     */
    async login(username: string, password: string): Promise<UserInfo> {
        try {
            const response = await this.apiService.post<LoginResponse>(
                APIConfig.ENDPOINTS.AUTH.LOGIN,
                { username, password }
            );

            // 保存认证信息
            this.token = response.token;
            this.tokenExpiresAt = new Date(response.expiresAt);
            this.userInfo = response.user;
            
            this.saveToStorage();

            console.log('[AuthManager] 登录成功:', this.userInfo);
            return this.userInfo;
        } catch (error) {
            console.error('[AuthManager] 登录失败:', error);
            throw error;
        }
    }

    /**
     * 登出
     */
    logout() {
        console.log('[AuthManager] 登出');
        this.clearAuth();
    }

    /**
     * 获取当前 Token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * 检查是否已登录
     */
    isAuthenticated(): boolean {
        return this.token !== null && 
               this.tokenExpiresAt !== null && 
               this.tokenExpiresAt > new Date();
    }

    /**
     * 获取用户信息
     */
    getUserInfo(): UserInfo | null {
        return this.userInfo;
    }

    /**
     * 检查 Token 是否即将过期
     */
    isTokenExpiringSoon(): boolean {
        if (!this.tokenExpiresAt) return false;
        
        const now = new Date().getTime();
        const expiresAt = this.tokenExpiresAt.getTime();
        const timeUntilExpiry = expiresAt - now;
        
        // 如果剩余时间少于阈值（1天），返回 true
        return timeUntilExpiry < APIConfig.TOKEN_REFRESH_BEFORE_EXPIRY_MS;
    }

    /**
     * 刷新 Token
     */
    async refreshToken(): Promise<void> {
        // 防止重复刷新
        if (this.refreshing) {
            return;
        }

        // 如果没有 token，不需要刷新
        if (!this.token) {
            throw new ApiError('未登录', 'UNAUTHORIZED');
        }

        this.refreshing = true;

        try {
            const response = await this.apiService.post<RefreshTokenResponse>(
                APIConfig.ENDPOINTS.AUTH.REFRESH
            );

            // 更新 Token
            this.token = response.token;
            this.tokenExpiresAt = new Date(response.expiresAt);
            
            this.saveToStorage();

            console.log('[AuthManager] Token 刷新成功');
        } catch (error) {
            console.error('[AuthManager] Token 刷新失败:', error);
            
            // 如果刷新失败，清理认证信息
            if (error instanceof ApiError && error.statusCode === 401) {
                this.clearAuth();
            }
            
            throw error;
        } finally {
            this.refreshing = false;
        }
    }

    /**
     * 确保 Token 有效（必要时自动刷新）
     */
    async ensureTokenValid(): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new ApiError('未登录', 'UNAUTHORIZED');
        }

        // 如果 token 即将过期，刷新它
        if (this.isTokenExpiringSoon()) {
            await this.refreshToken();
        }
    }

    /**
     * 设置认证信息（用于 OAuth 登录等外部获取 token 的场景）
     */
    setAuth(token: string, expiresAt: string | Date, userInfo: UserInfo) {
        this.token = token;
        this.tokenExpiresAt = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
        this.userInfo = userInfo;
        this.saveToStorage();
        console.log('[AuthManager] 认证信息已设置:', userInfo.username);
    }

    /**
     * 更新用户信息
     */
    updateUserInfo(userInfo: Partial<UserInfo>) {
        if (this.userInfo) {
            this.userInfo = { ...this.userInfo, ...userInfo };
            this.saveToStorage();
        }
    }

    /**
     * 从服务器刷新用户信息
     */
    async refreshUserInfo(): Promise<UserInfo> {
        try {
            const response = await this.apiService.get<UserInfo>(
                APIConfig.ENDPOINTS.AUTH.ME
            );

            this.userInfo = response;
            this.saveToStorage();

            console.log('[AuthManager] 用户信息已刷新:', this.userInfo);
            return this.userInfo;
        } catch (error) {
            console.error('[AuthManager] 刷新用户信息失败:', error);
            throw error;
        }
    }
}
