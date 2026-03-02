import { assetManager, director, Director, game, Game, Node, Scene } from 'cc';
import { Analytics } from '../../analytics/AnalyticsManager';
import { trackHistoryView, trackHomeView, trackIndexView, trackLoginView, trackNotificationsView, trackSettingsView } from '../../analytics/UiEvents';
import { SceneParams } from './SceneParams';
import { WndManager, WndOpenOptions } from './WndManager';

/**
 * 合法的主场景名称
 */
type MainScene = 'login' | 'index' | 'game';

/**
 * Navigator 统一导航器
 * 
 * 场景跳转：明确的业务行为，不堆栈
 * wnd 导航：同场景内栈式管理
 * 
 * ```typescript
 * Navigator.toScene('game', { saveId: 123 });
 * Navigator.toWnd('overviewWnd', { novelId: '123' });
 * Navigator.back();       // wnd 栈内返回
 * Navigator.replace('settingWnd');
 * ```
 */
class NavigatorManager {
    private static _instance: NavigatorManager | null = null;
    private _currentScene: string = '';
    private _inited: boolean = false;

    /** 场景加载后待打开的 wnd */
    private _pendingWnd: { wndName: string; params: Record<string, any> } | null = null;

    static get instance(): NavigatorManager {
        if (!this._instance) {
            this._instance = new NavigatorManager();
        }
        return this._instance;
    }

    private constructor() {}

    init() {
        if (this._inited) return;
        this._inited = true;
        Analytics.init();
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this._onAfterSceneLaunch, this);
    }

    // ==================== 场景跳转 ====================

    /** 场景资源目录（db://assets/newScenes） */
    private static readonly SCENE_DIR = 'newScenes';

    /**
     * 跳转场景（login / index / game）
     * 场景间是明确的业务跳转，不堆栈
     * 从 db://assets/newScenes 目录加载
     */
    toScene(sceneName: MainScene, params?: Record<string, any>) {
        this.init();
        console.log(`[Navigator] toScene 调用：sceneName=${sceneName}, params=`, params);
        if (params) {
            SceneParams.set(params);
            console.log('[Navigator] SceneParams 已设置:', JSON.stringify(params, null, 2));
        }
        const scenePath = `${NavigatorManager.SCENE_DIR}/${sceneName}`;
        console.log(`[Navigator] 即将加载场景: ${scenePath}`);

        const bundle = assetManager.getBundle('main');
        if (bundle) {
            bundle.loadScene(scenePath, (err, sceneAsset) => {
                if (err) {
                    console.error(`[Navigator] 从 ${NavigatorManager.SCENE_DIR} 加载场景失败: ${sceneName}`, err);
                    return;
                }
                director.runScene(sceneAsset.scene);
            });
        } else {
            console.error('[Navigator] main bundle 未就绪，无法加载场景');
        }
    }

    /**
     * 跳转场景后自动打开指定 wnd（场景加载完成后在 WndRoot 下生成）
     */
    toSceneThenWnd(sceneName: MainScene, wndName: string, wndParams?: Record<string, any>) {
        this._pendingWnd = { wndName, params: wndParams || {} };
        this.toScene(sceneName);
    }

    // ==================== wnd 导航 ====================

    /** 打开 wnd（入栈） */
    async toWnd(wndName: string, params?: Record<string, any>, options?: WndOpenOptions): Promise<Node | null> {
        this.init();
        return WndManager.instance.open(wndName, params, options);
    }

    /** 替换当前 wnd */
    async replace(wndName: string, params?: Record<string, any>): Promise<Node | null> {
        this.init();
        return WndManager.instance.replace(wndName, params);
    }

    /** 清空整个 wnd 栈并打开新 wnd（用于 Tab 切换） */
    async replaceAll(wndName: string, params?: Record<string, any>): Promise<Node | null> {
        this.init();
        return WndManager.instance.replaceAll(wndName, params);
    }

    /** 返回（wnd 栈内返回） */
    back(): boolean {
        this.init();
        return WndManager.instance.back();
    }

    // ==================== 状态 ====================

    get currentScene(): string { return this._currentScene; }
    get currentWnd(): string { return WndManager.instance.currentWndName; }
    get canBack(): boolean { return WndManager.instance.canBack; }

    // ==================== 内部 ====================

    private _onAfterSceneLaunch(scene: Scene | string) {
        const name = typeof scene === 'string' ? scene : scene?.name;
        if (name) this._currentScene = name;

        // 场景加载后打开待处理的 wnd
        if (this._pendingWnd) {
            const pending = this._pendingWnd;
            this._pendingWnd = null;
            console.log(`[Navigator] 场景加载完成，打开待处理 wnd: ${pending.wndName}`);
            this.toWnd(pending.wndName, pending.params);
        }

        trackHomeView();
        trackIndexView();
        trackNotificationsView();
        trackHistoryView();
        trackLoginView();
        trackSettingsView();
    }
}

export const Navigator = NavigatorManager.instance;

game.once(Game.EVENT_GAME_INITED, () => {
    Navigator.init();
});
