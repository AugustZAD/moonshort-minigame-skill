import { APIConfig } from '../config/APIConfig';
import { Novel, PaginatedResponse } from '../types/api.types';
import { APIService } from '../core/APIService';

/**
 * 小说 API
 */
export class NovelsAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    /**
     * 获取小说列表
     * @param page 页码（默认 1）
     * @param limit 每页数量（默认 20）
     * @param language 语言过滤（可选）
     */
    async getList(page: number = 1, limit: number = 20, language?: string): Promise<PaginatedResponse<Novel>> {
        const params: Record<string, any> = { page, limit };
        if (language) {
            params.language = language;
        }
        return this.apiService.get<PaginatedResponse<Novel>>(
            APIConfig.ENDPOINTS.NOVELS.LIST,
            params
        );
    }

    /**
     * 获取小说详情
     */
    async getDetail(novelId: string): Promise<Novel> {
        return this.apiService.get<Novel>(
            `${APIConfig.ENDPOINTS.NOVELS.DETAIL}/${novelId}`
        );
    }

    /**
     * 点赞小说
     */
    async like(novelId: string): Promise<{ liked: boolean }> {
        return this.apiService.post<{ liked: boolean }>(
            `${APIConfig.ENDPOINTS.NOVELS.DETAIL}/${novelId}/like`
        );
    }

    /**
     * 取消点赞
     */
    async unlike(novelId: string): Promise<{ liked: boolean }> {
        return this.apiService.delete<{ liked: boolean }>(
            `${APIConfig.ENDPOINTS.NOVELS.DETAIL}/${novelId}/like`
        );
    }

    /**
     * 记录浏览
     */
    async view(novelId: string): Promise<void> {
        return this.apiService.post<void>(
            `${APIConfig.ENDPOINTS.NOVELS.DETAIL}/${novelId}/view`
        );
    }

    /**
     * 获取浏览历史
     */
    async getHistory(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Novel>> {
        return this.apiService.get<PaginatedResponse<Novel>>(
            APIConfig.ENDPOINTS.NOVELS.HISTORY,
            { page, limit }
        );
    }
}
