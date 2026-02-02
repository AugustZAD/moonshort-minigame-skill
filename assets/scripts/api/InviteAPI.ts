import { APIConfig } from '../config/APIConfig';
import { InviteInfo, InviteValidationResult, UserInfo } from '../types/api.types';
import { APIService } from '../core/APIService';

/**
 * 激活响应
 */
export interface ActivateResponse {
    message: string;
    user: UserInfo;
}

/**
 * 邀请码 API - 封装邀请码相关的 API 调用
 */
export class InviteAPI {
    private apiService: APIService;

    constructor(apiService: APIService) {
        this.apiService = apiService;
    }

    /**
     * 获取当前用户的邀请码信息
     */
    async getInviteInfo(): Promise<InviteInfo> {
        return this.apiService.get<InviteInfo>(
            APIConfig.ENDPOINTS.AUTH.INVITE_INFO
        );
    }

    /**
     * 验证邀请码有效性
     */
    async validateInviteCode(inviteCode: string): Promise<InviteValidationResult> {
        return this.apiService.post<InviteValidationResult>(
            APIConfig.ENDPOINTS.AUTH.INVITE_VALIDATE,
            { inviteCode }
        );
    }

    /**
     * 激活账户
     * @param inviteCode 6位邀请码
     */
    async activateAccount(inviteCode: string): Promise<ActivateResponse> {
        return this.apiService.post<ActivateResponse>(
            APIConfig.ENDPOINTS.AUTH.ACTIVATE,
            { inviteCode }
        );
    }
}
