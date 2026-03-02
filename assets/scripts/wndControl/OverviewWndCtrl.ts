import { _decorator, Node } from 'cc';
import { WndBase } from '../core/WndBase';
import { NovelOverviewComponent } from '../../components/NovelOverviewComponent';

const { ccclass, property, menu } = _decorator;

/**
 * overviewWnd 控制器
 * 挂在 overviewWnd prefab 根节点上
 *
 * 流程：
 * selectCardWnd 点击 cardItem → Navigator.toWnd('overviewWnd', { novelId })
 * → WndManager 将 params 写入 SceneParams + addChild（触发子组件 onLoad）
 * → NovelOverviewComponent.onLoad() 从 SceneParams 读取 novelId 并加载详情
 *
 * 本控制器职责：
 * 1. 在 onWndOpen 阶段确保 NovelOverviewComponent 能正确初始化
 * 2. 管理 wnd 暂停 / 恢复 / 关闭生命周期
 */
@ccclass('OverviewWndCtrl')
@menu('WndControl/OverviewWndCtrl')
export class OverviewWndCtrl extends WndBase {
    @property({ type: Node, tooltip: 'NovelOverviewComponent 所在节点（留空则自动查找）' })
    overviewNode: Node | null = null;

    private _overviewComp: NovelOverviewComponent | null = null;

    onLoad() {
        // 查找 NovelOverviewComponent
        if (this.overviewNode) {
            this._overviewComp = this.overviewNode.getComponent(NovelOverviewComponent);
        }

        if (!this._overviewComp) {
            // 自动查找（向下递归搜索）
            this._overviewComp = this.node.getComponentInChildren(NovelOverviewComponent);
        }

        if (!this._overviewComp) {
            console.warn('[OverviewWndCtrl] 未找到 NovelOverviewComponent');
        }
    }

    protected onWndOpen(params: Record<string, any>): void {
        const novelId = params.novelId;
        if (!novelId) {
            console.error('[OverviewWndCtrl] 缺少 novelId 参数');
            return;
        }
        console.log('[OverviewWndCtrl] 打开 overviewWnd, novelId:', novelId);
        // NovelOverviewComponent 在 onLoad 中已通过 SceneParams 读取 novelId 并自动加载
        // 此处无需重复调用
    }

    protected onWndResume(): void {
        console.log('[OverviewWndCtrl] overviewWnd 恢复');
        // 从上层 wnd（如 addPointWnd）返回时，可在此刷新数据
    }

    protected onWndClose(): void {
        console.log('[OverviewWndCtrl] overviewWnd 关闭');
        this._overviewComp = null;
    }
}
