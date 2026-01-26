import { APIConfig } from '../config/APIConfig';
import { SaveGame, FullSaveGame } from '../types/api.types';
import { APIService } from '../core/APIService';

/**
 * 存档 API
 */
export class SavesAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    /**
     * 获取存档列表
     * @param novelId 小说 ID（可选，不传则返回所有存档）
     */
    async getList(novelId?: string): Promise<SaveGame[]> {
        const params: Record<string, any> = {};
        if (novelId) {
            params.novelId = novelId;
        }
        return this.apiService.get<SaveGame[]>(
            APIConfig.ENDPOINTS.SAVES.LIST,
            params
        );
    }

    /**
     * 创建新存档
     * @param novelId 小说 ID
     * @param combat 战斗属性
     * @param intelligence 智力属性
     * @param charisma 魅力属性
     * @param will 意志属性
     */
    async create(
        novelId: string,
        combat: number,
        intelligence: number,
        charisma: number,
        will: number
    ): Promise<FullSaveGame> {
        return this.apiService.post<FullSaveGame>(
            APIConfig.ENDPOINTS.SAVES.CREATE,
            { novelId, combat, intelligence, charisma, will }
        );
    }

    /**
     * 获取存档详情
     */
    async getDetail(saveId: string): Promise<FullSaveGame> {
        return this.apiService.get<FullSaveGame>(
            `${APIConfig.ENDPOINTS.SAVES.DETAIL}/${saveId}`
        );
    }

    /**
     * 删除存档
     */
    async delete(saveId: string): Promise<void> {
        return this.apiService.delete<void>(
            `${APIConfig.ENDPOINTS.SAVES.DETAIL}/${saveId}`
        );
    }

    /**
     * 更新存档名称
     */
    async updateName(saveId: string, saveName: string): Promise<void> {
        return this.apiService.patch<void>(
            `${APIConfig.ENDPOINTS.SAVES.DETAIL}/${saveId}`,
            { saveName }
        );
    }
}
