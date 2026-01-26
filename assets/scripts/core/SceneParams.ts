/**
 * 场景参数管理器
 * 用于在场景跳转时传递参数
 * 
 * 使用示例：
 * ```typescript
 * // 跳转时传递参数
 * SceneParams.set({ novelId: '123', chapterId: 1 });
 * director.loadScene('overview');
 * 
 * // 目标场景获取参数
 * const params = SceneParams.get<{ novelId: string, chapterId: number }>();
 * console.log(params.novelId); // '123'
 * ```
 */
export class SceneParamsManager {
    private static _instance: SceneParamsManager | null = null;
    private _params: Record<string, any> = {};
    private _consumed: boolean = false;

    static get instance(): SceneParamsManager {
        if (!this._instance) {
            this._instance = new SceneParamsManager();
        }
        return this._instance;
    }

    private constructor() {}

    /**
     * 设置场景参数（在跳转前调用）
     * @param params 要传递的参数对象
     */
    set(params: Record<string, any>): void {
        this._params = { ...params };
        this._consumed = false;
    }

    /**
     * 获取场景参数（在目标场景中调用）
     * @param consume 是否消费参数（默认 true，获取后自动清空）
     * @returns 参数对象
     */
    get<T = Record<string, any>>(consume: boolean = true): T {
        const params = { ...this._params } as T;
        
        if (consume && !this._consumed) {
            this._consumed = true;
            this._params = {};
        }
        
        return params;
    }

    /**
     * 获取单个参数
     * @param key 参数键
     * @param defaultValue 默认值
     */
    getValue<T = any>(key: string, defaultValue?: T): T | undefined {
        return this._params[key] ?? defaultValue;
    }

    /**
     * 检查是否有参数
     */
    has(key?: string): boolean {
        if (key) {
            return key in this._params;
        }
        return Object.keys(this._params).length > 0;
    }

    /**
     * 清空参数
     */
    clear(): void {
        this._params = {};
        this._consumed = false;
    }
}

// 导出单例访问器
export const SceneParams = SceneParamsManager.instance;
