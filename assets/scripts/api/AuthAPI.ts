import { APIConfig } from '../config/APIConfig';
import { LoginResponse, RefreshTokenResponse, UserInfo } from '../types/api.types';
import { APIService } from '../core/APIService';

/**
 * 认证 API - 封装认证相关的 API 调用
 */
export class AuthAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    /**
     * 登录
     */
    async login(username: string, password: string): Promise<LoginResponse> {
        return this.apiService.post<LoginResponse>(
            APIConfig.ENDPOINTS.AUTH.LOGIN,
            { username, password }
        );
    }

    /**
     * 注册
     */
    async register(username: string, password: string): Promise<LoginResponse> {
        return this.apiService.post<LoginResponse>(
            APIConfig.ENDPOINTS.AUTH.REGISTER,
            { username, password }
        );
    }

    /**
     * 刷新 Token
     */
    async refresh(): Promise<RefreshTokenResponse> {
        return this.apiService.post<RefreshTokenResponse>(
            APIConfig.ENDPOINTS.AUTH.REFRESH
        );
    }

    /**
     * 登出
     */
    async logout(): Promise<void> {
        return this.apiService.post<void>(
            APIConfig.ENDPOINTS.AUTH.LOGOUT
        );
    }

    /**
     * 获取当前用户信息
     */
    async getMe(): Promise<UserInfo> {
        return this.apiService.get<UserInfo>(
            APIConfig.ENDPOINTS.AUTH.ME
        );
    }
}
