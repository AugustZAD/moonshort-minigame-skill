import { APIConfig } from '../config/APIConfig';
import { MallData } from '../types/api.types';
import { APIService } from '../core/APIService';

/**
 * 商城 API
 */
export class MallAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    /**
     * 获取商城商品列表
     */
    async getItems(): Promise<MallData> {
        return this.apiService.get<MallData>(
            APIConfig.ENDPOINTS.MALL.ITEMS
        );
    }

    /**
     * 购买商品
     * @param itemId 商品 ID
     * @param quantity 购买数量（默认 1）
     */
    async purchase(itemId: string, quantity: number = 1): Promise<{ success: boolean; message: string }> {
        return this.apiService.post<{ success: boolean; message: string }>(
            APIConfig.ENDPOINTS.MALL.PURCHASE,
            { itemId, quantity }
        );
    }
}
