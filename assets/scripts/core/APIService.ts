import { APIConfig } from '../config/APIConfig';
import { HttpMethod, ApiResponse, ApiError } from '../types/api.types';

/**
 * API 服务 - 封装所有 HTTP 请求
 */
export class APIService {
    private baseURL: string;
    private timeout: number;
    private tokenProvider: (() => string | null) | null = null;

    constructor() {
        this.baseURL = APIConfig.BASE_URL;
        this.timeout = APIConfig.TIMEOUT;
    }

    /**
     * 设置 Token 提供者
     */
    setTokenProvider(provider: () => string | null) {
        this.tokenProvider = provider;
    }

    /**
     * 通用请求方法
     */
    async request<T = any>(
        method: HttpMethod,
        url: string,
        data?: any,
        headers?: Record<string, string>
    ): Promise<T> {
        const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        // 构建请求头
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers,
        };

        // 自动添加 Token
        if (this.tokenProvider) {
            const token = this.tokenProvider();
            if (token) {
                requestHeaders['Authorization'] = `Bearer ${token}`;
            }
        }

        // 构建请求选项
        const options: RequestInit = {
            method,
            headers: requestHeaders,
            mode: 'cors',
        };

        // 添加请求体（GET 请求不需要）
        if (data && method !== HttpMethod.GET) {
            options.body = JSON.stringify(data);
        }

        try {
            // 创建超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            options.signal = controller.signal;

            // 发送请求
            const response = await fetch(fullURL, options);
            clearTimeout(timeoutId);

            // 解析响应
            let responseData: ApiResponse<T>;
            try {
                responseData = await response.json();
            } catch (e) {
                throw new ApiError('响应解析失败', 'PARSE_ERROR', response.status);
            }

            // 检查业务状态
            if (!responseData.success) {
                throw new ApiError(
                    responseData.error?.message || '请求失败',
                    responseData.error?.code || 'UNKNOWN_ERROR',
                    response.status
                );
            }

            return responseData.data as T;

        } catch (error: any) {
            // 处理超时错误
            if (error.name === 'AbortError') {
                throw new ApiError('请求超时', 'TIMEOUT');
            }

            // 处理网络错误
            if (error instanceof TypeError) {
                throw new ApiError('网络连接失败', 'NETWORK_ERROR');
            }

            // 重新抛出 ApiError
            if (error instanceof ApiError) {
                throw error;
            }

            // 其他错误
            throw new ApiError(error.message || '未知错误', 'UNKNOWN_ERROR');
        }
    }

    /**
     * GET 请求
     */
    async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
        let fullURL = url;
        
        // 添加查询参数
        if (params) {
            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
            fullURL = `${url}?${queryString}`;
        }

        return this.request<T>(HttpMethod.GET, fullURL);
    }

    /**
     * POST 请求
     */
    async post<T = any>(url: string, data?: any): Promise<T> {
        return this.request<T>(HttpMethod.POST, url, data);
    }

    /**
     * PUT 请求
     */
    async put<T = any>(url: string, data?: any): Promise<T> {
        return this.request<T>(HttpMethod.PUT, url, data);
    }

    /**
     * DELETE 请求
     */
    async delete<T = any>(url: string): Promise<T> {
        return this.request<T>(HttpMethod.DELETE, url);
    }

    /**
     * PATCH 请求
     */
    async patch<T = any>(url: string, data?: any): Promise<T> {
        return this.request<T>(HttpMethod.PATCH, url, data);
    }
}
