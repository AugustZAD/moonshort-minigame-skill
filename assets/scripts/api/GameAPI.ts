import { APIConfig } from '../config/APIConfig';
import { APIService } from '../core/APIService';
import {
    PlayerSave,
    SaveListItem,
    CreateSaveRequest,
    BCardData,
    EnrichedBCard,
    BCardEvaluationResult,
    ACardPool,
    ACardSelectResult,
    TransitionNarrative,
    CheckResult,
} from '../types/game.types';

/**
 * 游戏 API
 * 封装所有游戏相关接口（存档、A卡、B卡、过渡叙事等）
 */
export class GameAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    // ==================== 存档相关 ====================

    /**
     * 获取用户所有存档列表
     */
    async getSaves(novelId?: string): Promise<SaveListItem[]> {
        const params = novelId ? { novelId } : {};
        return this.apiService.get<SaveListItem[]>('/apiv2/saves', params);
    }

    /**
     * 获取存档详情
     */
    async getSaveDetail(saveId: number): Promise<PlayerSave> {
        return this.apiService.get<PlayerSave>(`/apiv2/saves/${saveId}`);
    }

    /**
     * 创建新存档
     */
    async createSave(request: CreateSaveRequest): Promise<PlayerSave> {
        return this.apiService.post<PlayerSave>('/apiv2/saves', request);
    }

    /**
     * 更新存档
     */
    async updateSave(saveId: number, updates: Partial<PlayerSave>): Promise<Partial<PlayerSave>> {
        return this.apiService.patch<Partial<PlayerSave>>(`/apiv2/saves/${saveId}`, updates);
    }

    /**
     * 删除存档
     */
    async deleteSave(saveId: number): Promise<void> {
        return this.apiService.delete<void>(`/apiv2/saves/${saveId}`);
    }

    // ==================== B 卡相关 ====================

    /**
     * 获取 B 卡原始数据
     */
    async getBCard(nodeIndex: number, novelId: string, branchId?: string): Promise<BCardData> {
        const params: Record<string, string> = { novelId };
        if (branchId) {
            params.branchId = branchId;
        }
        return this.apiService.get<BCardData>(`/apiv2/game/bcard/${nodeIndex}`, params);
    }

    /**
     * 获取 AI 解析后的 B 卡
     */
    async getEnrichedBCard(playerId: number): Promise<EnrichedBCard> {
        return this.apiService.post<EnrichedBCard>('/apiv2/game/bcard/enriched', { playerId });
    }

    /**
     * 结算 B 卡结局
     */
    async evaluateBCard(
        playerId: number,
        nodeIndex: number,
        checkResults?: CheckResult[]
    ): Promise<BCardEvaluationResult> {
        return this.apiService.post<BCardEvaluationResult>('/apiv2/game/bcard/evaluate', {
            playerId,
            nodeIndex,
            checkResults,
        });
    }

    // ==================== A 卡相关 ====================

    /**
     * 获取 A 卡池列表
     */
    async getACardPool(saveId?: number): Promise<ACardPool> {
        const params = saveId ? { saveId: saveId.toString() } : {};
        return this.apiService.get<ACardPool>('/apiv2/game/acard/pool', params);
    }

    /**
     * 选择 A 卡
     */
    async selectACard(saveId: number, cardId: string): Promise<ACardSelectResult> {
        return this.apiService.post<ACardSelectResult>('/apiv2/game/acard/select', {
            saveId,
            cardId,
        });
    }

    // ==================== 过渡叙事 ====================

    /**
     * 生成过渡叙事（B卡 → A卡）
     */
    async generateTransition(
        playerId: number,
        nodeIndex: number,
        resultType?: string
    ): Promise<TransitionNarrative> {
        return this.apiService.post<TransitionNarrative>('/apiv2/game/transition', {
            playerId,
            nodeIndex,
            resultType,
        });
    }
}
