import { APIService } from '../core/APIService';
import { Notification, PaginatedResponse } from '../types/api.types';

/**
 * 通知 API
 */
export class NotificationsAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    /**
     * 获取通知列表
     * @param page 页码（默认 1）
     * @param limit 每页数量（默认 20）
     */
    async getList(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Notification>> {
        return this.apiService.get<PaginatedResponse<Notification>>(
            '/apiv2/notifications',
            { page, limit }
        );
    }

    /**
     * 创建通知（管理员功能）
     */
    async create(title: string, content: string): Promise<Notification> {
        return this.apiService.post<Notification>(
            '/apiv2/notifications',
            { title, content }
        );
    }
}
